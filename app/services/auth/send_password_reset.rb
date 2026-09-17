module Auth
  # Creates a single-use reset token (30 min) and emails the reset link.
  class SendPasswordReset < ApplicationService
    def initialize(user:)
      @user = user
    end

    def call
      token = SecureRandom.hex(32)
      expires_at = 30.minutes.from_now
      PasswordReset.create!(user: @user, token_hash: Api::Params.hash_value(token), expires_at: expires_at)
      frontend = ENV.fetch("APP_FRONTEND_URL", "http://localhost:4200").sub(%r{/+\z}, "")
      reset_url = "#{frontend}/auth/reset-password?token=#{CGI.escape(token)}"
      AuthMailer.deliver_password_reset(@user.email, reset_url, expires_at)
      token
    end
  end
end
