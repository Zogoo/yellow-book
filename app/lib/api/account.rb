module Api
  # The authenticated actor for a request: a User (role user/company) or an
  # Admin (role admin/super_admin/agent). Built by Auth::ResolveAccount.
  Account = Struct.new(
    :id, :source, :role, :admin_role, :is_agent, :name, :email, :email_verified,
    :permissions, :company_id, :record, :session_id, :token,
    keyword_init: true
  ) do
    def user? = source == "user"
    def admin? = source == "admin"
    def agent? = role == "agent"
    def company? = role == "company"
    def super_admin? = admin_role == "super_admin"

    def normalized_permissions
      Array(permissions).map { |p| p.to_s.strip.downcase.gsub(/[:\s-]+/, "_") }
    end
  end
end
