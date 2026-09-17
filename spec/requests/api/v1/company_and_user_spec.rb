require "rails_helper"

RSpec.describe "Company and user workspaces", type: :request do
  let(:owner) { create(:user, role: "company") }
  let!(:company) { create(:company, owner: owner, description: "Original") }
  let(:user) { create(:user) }
  let(:admin) { create(:admin, :super_admin) }

  before { owner.update!(company_id: company.id) }

  describe "agency" do
    it "returns dashboard, company and updates" do
      create(:review, company: company, rating: 3, created_at: Time.utc(2026, 1, 5))
      create(:review, company: company, rating: 5, created_at: Time.utc(2026, 2, 5))
      get "/api/v1/agency/dashboard", headers: auth_headers(owner)
      expect(data).to include("totalReviews" => 2, "averageRating" => 4.0, "verificationStatus" => "approved")
      expect(data["monthlyReviewTrend"]).to eq([ { "month" => "2026-01", "count" => 1 }, { "month" => "2026-02", "count" => 1 } ])
      get "/api/v1/agency/company", headers: auth_headers(owner)
      expect(data["id"]).to eq(company.id)
      put "/api/v1/agency/company", params: { description: "Updated", tagline: "Go" }, headers: auth_headers(owner), as: :json
      expect(company.reload.description).to eq("Updated")
      get "/api/v1/agency/dashboard", headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end

    it "manages company notifications" do
      note = create(:notification, company: company)
      get "/api/v1/agency/notifications", headers: auth_headers(owner)
      expect(data.map { |n| n["id"] }).to eq([ note.id ])
      put "/api/v1/agency/notifications/#{note.id}", params: { unread: false }, headers: auth_headers(owner), as: :json
      expect(note.reload.unread).to be(false)
      delete "/api/v1/agency/notifications/#{note.id}", headers: auth_headers(owner)
      expect(Notification.exists?(note.id)).to be(false)
    end
  end

  describe "company profile" do
    it "reads and updates the merged profile" do
      get "/api/v1/company/profile", headers: auth_headers(owner)
      expect(data["about"]).to eq("Original")
      put "/api/v1/company/profile", params: { fullName: "New Owner", about: "About text", preferences: { emailNotifications: false } }, headers: auth_headers(owner), as: :json
      expect(response).to have_http_status(:ok)
      expect(data).to include("fullName" => "New Owner", "about" => "About text")
      expect(data["preferences"]).to include("emailNotifications" => false)
      expect(company.reload.description).to eq("About text")
      get "/api/v1/company/profile", headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "user profile" do
    it "reads and updates" do
      get "/api/v1/user/profile", headers: auth_headers(user)
      expect(data["email"]).to eq(user.email)
      put "/api/v1/user/profile", params: { firstName: "Jane", lastName: "Cooper", phone: "+1" }, headers: auth_headers(user), as: :json
      expect(data).to include("firstName" => "Jane", "lastName" => "Cooper")
      expect(user.reload.display_name).to eq("Jane Cooper")
      put "/api/v1/user/profile", params: { email: owner.email }, headers: auth_headers(user), as: :json
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "favorites" do
    it "creates, lists and deletes" do
      post "/api/v1/favorites", params: { listingId: company.id }, headers: auth_headers(user), as: :json
      expect(response).to have_http_status(:created)
      id = data["id"]
      get "/api/v1/user/favorites", headers: auth_headers(user)
      expect(data.map { |f| f["listingId"] }).to eq([ company.id ])
      get "/api/v1/user/favourite-companies", headers: auth_headers(user)
      expect(data.size).to eq(1)
      delete "/api/v1/favorites/#{id}", headers: auth_headers(owner)
      expect(response).to have_http_status(:forbidden)
      delete "/api/v1/user/favorites/#{id}", headers: auth_headers(user)
      expect(response).to have_http_status(:no_content)
      post "/api/v1/favorites", params: { listingId: 999_999 }, headers: auth_headers(user), as: :json
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "notifications" do
    it "scopes to the caller and supports the lifecycle" do
      post "/api/v1/notifications", params: { title: "Hi", message: "There" }, headers: auth_headers(owner), as: :json
      expect(response).to have_http_status(:created)
      id = data["id"]
      expect(Notification.find(id).company_id).to eq(company.id)
      get "/api/v1/agency/notifications", headers: auth_headers(owner)
      expect(data.map { |n| n["id"] }).to include(id)
      get "/api/v1/notifications", headers: auth_headers(user)
      expect(data).to be_empty
      patch "/api/v1/notifications/#{id}/read", headers: auth_headers(owner)
      expect(data["unread"]).to be(false)
      put "/api/v1/notifications/#{id}", params: {}, headers: auth_headers(owner), as: :json
      expect(response).to have_http_status(:bad_request)
      delete "/api/v1/notifications/#{id}", headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
      delete "/api/v1/notifications/#{id}", headers: auth_headers(owner)
      expect(response).to have_http_status(:ok)
    end
  end

  describe "sessions" do
    it "lists the caller's sessions" do
      headers = auth_headers(user)
      get "/api/v1/sessions", headers: headers
      expect(data.size).to eq(1)
      expect(data.first).to include("device")
    end
  end

  describe "verified email guard" do
    it "blocks unverified users from protected resources but not /auth/me" do
      unverified = create(:user, :unverified)
      get "/api/v1/user/profile", headers: auth_headers(unverified)
      expect(response).to have_http_status(:forbidden)
      get "/api/v1/auth/me", headers: auth_headers(unverified)
      expect(response).to have_http_status(:ok)
    end
  end
end
