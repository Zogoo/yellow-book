require "rails_helper"

RSpec.describe "Admin panel", type: :request do
  let(:super_admin) { create(:admin, :super_admin) }
  let(:admin) { create(:admin) }
  let(:agent) { create(:admin, :agent) }
  let(:user) { create(:user) }

  describe "GET /api/v1/admin/stats" do
    it "returns counters for admins and rejects users" do
      create(:company, :pending)
      get "/api/v1/admin/stats", headers: auth_headers(super_admin)
      expect(response).to have_http_status(:ok)
      expect(data).to include("pendingVerifications" => 1, "welcomeName" => super_admin.name)
      get "/api/v1/admin/stats", headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "users" do
    it "requires users_read for agents and allows super admins" do
      get "/api/v1/users", headers: auth_headers(agent)
      expect(response).to have_http_status(:forbidden)
      agent.update!(permissions: [ "users_read" ])
      get "/api/v1/users", headers: auth_headers(agent)
      expect(response).to have_http_status(:ok)
      get "/api/v1/users", headers: auth_headers(super_admin), params: { search: user.email }
      expect(data.map { |u| u["id"] }).to eq([ user.id ])
    end

    it "creates, updates and deletes users" do
      post "/api/v1/users", params: { name: "Temp User", email: "temp@example.com", password: "TempSecure123!" }, headers: auth_headers(super_admin), as: :json
      expect(response).to have_http_status(:created)
      id = data["id"]
      put "/api/v1/users/#{id}", params: { status: "suspended" }, headers: auth_headers(super_admin), as: :json
      expect(data["status"]).to eq("Suspended")
      delete "/api/v1/users/#{id}", headers: auth_headers(super_admin)
      expect(response).to have_http_status(:ok)
      delete "/api/v1/users/#{id}", headers: auth_headers(agent)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "admins" do
    it "lists for admins, mutates only for super admins" do
      get "/api/v1/admins", headers: auth_headers(admin)
      expect(response).to have_http_status(:ok)
      post "/api/v1/admins", params: { name: "Mod", email: "mod@example.com", password: "ModSecure123!", role: "moderator", permissions: [ "reviews_read" ] }, headers: auth_headers(admin), as: :json
      expect(response).to have_http_status(:forbidden)
      post "/api/v1/admins", params: { name: "Mod", email: "mod@example.com", password: "ModSecure123!", role: "moderator", permissions: [ "reviews_read" ] }, headers: auth_headers(super_admin), as: :json
      expect(response).to have_http_status(:created)
      expect(data).to include("role" => "Moderator", "isAgent" => true, "permissions" => [ "reviews_read" ])
      id = data["id"]
      put "/api/v1/admins/#{id}", params: { name: "Mod Renamed", status: "inactive" }, headers: auth_headers(super_admin), as: :json
      expect(data).to include("name" => "Mod Renamed", "status" => "Inactive")
      delete "/api/v1/admins/#{id}", headers: auth_headers(super_admin)
      expect(response).to have_http_status(:ok)
      delete "/api/v1/admins/#{super_admin.id}", headers: auth_headers(super_admin)
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "companies" do
    let!(:company) { create(:company, :pending, name: "Pending Co") }

    it "returns the admin projection with status filter and updates status" do
      get "/api/v1/companies", params: { status: "pending" }, headers: auth_headers(super_admin)
      expect(data.first).to include("name" => "Pending Co", "status" => "Pending")
      put "/api/v1/companies/#{company.id}", params: { status: "approved" }, headers: auth_headers(super_admin), as: :json
      expect(company.reload.status).to eq("approved")
      get "/api/v1/companies/recent", headers: auth_headers(super_admin)
      expect(data.first["name"]).to eq("Pending Co")
      delete "/api/v1/companies/recent/#{company.id}", headers: auth_headers(super_admin)
      expect(Company.exists?(company.id)).to be(false)
    end

    it "lets admins create companies for an owner" do
      post "/api/v1/companies", params: { name: "Brand New", ownerUserId: user.id, category: "General", status: "pending" }, headers: auth_headers(super_admin), as: :json
      expect(response).to have_http_status(:created)
      expect(data["ownerUserId"]).to eq(user.id)
    end

    it "limits agents to assigned companies" do
      put "/api/v1/companies/#{company.id}", params: { status: "approved" }, headers: auth_headers(agent), as: :json
      expect(response).to have_http_status(:forbidden)
      create(:company_assignment, company: company, admin: agent)
      put "/api/v1/companies/#{company.id}", params: { status: "approved" }, headers: auth_headers(agent), as: :json
      expect(response).to have_http_status(:ok)
    end
  end

  describe "specializations and activities" do
    it "guards specialization writes by permission" do
      get "/api/v1/specialization", headers: auth_headers(super_admin)
      expect(response).to have_http_status(:ok)
      post "/api/v1/specialization", params: { name: "Spa", category: "Beauty" }, headers: auth_headers(agent), as: :json
      expect(response).to have_http_status(:forbidden)
      agent.update!(permissions: [ "specializations_write" ])
      post "/api/v1/specialization", params: { name: "Spa", category: "Beauty" }, headers: auth_headers(agent), as: :json
      expect(response).to have_http_status(:created)
      get "/api/v1/activities/recent", headers: auth_headers(super_admin)
      expect(response).to have_http_status(:ok)
    end
  end

  describe "agent workspace" do
    let!(:company) { create(:company) }
    let!(:assignment) { create(:company_assignment, company: company, admin: agent) }
    let!(:pending_review) { create(:review, :pending, company: company) }
    let!(:other_review) { create(:review, :pending) }

    it "scopes the dashboard and queues to assignments" do
      get "/api/v1/agent/dashboard", headers: auth_headers(agent)
      expect(data).to include("pendingReviews" => 1, "totalCompanies" => 1)
      get "/api/v1/subadmin/companies", headers: auth_headers(agent)
      expect(data.map { |c| c["companyId"] }).to eq([ company.id ])
      get "/api/v1/subadmin/reviews", headers: auth_headers(agent)
      expect(data.map { |r| r["id"] }).to eq([ pending_review.id ])
      delete "/api/v1/subadmin/reviews/#{other_review.id}", headers: auth_headers(agent)
      expect(response).to have_http_status(:forbidden)
      delete "/api/v1/subadmin/reviews/#{pending_review.id}", headers: auth_headers(agent)
      expect(response).to have_http_status(:ok)
    end

    it "updates and reads the subadmin profile" do
      put "/api/v1/subadmin/profile", params: { fullName: "Agent Smith", mobile: "+1", preferences: { notifications: true } }, headers: auth_headers(agent), as: :json
      expect(response).to have_http_status(:ok)
      expect(data).to include("fullName" => "Agent Smith")
      get "/api/v1/subadmin/profile", headers: auth_headers(agent)
      expect(data["preferences"]).to include("notifications" => true)
      expect(agent.reload.name).to eq("Agent Smith")
    end
  end
end
