module Auth
  # Turns a bearer token into an Api::Account (or nil). Never raises: a bad
  # token simply means an anonymous request; controllers decide whether that
  # is acceptable.
  class ResolveAccount < ApplicationService
    def initialize(token:)
      @token = token.to_s.strip
    end

    def call
      return nil if @token.empty?

      payload = Auth::JwtService.decode(@token)
      return nil unless payload

      session = Session.live.find_by(id: payload[:sid])
      return nil unless session

      case payload[:kind]
      when "user" then user_account(session, payload)
      when "admin" then admin_account(session, payload)
      end
    end

    private

    def user_account(session, payload)
      return nil unless session.user_id == payload[:sub]

      user = User.find_by(id: payload[:sub])
      return nil unless user&.active?

      company = user.companies.order(created_at: :desc).first
      company_account = user.role == "company" || company.present?
      Api::Account.new(
        id: user.id, source: "user", role: company_account ? "company" : "user",
        admin_role: nil, is_agent: false,
        name: company&.name || user.display_label,
        email: company&.contact_email || company&.email || user.email,
        email_verified: user.email_verified_at.present?,
        permissions: [], company_id: company&.id,
        record: user, session_id: session.id, token: @token
      )
    end

    def admin_account(session, payload)
      return nil unless session.admin_id == payload[:sub]

      admin = Admin.find_by(id: payload[:sub])
      return nil unless admin&.active?

      Api::Account.new(
        id: admin.id, source: "admin", role: admin.platform_role,
        admin_role: admin.super_admin? ? "super_admin" : (admin.agent? ? "agent" : "admin"),
        is_agent: admin.agent?, name: admin.name, email: admin.email,
        email_verified: admin.verified, permissions: admin.normalized_permissions,
        company_id: nil, record: admin, session_id: session.id, token: @token
      )
    end
  end
end
