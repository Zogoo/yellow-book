module Auth
  # POST /auth/reset-password: sets a new password and revokes every live session.
  class ResetPassword < ApplicationService
    def initialize(payload:)
      @body = Api::Params.as_object(payload)
    end

    def call
      token = Api::Params.string(@body["token"].presence || @body["resetToken"])
      raise Api::BadRequest, "token is required" if token.empty?

      password = Api::Params.parse_password(@body["password"].presence || @body["newPassword"])
      reset = PasswordReset.find_by(token_hash: Api::Params.hash_value(token))
      raise Api::Unauthorized, "Invalid or expired reset token" if reset.nil? || !reset.usable?

      ActiveRecord::Base.transaction do
        reset.user.update!(password: password)
        reset.update!(used: true)
        Session.where(user_id: reset.user_id, revoked_at: nil).update_all(revoked_at: Time.current)
      end
      { message: "Password updated successfully" }
    end
  end
end
