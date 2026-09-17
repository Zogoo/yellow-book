module UserSerializer
  module_function

  def list_item(user)
    {
      id: user.id,
      name: user.display_label,
      email: user.email,
      signupMethod: user.signup_method.presence || "Email",
      signupDate: Api::Params.date_only(user.created_at),
      status: user.status == "active" ? "Active" : "Suspended",
      verified: user.email_verified_at.present?,
      role: user.role == "company" ? "COMPANY_OWNER" : "USER",
      companyId: user.company_id,
      permissions: Array(user.permissions),
      createdAt: Api::Params.iso(user.created_at),
      updatedAt: Api::Params.iso(user.updated_at)
    }
  end

  def detail(user)
    list_item(user).merge(
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      jobTitle: user.job_title,
      company: user.company_name,
      location: user.location,
      timeZone: user.time_zone,
      bio: user.bio,
      avatar: user.avatar,
      security: Api::Params.as_json_object(user.security),
      updatedAt: Api::Params.iso(user.updated_at)
    )
  end

  def profile(user)
    {
      firstName: user.first_name.to_s,
      lastName: user.last_name.to_s,
      email: user.email,
      phone: user.phone.to_s,
      jobTitle: user.job_title.to_s,
      company: user.company_name.to_s,
      location: user.location.to_s,
      timeZone: user.time_zone.to_s,
      bio: user.bio.to_s,
      avatar: user.avatar.to_s,
      security: Api::Params.as_json_object(user.security),
      updatedAt: Api::Params.iso(user.updated_at)
    }
  end
end
