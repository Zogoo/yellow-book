module Companies
  class CreateCompany < ApplicationService
    def initialize(payload:, account:)
      @body = Api::Params.as_object(payload)
      @account = account
    end

    def call
      name = Api::Params.string(@body["name"].presence || @body["companyName"])
      raise Api::BadRequest, "name is required" if name.empty?

      slug = Api::Params.normalize_slug(@body["slug"].presence || name)
      raise Api::BadRequest, "Company slug already exists" if Company.exists?(slug: slug)

      category = Companies::ResolveCategory.call(body: @body)
      owner_id = @account.admin? ? Api::Params.parse_id(@body["ownerUserId"].presence || @body["owner_user_id"], "ownerUserId") : @account.id
      owner = User.find_by(id: owner_id) or raise Api::BadRequest, "userId does not reference an existing user"

      requested_status = Api::Params.parse_optional_enum(@body["status"], Company::STATUSES, "status")
      status = @account.admin? ? (requested_status || "pending") : "pending"
      verified = @account.admin? ? (Api::Params.parse_optional_boolean(@body["verified"], "verified") || false) : false
      email = @body["email"].present? ? Api::Params.normalize_email(@body["email"]) : nil

      company = Company.create!(
        owner: owner, category: category, category_label: category.name, name: name, slug: slug,
        email: email, website: Api::Params.optional_string(@body["website"]),
        service_type: Api::Params.optional_string(@body["service"]) || Api::Params.optional_string(@body["serviceType"]),
        specialization: Api::Params.optional_string(@body["specialization"]),
        emergency_service: Api::Params.parse_optional_boolean(@body["emergencyService"], "emergencyService"),
        employees: Api::Params.optional_string(@body["employees"]), revenue: Api::Params.optional_string(@body["revenue"]),
        country: Api::Params.optional_string(@body["country"]), country_code: Api::Params.optional_string(@body["countryCode"]),
        phone_number: Api::Params.optional_string(@body["mobile"]) || Api::Params.optional_string(@body["phoneNumber"]),
        contact_email: @body["contactEmail"].present? ? Api::Params.normalize_email(@body["contactEmail"]) : email,
        owner_name: Api::Params.optional_string(@body["ownerName"]), first_name: Api::Params.optional_string(@body["firstName"]),
        last_name: Api::Params.optional_string(@body["lastName"]), job_title: Api::Params.optional_string(@body["jobTitle"]),
        location: Api::Params.optional_string(@body["location"]), description: Api::Params.optional_string(@body["description"]),
        district: Api::Params.optional_string(@body["district"]),
        registration_number: Api::Params.optional_string(@body["registrationNumber"]),
        facebook_url: Api::Params.optional_string(@body["facebookUrl"]),
        status: status, verified: verified
      )
      owner.sync_role!
      ActivityEvent.log("Company created: #{company.name}", "Building2", { companyId: company.id, status: company.status })
      company
    end
  end
end
