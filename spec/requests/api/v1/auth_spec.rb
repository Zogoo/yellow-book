require "rails_helper"

RSpec.describe "Auth", type: :request do
  let!(:category) { create(:category) }

  describe "POST /api/v1/auth/register" do
    it "creates a user with a company and returns a token" do
      post "/api/v1/auth/register", params: { email: "New@Example.com", password: "StrongPassw0rd!", companyName: "Acme", ownerName: "Ann Acme", categoryId: category.id }, as: :json
      expect(response).to have_http_status(:created)
      expect(data["token"]).to be_present
      expect(data["user"]["email"]).to eq("new@example.com")
      expect(data["user"]["role"]).to eq("COMPANY_OWNER")
      expect(Company.find_by(name: "Acme")).to be_present
    end

    it "rejects weak passwords" do
      post "/api/v1/auth/register", params: { email: "weak@example.com", password: "password", companyName: "Acme" }, as: :json
      expect(response).to have_http_status(:bad_request)
      expect(json["message"]).to match(/password/i)
      expect(json).to include("statusCode" => 400, "error" => "Bad Request")
      expect(json["requestId"]).to be_present
    end

    it "rejects duplicate emails" do
      create(:user, email: "dup@example.com")
      post "/api/v1/auth/register", params: { email: "dup@example.com", password: "StrongPassw0rd!", companyName: "Acme" }, as: :json
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "POST /api/v1/auth/login" do
    let!(:user) { create(:user, email: "login@example.com", password: "UserSecure123!") }
    let!(:admin) { create(:admin, :super_admin, email: "root@example.com", password: "AdminSecure123!") }

    it "logs a user in" do
      post "/api/v1/auth/login", params: { email: "login@example.com", password: "UserSecure123!" }, as: :json
      expect(response).to have_http_status(:created)
      expect(data["token"]).to be_present
      expect(data["user"]).to include("email" => "login@example.com", "role" => "USER")
      expect(Session.where(user_id: user.id).count).to eq(1)
    end

    it "logs an admin in with adminRole" do
      post "/api/v1/auth/login", params: { email: "root@example.com", password: "AdminSecure123!" }, as: :json
      expect(response).to have_http_status(:created)
      expect(data["user"]).to include("adminRole" => "SUPER_ADMIN", "role" => "ADMIN")
      expect(admin.reload.last_login_at).to be_present
    end

    it "rejects bad credentials" do
      post "/api/v1/auth/login", params: { email: "login@example.com", password: "nope" }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects suspended users" do
      user.update!(status: "suspended")
      post "/api/v1/auth/login", params: { email: "login@example.com", password: "UserSecure123!" }, as: :json
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/v1/auth/me and logout" do
    let(:user) { create(:user) }

    it "returns the current user and revokes the session on logout" do
      headers = auth_headers(user)
      get "/api/v1/auth/me", headers: headers
      expect(response).to have_http_status(:ok)
      expect(data["user"]["id"]).to eq(user.id)

      post "/api/v1/auth/logout", headers: headers
      expect(response).to have_http_status(:created)
      get "/api/v1/auth/me", headers: headers
      expect(response).to have_http_status(:unauthorized)
    end

    it "rejects missing and malformed tokens" do
      get "/api/v1/auth/me"
      expect(response).to have_http_status(:unauthorized)
      get "/api/v1/auth/me", headers: { "Authorization" => "Bearer nope" }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "email code login" do
    let!(:user) { create(:user, email: "otp@example.com") }

    it "issues and verifies a code" do
      post "/api/v1/auth/email-code/request", params: { email: "otp@example.com" }, as: :json
      expect(response).to have_http_status(:created)
      code = OtpCode.last
      expect(code.email).to eq("otp@example.com")
      raw = ActionMailer::Base.deliveries.last ? mail_text(ActionMailer::Base.deliveries.last) : ""
      digits = raw[/\b\d{6}\b/]
      digits ||= data.dig("debug", "code")
      expect(digits).to be_present

      post "/api/v1/auth/email-code/verify", params: { email: "otp@example.com", code: digits }, as: :json
      expect(response).to have_http_status(:created)
      expect(data["token"]).to be_present
    end

    it "rejects wrong codes" do
      post "/api/v1/auth/email-code/request", params: { email: "otp@example.com" }, as: :json
      post "/api/v1/auth/email-code/verify", params: { email: "otp@example.com", code: "000000" }, as: :json
      expect(response).to have_http_status(:unauthorized).or have_http_status(:bad_request)
    end
  end

  describe "password reset" do
    let!(:user) { create(:user, email: "reset@example.com", password: "OldPassw0rd!!") }

    it "resets the password with a valid token and revokes sessions" do
      old_headers = auth_headers(user)
      post "/api/v1/auth/forgot-password", params: { email: "reset@example.com" }, as: :json
      expect(response).to have_http_status(:created)
      mail = ActionMailer::Base.deliveries.last
      token = mail_text(mail)[/token=([a-f0-9]+)/, 1]
      expect(token).to be_present

      post "/api/v1/auth/reset-password", params: { token: token, password: "BrandNewPassw0rd!" }, as: :json
      expect(response).to have_http_status(:created)
      get "/api/v1/auth/me", headers: old_headers
      expect(response).to have_http_status(:unauthorized)
      post "/api/v1/auth/login", params: { email: "reset@example.com", password: "BrandNewPassw0rd!" }, as: :json
      expect(response).to have_http_status(:created)
    end

    it "does not reveal unknown emails" do
      post "/api/v1/auth/forgot-password", params: { email: "ghost@example.com" }, as: :json
      expect(response).to have_http_status(:created)
    end
  end

  describe "oauth" do
    it "reports missing configuration" do
      get "/api/v1/auth/oauth/google/authorize", params: { redirectUri: "http://localhost:4200/auth/oauth/callback" }
      expect(response).to have_http_status(:bad_request)
    end

    it "rejects unsupported providers" do
      get "/api/v1/auth/oauth/facebook/authorize"
      expect(response).to have_http_status(:bad_request)
    end
  end

  it "returns the JSON error contract for unknown routes" do
    get "/api/v1/does-not-exist"
    expect(response).to have_http_status(:not_found)
    expect(json).to include("statusCode" => 404, "error" => "Not Found")
  end

  it "rejects malformed JSON bodies with 400" do
    post "/api/v1/auth/login", params: "{not json", headers: { "CONTENT_TYPE" => "application/json" }
    expect(response).to have_http_status(:bad_request)
  end
end
