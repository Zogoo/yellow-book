module Companies
  # PUT /company/profile: merges the profile/preferences/security JSON documents
  # and mirrors the profile fields onto the company columns.
  class UpdateCompanyProfile < ApplicationService
    def initialize(company:, payload:)
      @company = company
      @body = Api::Params.as_object(payload)
    end

    def call
      profile = Api::Params.as_json_object(@company.profile)
      preferences = Api::Params.as_json_object(@company.preferences)
      security = Api::Params.as_json_object(@company.security)

      %w[fullName phoneNumber email location about avatar].each { |k| profile[k] = @body[k] if @body.key?(k) }
      if @body.key?("preferences")
        prefs = Api::Params.as_object(@body["preferences"])
        preferences["emailNotifications"] = Api::Params.parse_optional_boolean(prefs["emailNotifications"], "preferences.emailNotifications")
        preferences["pushNotifications"] = Api::Params.parse_optional_boolean(prefs["pushNotifications"], "preferences.pushNotifications")
      end
      if @body.key?("security")
        sec = Api::Params.as_object(@body["security"])
        security["lastPasswordChange"] = sec["lastPasswordChange"].to_s if sec.key?("lastPasswordChange")
      end
      profile["updatedAt"] = @body["updatedAt"].to_s if @body.key?("updatedAt")

      @company.update!(
        profile: profile, preferences: preferences, security: security,
        owner_name: profile["fullName"].presence&.to_s || @company.owner_name,
        phone_number: profile["phoneNumber"].presence&.to_s || @company.phone_number,
        contact_email: profile["email"].presence&.to_s || @company.contact_email,
        location: profile["location"].presence&.to_s || @company.location,
        description: profile["about"].presence&.to_s || @company.description,
        image: profile["avatar"].presence&.to_s || @company.image
      )
      @company.reload
      CompanySerializer.profile(@company, profile, preferences, security)
    end
  end
end
