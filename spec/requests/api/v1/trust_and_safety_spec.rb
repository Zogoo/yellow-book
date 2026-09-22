require "rails_helper"

RSpec.describe "Trust and safety", type: :request do
  let(:owner) { create(:user, role: "company") }
  let!(:company) { create(:company, owner: owner) }
  let(:user) { create(:user) }
  let(:admin) { create(:admin, :super_admin) }

  describe "public exposure" do
    let!(:approved) { create(:review, company: company, reviewer_email: "reviewer@example.com") }
    let!(:pending_review) { create(:review, :pending, company: company, reviewer_email: "hidden@example.com") }

    it "never returns unmoderated reviews to anonymous callers, even with a status filter" do
      get "/api/v1/agency/reviews", params: { companyId: company.id, status: "pending" }
      expect(response).to have_http_status(:ok)
      expect(data.map { |r| r["id"] }).to eq([ approved.id ])
    end

    it "never returns the reviewer's email to anonymous callers" do
      get "/api/v1/agency/reviews", params: { companyId: company.id }
      expect(data.first["reviewerEmail"]).to be_nil
      get "/api/v1/reviews/recent"
      expect(data.first["reviewerEmail"]).to be_nil
    end

    it "shows the reviewer's email to moderators" do
      get "/api/v1/reviews/recent", headers: auth_headers(admin)
      expect(data.map { |r| r["reviewerEmail"] }).to include("reviewer@example.com")
    end

    it "keeps /reviews/recent a public platform feed for signed-in customers" do
      other = create(:review, company: create(:company))
      get "/api/v1/reviews/recent", headers: auth_headers(user)
      expect(data.map { |r| r["id"] }).to include(approved.id, other.id)
    end

    it "shows a company's published reviews to everyone, signed in or not" do
      # A regression guard: a signed-in customer once saw only their own reviews here.
      get "/api/v1/agency/reviews", params: { companyId: company.id }
      expect(data.map { |r| r["id"] }).to eq([ approved.id ])

      get "/api/v1/agency/reviews", params: { companyId: company.id }, headers: auth_headers(user)
      expect(data.map { |r| r["id"] }).to eq([ approved.id ])

      mine = create(:review, :pending, company: company, user: user)
      get "/api/v1/agency/reviews", params: { companyId: company.id }, headers: auth_headers(user)
      expect(data.map { |r| r["id"] }).to contain_exactly(approved.id, mine.id)

      get "/api/v1/agency/reviews", params: { companyId: company.id }, headers: auth_headers(admin)
      expect(data.map { |r| r["id"] }).to contain_exactly(approved.id, pending_review.id, mine.id)
    end

    it "refuses reactions on unpublished reviews" do
      post "/api/v1/agency/reviews/#{pending_review.id}/like", headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "suspension" do
    it "stops a suspended user from using an existing token or signing in again" do
      headers = auth_headers(user)
      get "/api/v1/user/profile", headers: headers
      expect(response).to have_http_status(:ok)

      user.update!(status: "suspended")
      get "/api/v1/user/profile", headers: headers
      expect(response).to have_http_status(:unauthorized)

      post "/api/v1/auth/login", params: { email: user.email, password: "UserSecure123!" }, as: :json
      expect(response).to have_http_status(:forbidden)
    end

    it "revokes sessions when an admin suspends an account" do
      headers = auth_headers(user)
      put "/api/v1/users/#{user.id}", params: { status: "suspended" }, headers: auth_headers(admin), as: :json
      expect(response).to have_http_status(:ok)
      get "/api/v1/user/profile", headers: headers
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "reviews" do
    it "allows one review per customer per company and points at the existing one" do
      post "/api/v1/agency/reviews", params: { companyId: company.id, rating: 5, content: "First take" }, headers: auth_headers(user), as: :json
      expect(response).to have_http_status(:created)
      first_id = data["id"]

      post "/api/v1/agency/reviews", params: { companyId: company.id, rating: 1, content: "Second take" }, headers: auth_headers(user), as: :json
      expect(response).to have_http_status(:conflict)
      expect(json["message"]).to match(/already reviewed/i)
      expect(json.dig("details", "reviewId")).to eq(first_id)
    end

    it "lets a company owner review other companies but not their own" do
      other = create(:company)
      post "/api/v1/agency/reviews", params: { companyId: other.id, rating: 4, content: "Useful supplier" }, headers: auth_headers(owner), as: :json
      expect(response).to have_http_status(:created)

      post "/api/v1/agency/reviews", params: { companyId: company.id, rating: 5, content: "We are great" }, headers: auth_headers(owner), as: :json
      expect(response).to have_http_status(:forbidden)
      expect(json["message"]).to match(/your own company/i)
    end

    it "counts a share once per person" do
      review = create(:review, company: company)
      2.times { post "/api/v1/agency/reviews/#{review.id}/share", headers: auth_headers(user) }
      expect(data["shares"]).to eq(1)
    end

    it "records who moderated a review and why" do
      review = create(:review, :pending, company: company)
      patch "/api/v1/agency/reviews/#{review.id}", params: { status: "rejected", statusReason: "Not about a purchase" }, headers: auth_headers(admin), as: :json
      expect(response).to have_http_status(:ok)
      expect(review.reload.moderated_by_admin_id).to eq(admin.id)
      expect(review.status_reason).to eq("Not about a purchase")
      expect(data["statusReason"]).to eq("Not about a purchase")
    end

    it "lets a company rewrite a reply that was rejected" do
      review = create(:review, company: company)
      post "/api/v1/agency/reviews/#{review.id}/reply", params: { reply_text: "First reply" }, headers: auth_headers(owner), as: :json
      expect(response).to have_http_status(:created)

      patch "/api/v1/agency/reviews/#{review.id}", params: { companyResponseStatus: "rejected" }, headers: auth_headers(admin), as: :json
      post "/api/v1/agency/reviews/#{review.id}/reply", params: { reply_text: "Rewritten reply" }, headers: auth_headers(owner), as: :json
      expect(response).to have_http_status(:created)
      expect(data.dig("companyResponse", "text")).to eq("Rewritten reply")
    end
  end

  describe "notifications" do
    it "tells the company about a new review and the author about the decision" do
      post "/api/v1/agency/reviews", params: { companyId: company.id, rating: 5, content: "Lovely service" }, headers: auth_headers(user), as: :json
      review_id = data["id"]
      expect(Notification.where(company_id: company.id).last.title).to match(/new .* review/i)

      patch "/api/v1/agency/reviews/#{review_id}", params: { status: "approved" }, headers: auth_headers(admin), as: :json
      expect(Notification.where(user_id: user.id).last.title).to match(/published/i)
    end
  end

  describe "destructive actions" do
    it "refuses to delete an account whose companies hold other people's reviews" do
      create(:review, company: company)
      delete "/api/v1/users/#{owner.id}", headers: auth_headers(admin)
      expect(response).to have_http_status(:conflict)
      expect(json["message"]).to match(/reassign or delete/i)
      expect(User.exists?(owner.id)).to be(true)
    end
  end

  describe "passwords" do
    it "changes a password only with the current one, and ends other sessions" do
      other_session = auth_headers(user)
      headers = auth_headers(user)

      put "/api/v1/auth/password", params: { currentPassword: "wrong", password: "BrandNewSecret123!" }, headers: headers, as: :json
      expect(response).to have_http_status(:unauthorized)

      put "/api/v1/auth/password", params: { currentPassword: "UserSecure123!", password: "short" }, headers: headers, as: :json
      expect(response).to have_http_status(:bad_request)

      put "/api/v1/auth/password", params: { currentPassword: "UserSecure123!", password: "BrandNewSecret123!" }, headers: headers, as: :json
      expect(response).to have_http_status(:ok)

      get "/api/v1/auth/me", headers: headers
      expect(response).to have_http_status(:ok)
      get "/api/v1/auth/me", headers: other_session
      expect(response).to have_http_status(:unauthorized)

      post "/api/v1/auth/login", params: { email: user.email, password: "BrandNewSecret123!" }, as: :json
      expect(response).to have_http_status(:created)
    end

    it "does not let an admin change their own password through the admin CRUD endpoint" do
      put "/api/v1/admins/#{admin.id}", params: { password: "SneakyBypass123!" }, headers: auth_headers(admin), as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "public extras" do
    it "publishes real platform counters" do
      get "/api/v1/stats"
      expect(data).to include("companies", "reviews", "users", "categories")
      expect(data["reviews"]).to eq(Review.approved.count)
    end

    it "accepts a contact message and queues it for admins" do
      create(:admin, :super_admin)
      post "/api/v1/support/messages", params: { name: "Visitor", email: "visitor@example.com", message: "How do I edit my review?" }, as: :json
      expect(response).to have_http_status(:created)
      expect(SupportMessage.last.message).to match(/edit my review/)
      expect(Notification.where.not(admin_id: nil).last.title).to match(/contact message/i)
    end

    it "rejects an empty contact message" do
      post "/api/v1/support/messages", params: { name: "Visitor", email: "visitor@example.com", message: "short" }, as: :json
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "sessions" do
    it "lists and revokes the caller's own sessions" do
      doomed = auth_headers(user)
      keep = auth_headers(user)
      get "/api/v1/sessions", headers: keep
      target = data.find { |s| s["current"] == false }
      expect(target).to be_present

      delete "/api/v1/sessions/#{target['id']}", headers: keep
      expect(response).to have_http_status(:ok)
      get "/api/v1/auth/me", headers: doomed
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "agent scoping" do
    let(:agent) { create(:admin, :agent) }

    it "hides companies an agent was not assigned" do
      create(:company_assignment, company: company, admin: agent)
      create(:company, name: "Not assigned")
      get "/api/v1/companies", headers: auth_headers(agent)
      expect(data.map { |c| c["name"] }).to eq([ company.name ])
    end
  end
end
