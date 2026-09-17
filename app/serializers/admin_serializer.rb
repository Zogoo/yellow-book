module AdminSerializer
  module_function

  def item(admin)
    {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      role: admin.role_label.presence || "Admin",
      status: admin.status == "active" ? "Active" : "Inactive",
      verified: admin.verified,
      isAgent: admin.is_agent || admin.agent?,
      authRole: admin.auth_role.presence || "ADMIN",
      adminRole: admin.admin_role.presence || "ADMIN",
      permissions: Array(admin.permissions),
      createdOn: admin.created_on.presence || Api::Params.date_only(admin.created_at),
      lastLogin: Api::Params.date_only(admin.last_login_at),
      createdAt: Api::Params.iso(admin.created_at),
      updatedAt: Api::Params.iso(admin.updated_at)
    }
  end

  def subadmin_profile(admin, profile, preferences, security, updated_at: admin.updated_at)
    {
      fullName: (profile["fullName"] || admin.name).to_s,
      email: (profile["email"] || admin.email).to_s,
      mobile: (profile["mobile"] || admin.phone).to_s,
      phone: (profile["phone"] || admin.phone).to_s,
      role: (profile["role"] || admin.role_label).to_s,
      location: profile["location"].to_s,
      timezone: profile["timezone"].to_s,
      bio: profile["bio"].to_s,
      preferences: preferences,
      security: security,
      updatedAt: Api::Params.iso(updated_at)
    }
  end
end
