require "rails_helper"

RSpec.describe "Reviews", type: :request do
  let(:owner) { create(:user, role: "company") }
  let(:company) { create(:company, owner: owner) }
  let(:user) { create(:user) }
  let(:agent) { create(:admin, :agent) }
  let(:admin) { create(:admin, :super_admin) }

  before { owner.update!(company_id: company.id) }

  it "lets a user create a review that starts pending" do
    post "/api/v1/agency/reviews", params: { companyId: company.id, rating: 4, content: "Nice work" }, headers: auth_headers(user), as: :json
    expect(response).to have_http_status(:created)
    expect(data).to include("status" => "pending", "rating" => 4, "companyId" => company.id)
  end

  it "accepts companySlug in the query" do
    post "/api/v1/agency/reviews?companySlug=#{company.slug}", params: { rating: 5, content: "Great" }, headers: auth_headers(user), as: :json
    expect(response).to have_http_status(:created)
  end

  it "rejects HTML, missing company and invalid rating" do
    post "/api/v1/agency/reviews", params: { companyId: company.id, rating: 4, content: "<b>x</b>" }, headers: auth_headers(user), as: :json
    expect(response).to have_http_status(:bad_request)
    post "/api/v1/agency/reviews", params: { rating: 4, content: "x" }, headers: auth_headers(user), as: :json
    expect(response).to have_http_status(:bad_request)
    post "/api/v1/agency/reviews", params: { companyId: company.id, rating: 9, content: "x" }, headers: auth_headers(user), as: :json
    expect(response).to have_http_status(:bad_request)
  end

  it "blocks company owners and anonymous callers from reviewing" do
    post "/api/v1/agency/reviews", params: { companyId: company.id, rating: 4, content: "x" }, headers: auth_headers(owner), as: :json
    expect(response).to have_http_status(:forbidden)
    post "/api/v1/agency/reviews", params: { companyId: company.id, rating: 4, content: "x" }, as: :json
    expect(response).to have_http_status(:unauthorized)
  end

  describe "moderation" do
    let!(:review) { create(:review, :pending, company: company, user: user) }

    it "lets an assigned agent approve via /subadmin/reviews" do
      create(:company_assignment, company: company, admin: agent)
      put "/api/v1/subadmin/reviews/#{review.id}", params: { status: "approved" }, headers: auth_headers(agent), as: :json
      expect(response).to have_http_status(:ok)
      expect(review.reload.status).to eq("approved")
    end

    it "blocks an unassigned agent" do
      put "/api/v1/subadmin/reviews/#{review.id}", params: { status: "approved" }, headers: auth_headers(agent), as: :json
      expect(response).to have_http_status(:forbidden)
    end

    it "lets admins patch status via /agency/reviews and delete" do
      patch "/api/v1/agency/reviews/#{review.id}", params: { status: "on_hold" }, headers: auth_headers(admin), as: :json
      expect(response).to have_http_status(:ok)
      expect(data["status"]).to eq("on_hold")
      delete "/api/v1/agency/reviews/#{review.id}", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      expect(Review.exists?(review.id)).to be(false)
    end

    it "forbids users from changing status" do
      patch "/api/v1/agency/reviews/#{review.id}", params: { status: "approved" }, headers: auth_headers(user), as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "reactions" do
    let!(:review) { create(:review, company: company) }

    it "toggles like/dislike exclusively and forbids admins" do
      post "/api/v1/agency/reviews/#{review.id}/like", headers: auth_headers(user)
      expect(response).to have_http_status(:created)
      expect(data["likes"]).to eq(1)
      post "/api/v1/agency/reviews/#{review.id}/dislike", headers: auth_headers(user)
      expect(data).to include("likes" => 0, "dislikes" => 1)
      post "/api/v1/agency/reviews/#{review.id}/dislike", headers: auth_headers(user)
      expect(data["dislikes"]).to eq(0)
      post "/api/v1/agency/reviews/#{review.id}/share", headers: auth_headers(user)
      expect(data["shares"]).to eq(1)
      post "/api/v1/agency/reviews/#{review.id}/like", headers: auth_headers(admin)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "company reply" do
    let!(:review) { create(:review, company: company) }

    it "stores one pending reply per review" do
      post "/api/v1/agency/reviews/#{review.id}/reply", params: { reply_text: "Thank you" }, headers: auth_headers(owner), as: :json
      expect(response).to have_http_status(:created)
      expect(data["companyResponse"]).to include("text" => "Thank you")
      expect(data["companyResponseStatus"]).to eq("pending")
      post "/api/v1/agency/reviews/#{review.id}/reply", params: { reply_text: "Again" }, headers: auth_headers(owner), as: :json
      expect(response).to have_http_status(:forbidden)
    end

    it "hides pending replies from anonymous readers" do
      post "/api/v1/agency/reviews/#{review.id}/reply", params: { reply_text: "Thank you" }, headers: auth_headers(owner), as: :json
      get "/api/v1/agency/reviews", params: { companyId: company.id }
      expect(data.first["companyResponse"]).to be_nil
    end

    it "forbids non-owners" do
      post "/api/v1/agency/reviews/#{review.id}/reply", params: { reply_text: "x" }, headers: auth_headers(user), as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "my reviews" do
    let!(:mine) { create(:review, company: company, user: user, content: "Mine") }
    let!(:other) { create(:review, company: company) }

    it "lists, updates and deletes only my own reviews" do
      get "/api/v1/user/my-reviews", headers: auth_headers(user)
      expect(data.map { |r| r["id"] }).to eq([ mine.id ])
      expect(json["meta"]).to include("perPage")
      put "/api/v1/user/my-reviews/#{mine.id}", params: { rating: 2, review: "Edited" }, headers: auth_headers(user), as: :json
      expect(data).to include("rating" => 2)
      put "/api/v1/user/my-reviews/#{other.id}", params: { rating: 2 }, headers: auth_headers(user), as: :json
      expect(response).to have_http_status(:forbidden)
      delete "/api/v1/user/my-reviews/#{mine.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:no_content)
    end
  end
end
