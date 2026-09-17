# JSON projections of the authenticated identity returned by login/register/me.
module AuthSerializer
  module_function

  ROLE_LABEL_TO_ADMIN_ROLE = {
    "Super Admin" => "SUPER_ADMIN", "Admin" => "ADMIN", "Moderator" => "MODERATOR",
    "Support" => "SUPPORT", "Viewer" => "VIEWER", "Agent" => "MODERATOR"
  }.freeze

  def user_item(user, actor, company_id = nil)
    {
      id: user.id,
      name: user.display_label,
      email: user.email,
      role: actor == "company" ? "COMPANY_OWNER" : "USER",
      status: user.status == "active" ? "Active" : "Suspended",
      permissions: Array(user.permissions),
      email_verified_at: Api::Params.iso(user.email_verified_at),
      adminRole: nil,
      isAgent: false,
      companyId: company_id || user.company_id,
      signupMethod: user.signup_method.presence || "Email"
    }
  end

  def admin_item(admin)
    {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.auth_role.presence || (admin.agent? ? "SUB_ADMIN" : "ADMIN"),
      status: admin.status == "active" ? "Active" : "Inactive",
      permissions: Array(admin.permissions),
      email_verified_at: admin.verified ? Api::Params.iso(Time.current) : nil,
      adminRole: admin.admin_role.presence || ROLE_LABEL_TO_ADMIN_ROLE[admin.role_label] || "ADMIN",
      isAgent: admin.is_agent || admin.agent?,
      companyId: nil,
      signupMethod: "Email"
    }
  end
end
