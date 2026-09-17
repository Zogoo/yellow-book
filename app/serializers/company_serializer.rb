module CompanySerializer
  module_function

  STATUS_LABELS = { "approved" => "Approved", "pending" => "Pending", "rejected" => "Rejected" }.freeze

  def item(company, rating = nil)
    owner = company.owner
    {
      id: company.id,
      ownerUserId: company.owner_user_id,
      categoryId: company.category_id,
      category: company.category_name,
      name: company.name,
      slug: company.slug,
      website: company.website,
      email: company.contact_email || company.email,
      mobile: company.mobile || company.phone_number || company.phone,
      phone: company.phone || company.phone_number || company.mobile,
      contactEmail: company.contact_email,
      phoneNumber: company.phone_number,
      status: STATUS_LABELS.fetch(company.status, company.status),
      verified: company.verified,
      location: company.location,
      revenue: company.revenue,
      employees: company.employees,
      industry: company.industry,
      firstName: company.first_name,
      lastName: company.last_name,
      jobTitle: company.job_title,
      ownerName: company.owner_name,
      tagline: company.tagline,
      description: company.description,
      services: company.services,
      serviceType: company.service_type,
      specialization: company.specialization,
      emergencyService: company.emergency_service || false,
      price: company.price&.to_f,
      image: company.image,
      rating: rating&.dig(:average),
      ratingCount: rating&.dig(:count) || 0,
      createdAt: Api::Params.iso(company.created_at),
      updatedAt: Api::Params.iso(company.updated_at),
      owner: owner ? { id: owner.id, name: owner.display_label, email: owner.email } : nil
    }
  end

  def listing(company, rating)
    {
      id: company.id,
      category: company.category_name || "General",
      name: company.name,
      slug: company.slug,
      rating: rating[:average],
      ratingCount: rating[:count],
      website: company.website,
      location: company.location,
      revenue: company.revenue,
      comments: rating[:count],
      serviceType: company.service_type,
      specialization: company.specialization,
      emergencyService: company.emergency_service || false,
      price: company.price&.to_f,
      image: company.image.presence || "/logo/logo.png",
      description: company.description.to_s
    }
  end

  def recent(company)
    {
      id: company.id,
      name: company.name,
      date: Api::Params.date_only(company.updated_at),
      phone: company.phone_number,
      website: company.website,
      category: company.category_name,
      status: company.status,
      slug: company.slug
    }
  end

  def agency(company, rating)
    {
      id: company.id,
      name: company.name,
      slug: company.slug,
      category: company.category_name,
      location: company.location,
      website: company.website,
      status: company.status,
      rating: rating[:average],
      ratingCount: rating[:count]
    }
  end

  def profile(company, profile, preferences, security, updated_at: company.updated_at, merged: false)
    fetch = ->(key, fallback) { merged ? profile[key].to_s : (profile[key] || fallback).to_s }
    {
      fullName: fetch.call("fullName", company.owner_name),
      phoneNumber: fetch.call("phoneNumber", company.phone_number),
      email: fetch.call("email", company.contact_email || company.email),
      location: fetch.call("location", company.location),
      about: fetch.call("about", company.description),
      avatar: fetch.call("avatar", company.image),
      preferences: preferences,
      security: security,
      updatedAt: Api::Params.iso(updated_at)
    }
  end

  def assignment(assignment)
    company = assignment.company
    {
      id: assignment.id,
      companyId: assignment.company_id,
      name: company.name,
      category: company.category_label,
      status: company.status,
      mobile: company.phone_number,
      email: company.contact_email || company.email,
      address: company.location,
      website: company.website,
      primaryContact: assignment.primary_contact || company.owner_name,
      assignedDate: Api::Params.iso(assignment.assigned_date)
    }
  end
end
