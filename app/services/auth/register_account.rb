module Auth
  # POST /auth/register: creates a user (auto-verified) and optionally its company.
  class RegisterAccount < ApplicationService
    def initialize(payload:, request:)
      @body = Api::Params.as_object(payload)
      @request = request
    end

    def call
      email = Api::Params.normalize_email(@body["email"])
      Accounts::EnsureEmailAvailable.call(email: email)
      password = Api::Params.parse_password(@body["password"])

      raw_name = Api::Params.string(@body["name"] || @body["fullName"] || @body["ownerName"])
      name = raw_name.presence || email.split("@").first || "User"
      names = Api::Params.split_name(name)
      signup_method = Api::Params.string(@body["signupMethod"]).presence || "Email"
      company_payload = build_company_payload(name, email)
      category = company_payload ? Companies::ResolveCategory.call(body: company_payload) : nil

      user = nil
      company = nil
      ActiveRecord::Base.transaction do
        user = User.create!(
          email: email, password: password,
          first_name: names[:first_name].presence, last_name: names[:last_name].presence,
          display_name: name, phone: Api::Params.optional_string(@body["phone"]),
          status: "active", role: "user", signup_method: signup_method, email_verified_at: Time.current
        )
        company = create_company(user, company_payload, category, name, names, email, signup_method) if company_payload
      end

      user.sync_role!
      user.update_column(:company_id, company.id) if company
      session = Auth::IssueSession.call(user: user, request: @request)
      { token: session.token, user: AuthSerializer.user_item(user, company ? "company" : "user", company&.id) }
    end

    private

    def build_company_payload(name, email)
      return Api::Params.as_object(@body["company"], "company must be an object") if @body["company"].present?

      company_name = Api::Params.string(@body["companyName"])
      return nil if company_name.empty?

      {
        "name" => company_name, "categoryId" => @body["categoryId"], "category" => @body["category"],
        "ownerName" => @body["ownerName"] || name, "phoneNumber" => @body["phone"] || @body["phoneNumber"],
        "phone" => @body["phone"], "contactEmail" => @body["email"] || email,
        "website" => @body["website"], "description" => @body["description"]
      }
    end

    def create_company(user, payload, category, name, names, email, signup_method)
      company_name = Api::Params.string(payload["name"])
      raise Api::BadRequest, "company.name is required" if company_name.empty?

      slug = Api::Params.normalize_slug(payload["slug"].presence || company_name)
      raise Api::BadRequest, "Company slug already exists" if Company.exists?(slug: slug)

      auto_approve = !Rails.env.production? && ENV["AUTO_APPROVE_COMPANIES"] != "false"
      contact_email = payload["contactEmail"].present? ? Api::Params.normalize_email(payload["contactEmail"]) : email
      Company.create!(
        owner: user, category: category, category_label: category&.name,
        name: company_name, slug: slug, email: contact_email,
        website: Api::Params.optional_string(payload["website"]),
        service_type: Api::Params.optional_string(payload["service"]),
        specialization: Api::Params.optional_string(payload["specialization"]),
        emergency_service: Api::Params.parse_optional_boolean(payload["emergencyService"], "company.emergencyService") || false,
        employees: Api::Params.optional_string(payload["employees"]),
        revenue: Api::Params.optional_string(payload["revenue"]),
        country: Api::Params.optional_string(payload["country"]),
        country_code: Api::Params.optional_string(payload["countryCode"]),
        phone_number: Api::Params.optional_string(payload["phoneNumber"]),
        contact_email: contact_email,
        owner_name: name,
        first_name: Api::Params.optional_string(payload["firstName"]) || names[:first_name].presence,
        last_name: Api::Params.optional_string(payload["lastName"]) || names[:last_name].presence,
        job_title: Api::Params.optional_string(payload["jobTitle"]),
        location: Api::Params.optional_string(payload["destination"]) || Api::Params.optional_string(payload["location"]),
        description: Api::Params.optional_string(payload["description"]),
        status: auto_approve ? "approved" : "pending", verified: auto_approve,
        signup_channel: signup_method
      )
    end
  end
end
