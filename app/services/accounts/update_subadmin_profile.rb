module Accounts
  # PUT /subadmin/profile
  class UpdateSubadminProfile < ApplicationService
    def initialize(admin:, payload:)
      @admin = admin
      @body = Api::Params.as_object(payload)
    end

    def call
      profile = Api::Params.as_json_object(@admin.profile)
      preferences = Api::Params.as_json_object(@admin.preferences)
      security = Api::Params.as_json_object(@admin.security)

      %w[fullName email mobile phone role location timezone bio].each { |k| profile[k] = @body[k] if @body.key?(k) }
      if @body.key?("preferences")
        prefs = Api::Params.as_object(@body["preferences"])
        preferences["notifications"] = Api::Params.parse_boolean(prefs["notifications"], "preferences.notifications") if prefs.key?("notifications")
        preferences["weeklyDigest"] = Api::Params.parse_boolean(prefs["weeklyDigest"], "preferences.weeklyDigest") if prefs.key?("weeklyDigest")
      end
      if @body.key?("security")
        sec = Api::Params.as_object(@body["security"])
        security["lastPasswordChange"] = sec["lastPasswordChange"].to_s if sec.key?("lastPasswordChange")
      end

      @admin.update!(
        name: profile["fullName"].presence&.to_s || @admin.name,
        email: profile["email"].present? ? Api::Params.normalize_email(profile["email"]) : @admin.email,
        phone: profile["mobile"].presence&.to_s || @admin.phone,
        role_label: profile["role"].presence&.to_s || @admin.role_label,
        profile: profile, preferences: preferences, security: security
      )
      AdminSerializer.subadmin_profile(@admin, profile, preferences, security)
    end
  end
end
