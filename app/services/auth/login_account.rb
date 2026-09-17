module Auth
  # POST /auth/login: admin by email, then user by email, then company contact email.
  class LoginAccount < ApplicationService
    def initialize(payload:, request:)
      @body = Api::Params.as_object(payload)
      @request = request
    end

    def call
      email = Api::Params.normalize_email(@body["email"])
      password = Api::Params.string(@body["password"])
      raise Api::Unauthorized, "password is required" if password.empty?

      if (admin = Admin.find_by(email: email))
        raise Api::Forbidden, "Account is not allowed to sign in" unless admin.active?
        raise Api::Unauthorized, "Invalid credentials" unless admin.authenticate(password)

        admin.update_column(:last_login_at, Time.current)
        session = Auth::IssueSession.call(admin: admin, request: @request)
        return { token: session.token, user: AuthSerializer.admin_item(admin) }
      end

      if (user = User.find_by(email: email))
        raise Api::Forbidden, "Account is not allowed to sign in" unless user.active?
        raise Api::Unauthorized, "Password login is not configured for this account" if user.password_digest.blank?
        raise Api::Unauthorized, "Invalid credentials" unless user.authenticate(password)

        return user_response(user)
      end

      company = Company.includes(:owner).find_by(email: email)
      owner = company&.owner
      raise Api::Unauthorized, "Invalid credentials" unless owner
      raise Api::Unauthorized, "Password login is not configured for this account" if owner.password_digest.blank?
      raise Api::Unauthorized, "Invalid credentials" unless owner.authenticate(password)

      owner.sync_role!
      session = Auth::IssueSession.call(user: owner, request: @request)
      { token: session.token, user: AuthSerializer.user_item(owner, "company", company.id) }
    end

    private

    def user_response(user)
      user.sync_role!
      owned = user.companies.order(created_at: :asc).first
      session = Auth::IssueSession.call(user: user, request: @request)
      { token: session.token, user: AuthSerializer.user_item(user, owned ? "company" : "user", owned&.id) }
    end
  end
end
