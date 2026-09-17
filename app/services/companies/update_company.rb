module Companies
  class UpdateCompany < ApplicationService
    STRING_FIELDS = {
      "website" => :website, "specialization" => :specialization, "employees" => :employees, "revenue" => :revenue,
      "country" => :country, "countryCode" => :country_code, "ownerName" => :owner_name, "firstName" => :first_name,
      "lastName" => :last_name, "jobTitle" => :job_title, "location" => :location, "description" => :description,
      "industry" => :industry, "tagline" => :tagline, "services" => :services, "image" => :image
    }.freeze

    def initialize(company:, payload:, account:)
      @company = company
      @body = Api::Params.as_object(payload)
      @account = account
    end

    def call
      authorize!
      previous_owner_id = @company.owner_user_id
      attrs = {}
      attrs[:name] = Api::Params.string(@body["name"]) if @body.key?("name")
      if @body.key?("slug")
        slug = Api::Params.normalize_slug(@body["slug"])
        raise Api::BadRequest, "Company slug already exists" if Company.where.not(id: @company.id).exists?(slug: slug)
        attrs[:slug] = slug
      end
      attrs[:email] = @body["email"].present? ? Api::Params.normalize_email(@body["email"]) : nil if @body.key?("email")
      if %w[category categoryId category_id].any? { |k| @body.key?(k) }
        category = Companies::ResolveCategory.call(body: @body)
        attrs[:category] = category
        attrs[:category_label] = category.name
      end
      if @body.key?("service") || @body.key?("serviceType")
        attrs[:service_type] = @body["service"].present? ? @body["service"].to_s : @body["serviceType"].to_s
      end
      attrs[:emergency_service] = Api::Params.parse_boolean(@body["emergencyService"], "emergencyService") if @body.key?("emergencyService")
      STRING_FIELDS.each { |key, column| attrs[column] = Api::Params.optional_string(@body[key]) if @body.key?(key) }
      if @body.key?("mobile") || @body.key?("phoneNumber")
        attrs[:phone_number] = Api::Params.optional_string(@body["mobile"]) || Api::Params.optional_string(@body["phoneNumber"])
      end
      attrs[:phone] = Api::Params.optional_string(@body["phone"]) if @body.key?("phone")
      attrs[:contact_email] = @body["contactEmail"].present? ? Api::Params.normalize_email(@body["contactEmail"]) : nil if @body.key?("contactEmail")
      attrs[:status] = Api::Params.parse_required_enum(@body["status"], Company::STATUSES, "status") if @body.key?("status")
      attrs[:verified] = Api::Params.parse_boolean(@body["verified"], "verified") if @body.key?("verified")
      attrs[:price] = @body["price"].presence&.to_f if @body.key?("price")
      if @body.key?("ownerUserId") || @body.key?("owner_user_id")
        owner_id = Api::Params.parse_id(@body["ownerUserId"].presence || @body["owner_user_id"], "ownerUserId")
        attrs[:owner] = User.find_by(id: owner_id) || raise(Api::BadRequest, "userId does not reference an existing user")
      end

      @company.update!(attrs)
      @company.owner.sync_role!
      User.find_by(id: previous_owner_id)&.sync_role! if @company.owner_user_id != previous_owner_id
      ActivityEvent.log("Company updated: #{@company.name}", "Building2", { companyId: @company.id, status: @company.status })
      @company
    end

    private

    def authorize!
      if @account.admin? && @account.agent? && !CompanyAssignment.exists?(admin_id: @account.id, company_id: @company.id)
        raise Api::Forbidden, "Agent can update only assigned companies"
      end
      if @account.user? && @company.owner_user_id != @account.id
        raise Api::Forbidden, "You can update only your own company"
      end
    end
  end
end
