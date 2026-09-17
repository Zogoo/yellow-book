module Auth
  # Links an external identity to a user (creating one if needed) and signs in.
  class OauthSignIn < ApplicationService
    def initialize(provider:, email:, raw_name:, provider_uid:, request:)
      @provider = provider
      @email = email
      @raw_name = raw_name
      @provider_uid = provider_uid
      @request = request
    end

    def call
      oauth = OauthAccount.includes(:user).find_by(provider: @provider, provider_uid: @provider_uid)
      user = oauth&.user
      if user.nil?
        user = User.find_by(email: @email)
        if user.nil?
          Accounts::EnsureEmailAvailable.call(email: @email)
          names = Api::Params.split_name(@raw_name)
          user = User.create!(
            email: @email, first_name: names[:first_name].presence, last_name: names[:last_name].presence,
            display_name: @raw_name, role: "user", status: "active",
            signup_method: @provider.capitalize, email_verified_at: Time.current
          )
        elsif user.email_verified_at.nil?
          user.update!(email_verified_at: Time.current)
        end
      end

      if oauth.nil?
        OauthAccount.create!(user: user, provider: @provider, provider_uid: @provider_uid)
      elsif oauth.user_id != user.id
        oauth.update!(user: user)
      end

      user.sync_role!
      owned = user.companies.order(created_at: :asc).first
      session = Auth::IssueSession.call(user: user, request: @request)
      { token: session.token, user: AuthSerializer.user_item(user, owned ? "company" : "user", owned&.id) }
    end
  end
end
