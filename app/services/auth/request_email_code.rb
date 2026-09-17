module Auth
  # POST /auth/email-code/request: issues a 6-digit one-time code by email.
  class RequestEmailCode < ApplicationService
    def initialize(payload:)
      @body = Api::Params.as_object(payload)
    end

    def call
      email = Api::Params.normalize_email(@body["email"])
      purpose = Api::Params.parse_optional_enum(@body["purpose"], OtpCode::PURPOSES, "purpose") || "login"

      Accounts::EnsureEmailAvailable.call(email: email) if purpose == "signup"
      if purpose == "login" && !User.exists?(email: email) && !Admin.exists?(email: email) && !Company.exists?(email: email)
        raise Api::NotFound, "No account exists for this email"
      end
      if purpose == "reset_password" && !User.exists?(email: email)
        return { message: "Verification code sent", expiresAt: ((Time.current + 10.minutes).to_f * 1000).to_i }
      end

      code = format("%06d", SecureRandom.random_number(1_000_000))
      expires_at = 10.minutes.from_now
      OtpCode.where(email: email, purpose: purpose).delete_all
      OtpCode.create!(email: email, purpose: purpose, code_hash: Api::Params.hash_value(code), expires_at: expires_at)
      AuthMailer.deliver_otp(email, code, expires_at)

      response = { message: "Verification code sent", email: email, expiresAt: (expires_at.to_f * 1000).to_i }
      response[:debug] = { code: code } if ENV.fetch("ALLOW_AUTH_DEBUG_RESPONSES") { Rails.env.development? ? "true" : "false" } == "true"
      response
    end
  end
end
