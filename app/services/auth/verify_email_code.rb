module Auth
  # POST /auth/email-code/verify: consumes a one-time code and signs the actor in.
  class VerifyEmailCode < ApplicationService
    def initialize(payload:, request:)
      @body = Api::Params.as_object(payload)
      @request = request
    end

    def call
      email = Api::Params.normalize_email(@body["email"])
      code = Api::Params.string(@body["code"].presence || @body["otp"])
      raise Api::Unauthorized, "code is required" if code.empty?

      purpose = Api::Params.parse_optional_enum(@body["purpose"], OtpCode::PURPOSES, "purpose") || "login"
      otp = OtpCode.live.where(email: email, purpose: purpose).order(created_at: :desc).first
      raise Api::Unauthorized, "Invalid or expired code" if otp.nil? || otp.code_hash != Api::Params.hash_value(code)

      OtpCode.where(email: email, purpose: purpose).delete_all

      case purpose
      when "reset_password" then reset_password(email)
      when "signup" then signup(email)
      else login(email)
      end
    end

    private

    def reset_password(email)
      user = User.find_by(email: email) or raise Api::NotFound, "User not found"
      Auth::SendPasswordReset.call(user: user)
      { message: "Code verified. Password reset instructions sent." }
    end

    def signup(email)
      user = User.find_by(email: email)
      if user.nil?
        raw_name = Api::Params.string(@body["name"]).presence || email.split("@").first || "User"
        names = Api::Params.split_name(raw_name)
        password = @body["password"].present? ? Api::Params.parse_password(@body["password"]) : SecureRandom.hex(16)
        user = User.create!(
          email: email, password: password, first_name: names[:first_name].presence, last_name: names[:last_name].presence,
          display_name: raw_name, status: "active", role: "user", signup_method: "Email", email_verified_at: Time.current
        )
      elsif user.email_verified_at.nil?
        user.update!(email_verified_at: Time.current)
      end
      session = Auth::IssueSession.call(user: user, request: @request)
      { token: session.token, user: AuthSerializer.user_item(user, "user", nil) }
    end

    def login(email)
      if (admin = Admin.find_by(email: email))
        admin.update!(verified: true, last_login_at: Time.current) unless admin.verified
        session = Auth::IssueSession.call(admin: admin, request: @request)
        return { token: session.token, user: AuthSerializer.admin_item(admin) }
      end

      if (user = User.find_by(email: email))
        user.update!(email_verified_at: Time.current) if user.email_verified_at.nil?
        user.sync_role!
        owned = user.companies.order(created_at: :asc).first
        session = Auth::IssueSession.call(user: user, request: @request)
        return { token: session.token, user: AuthSerializer.user_item(user, owned ? "company" : "user", owned&.id) }
      end

      company = Company.includes(:owner).find_by(email: email)
      raise Api::NotFound, "No account exists for this email" unless company&.owner

      session = Auth::IssueSession.call(user: company.owner, request: @request)
      { token: session.token, user: AuthSerializer.user_item(company.owner, "company", company.id) }
    end
  end
end
