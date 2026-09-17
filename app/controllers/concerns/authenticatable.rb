# Resolves the bearer token into `current_account` on every request and
# exposes the guard helpers controllers compose per action.
module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :resolve_account
  end

  private

  def resolve_account
    token = request.headers["Authorization"].to_s.split(" ", 2)
    return @current_account = nil unless token.first&.casecmp?("bearer") && token.last.present?

    @current_account = Auth::ResolveAccount.call(token: token.last)
  end

  def current_account
    @current_account
  end

  def require_account!
    raise Api::Unauthorized unless current_account
  end

  def require_verified_email!
    return unless current_account
    raise Api::Forbidden, "Email verification is required" unless current_account.email_verified
  end

  # Roles are exact; super_admin also inherits every admin-level route.
  def require_roles!(*roles)
    require_account!
    role = current_account.role
    return if roles.include?(role)
    return if role == "super_admin" && roles.include?("admin")

    raise Api::Forbidden, "Insufficient role"
  end

  # Super admins bypass; other admins need at least one of the permissions.
  def require_permissions!(*permissions)
    require_account!
    raise Api::Forbidden, "Admin permissions are required" unless current_account.admin?
    return if !current_account.is_agent && current_account.super_admin?

    required = permissions.map { |p| p.to_s.strip.downcase.gsub(/[:\s-]+/, "_") }
    raise Api::Forbidden, "Insufficient permissions" unless (required & current_account.normalized_permissions).any?
  end
end
