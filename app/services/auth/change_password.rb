module Auth
  # PUT /auth/password: an account changes its own password. The current password
  # must be supplied, and every other session is revoked so a stolen one dies here.
  class ChangePassword < ApplicationService
    def initialize(account:, payload:)
      @account = account
      @body = Api::Params.as_object(payload)
    end

    def call
      raise Api::Unauthorized unless @account

      record = @account.admin? ? Admin.find_by(id: @account.id) : User.find_by(id: @account.id)
      raise Api::Unauthorized, "Account not found" unless record

      current = Api::Params.string(@body["currentPassword"].presence || @body["current_password"])
      raise Api::BadRequest, "currentPassword is required" if current.empty?
      raise Api::BadRequest, "Password login is not configured for this account" if record.password_digest.blank?
      raise Api::Unauthorized, "Current password is incorrect" unless record.authenticate(current)

      password = Api::Params.parse_password(@body["password"].presence || @body["newPassword"])
      raise Api::BadRequest, "New password must be different from the current one" if record.authenticate(password)

      record.update!(password: password)
      revoke_other_sessions(record)
      { message: "Password updated", changedAt: Api::Params.iso(Time.current) }
    end

    private

    def revoke_other_sessions(record)
      scope = record.is_a?(Admin) ? Session.where(admin_id: record.id) : Session.where(user_id: record.id)
      scope.where.not(id: @account.session_id).update_all(revoked_at: Time.current)
    end
  end
end
