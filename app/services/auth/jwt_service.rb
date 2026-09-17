module Auth
  # Signed bearer tokens. The payload binds the token to one session row so a
  # logout (session revoke) or password reset invalidates it immediately.
  class JwtService
    ALGORITHM = "HS256"
    DEFAULT_TTL = 8.hours

    class << self
      def encode(kind:, id:, session_id:, expires_at:)
        payload = { sub: id, kind: kind, sid: session_id, exp: expires_at.to_i, iat: Time.current.to_i, jti: SecureRandom.hex(8) }
        JWT.encode(payload, secret_key, ALGORITHM)
      end

      # nil for anything that is not a valid, unexpired token signed by us.
      def decode(token)
        JWT.decode(token, secret_key, true, { algorithm: ALGORITHM }).first.symbolize_keys
      rescue JWT::DecodeError
        nil
      end

      def access_ttl
        seconds = ENV.fetch("ACCESS_TOKEN_TTL_SECONDS", DEFAULT_TTL.to_i).to_i
        seconds.positive? ? seconds.seconds : DEFAULT_TTL
      end

      private

      def secret_key
        if Rails.env.production?
          ENV.fetch("JWT_SECRET") { raise "JWT_SECRET must be set in production" }
        else
          ENV.fetch("JWT_SECRET") { Rails.application.secret_key_base }
        end
      end
    end
  end
end
