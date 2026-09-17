module Auth
  # Creates a session row for exactly one actor and returns the bearer token.
  class IssueSession < ApplicationService
    Result = Struct.new(:token, :session_id, :expires_at, keyword_init: true)

    def initialize(user: nil, admin: nil, request: nil)
      @user = user
      @admin = admin
      @request = request
    end

    def call
      raise Api::BadRequest, "Exactly one actor must be provided" unless [ @user, @admin ].compact.size == 1

      @user&.sync_role!
      session = Session.create!(
        user: @user, admin: @admin,
        refresh_token_hash: Api::Params.hash_value(SecureRandom.hex(48)),
        ip_address: ip_address, user_agent: user_agent,
        expires_at: 30.days.from_now
      )
      expires_at = Auth::JwtService.access_ttl.from_now
      token = Auth::JwtService.encode(kind: @user ? "user" : "admin", id: (@user || @admin).id, session_id: session.id, expires_at: expires_at)
      Result.new(token: token, session_id: session.id, expires_at: expires_at)
    end

    private

    def ip_address
      return nil unless @request

      forwarded = @request.headers["X-Forwarded-For"].to_s.split(",").first&.strip
      forwarded.presence || @request.remote_ip
    end

    def user_agent
      @request&.user_agent
    end
  end
end
