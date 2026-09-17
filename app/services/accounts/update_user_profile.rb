module Accounts
  # PUT /user/profile
  class UpdateUserProfile < ApplicationService
    FIELDS = { "firstName" => :first_name, "lastName" => :last_name, "phone" => :phone, "jobTitle" => :job_title,
               "company" => :company_name, "location" => :location, "timeZone" => :time_zone, "bio" => :bio, "avatar" => :avatar }.freeze

    def initialize(user:, payload:)
      @user = user
      @body = Api::Params.as_object(payload)
    end

    def call
      attrs = {}
      FIELDS.each { |key, column| attrs[column] = Api::Params.optional_string(@body[key]) if @body.key?(key) }
      if @body.key?("email")
        email = Api::Params.normalize_email(@body["email"])
        Accounts::EnsureEmailAvailable.call(email: email, ignore_user_id: @user.id)
        attrs[:email] = email
      end
      if @body.key?("security")
        sec = Api::Params.as_object(@body["security"])
        current = Api::Params.as_json_object(@user.security)
        current["lastPasswordChange"] = sec["lastPasswordChange"].to_s if sec["lastPasswordChange"].present?
        attrs[:security] = current
      end
      if @body.key?("updatedAt")
        current = Api::Params.as_json_object(@user.security)
        attrs[:security] = current.merge("profileUpdatedAt" => @body["updatedAt"].to_s)
      end
      if @body.key?("firstName") || @body.key?("lastName")
        first = (@body.key?("firstName") ? @body["firstName"].to_s : @user.first_name.to_s).strip
        last = (@body.key?("lastName") ? @body["lastName"].to_s : @user.last_name.to_s).strip
        attrs[:display_name] = "#{first} #{last}".strip.presence || @user.display_name
      end
      @user.update!(attrs)
      @user
    end
  end
end
