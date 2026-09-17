require "net/http"

module Auth
  # Google OAuth 2.0 authorization-code flow plus the id_token shortcut used by
  # the POST callback. Account linking lives in Auth::OauthSignIn.
  class GoogleOauth
    PROVIDERS = %w[google facebook apple].freeze

    class << self
      def client_id = ENV["GOOGLE_CLIENT_ID"].presence
      def client_secret = ENV["GOOGLE_CLIENT_SECRET"].presence

      def callback_url
        raw = ENV["GOOGLE_CALLBACK_URL"].presence ||
              "#{ENV.fetch('APP_URL', ENV.fetch('BACKEND_URL', 'http://localhost:3001'))}/api/v1/auth/oauth/google/callback"
        raw.strip.sub(%r{/+\z}, "")
      end

      def authorize(provider_raw, query)
        provider = Api::Params.parse_required_enum(provider_raw, PROVIDERS, "provider")
        redirect_uri = Api::Params.string(query["redirectUri"])
        raise Api::BadRequest, "redirectUri is required (e.g. redirectUri=http://localhost:4200)" if redirect_uri.empty?

        state = SecureRandom.hex(16)
        expires_at = 10.minutes.from_now
        if provider == "google"
          raise Api::BadRequest, "Google OAuth is not configured (GOOGLE_CLIENT_ID missing)" unless client_id

          OauthAuthorizationRequest.create!(provider: provider, state: state, redirect_uri: redirect_uri, expires_at: expires_at)
          params = { client_id: client_id, redirect_uri: callback_url, response_type: "code",
                     scope: "email profile openid", state: state, access_type: "offline", prompt: "consent" }
          url = "https://accounts.google.com/o/oauth2/v2/auth?#{URI.encode_www_form(params)}"
          return { provider: provider, authorizationUrl: url, state: state, expiresAt: Api::Params.iso(expires_at) }
        end

        OauthAuthorizationRequest.create!(provider: provider, state: state, redirect_uri: redirect_uri, expires_at: expires_at)
        url = "/api/v1/auth/oauth/#{provider}/callback?state=#{CGI.escape(state)}&redirectUri=#{CGI.escape(redirect_uri)}"
        { provider: provider, authorizationUrl: url, state: state, expiresAt: Api::Params.iso(expires_at) }
      end

      # GET callback: exchanges the code, resolves the identity, returns the redirect target.
      def callback_redirect(provider_raw, query, request)
        provider = Api::Params.parse_required_enum(provider_raw, PROVIDERS, "provider")
        raise Api::BadRequest, "GET callback is only supported for Google" unless provider == "google"

        code = Api::Params.string(query["code"])
        state = Api::Params.string(query["state"])
        raise Api::BadRequest, "code and state are required" if code.empty? || state.empty?

        oauth_req = OauthAuthorizationRequest.find_by(state: state)
        raise Api::Unauthorized, "Invalid or expired state" if oauth_req.nil? || oauth_req.provider != "google"
        if oauth_req.expired?
          oauth_req.destroy
          raise Api::Unauthorized, "State expired"
        end
        redirect_uri = oauth_req.redirect_uri.presence || ENV.fetch("APP_FRONTEND_URL", "http://localhost:4200")
        oauth_req.destroy
        raise Api::BadRequest, "Google OAuth is not configured (GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required)" unless client_id && client_secret

        tokens = exchange_code(code)
        info = tokens["id_token"].present? ? verify_id_token(tokens["id_token"]) : fetch_userinfo(tokens["access_token"])
        result = Auth::OauthSignIn.call(provider: provider, email: info[:email], raw_name: info[:name], provider_uid: info[:uid], request: request)
        separator = redirect_uri.include?("?") ? "&" : "?"
        "#{redirect_uri}#{separator}token=#{CGI.escape(result[:token])}&provider=google"
      end

      # POST callback: the client already holds a Google id_token.
      def callback_with_id_token(provider_raw, payload, request)
        provider = Api::Params.parse_required_enum(provider_raw, PROVIDERS, "provider")
        raise Api::Unauthorized, "Unsupported OAuth provider" unless provider == "google"

        body = Api::Params.as_object(payload, "Invalid OAuth payload: body must be a JSON object with idToken, or use GET /api/v1/auth/oauth/google/authorize?redirectUri=YOUR_FRONTEND_URL")
        id_token = Api::Params.string(body["idToken"].presence || body["id_token"])
        raise Api::BadRequest, "idToken is required for direct OAuth callback payloads" if id_token.empty?
        raise Api::Unauthorized, "Google OAuth is not configured" unless client_id

        info = begin
          verify_id_token(id_token)
        rescue Api::Error
          nil
        end
        raise Api::Unauthorized, "OAuth identity could not be verified" if info.nil? || info[:email].blank? || info[:uid].blank?

        Auth::OauthSignIn.call(provider: provider, email: info[:email], raw_name: info[:name], provider_uid: info[:uid], request: request)
      end

      private

      def exchange_code(code)
        response = Net::HTTP.post_form(URI("https://oauth2.googleapis.com/token"),
                                       code: code, client_id: client_id, client_secret: client_secret,
                                       redirect_uri: callback_url, grant_type: "authorization_code")
        body = JSON.parse(response.body) rescue {}
        unless response.is_a?(Net::HTTPSuccess)
          message = body["error_description"] || body["error"] || "unexpected response"
          hint = message.to_s.downcase.include?("redirect") ? " Ensure GOOGLE_CALLBACK_URL exactly matches the Authorized redirect URI in Google Cloud Console." : ""
          raise Api::Unauthorized, "Google token exchange failed: #{message}.#{hint}"
        end
        body
      end

      def verify_id_token(id_token)
        response = Net::HTTP.get_response(URI("https://oauth2.googleapis.com/tokeninfo?id_token=#{CGI.escape(id_token)}"))
        payload = JSON.parse(response.body) rescue {}
        unless response.is_a?(Net::HTTPSuccess) && payload["aud"] == client_id && payload["email_verified"].to_s != "false"
          raise Api::Unauthorized, "Google ID token verification failed. Callback URL in use: #{callback_url}."
        end
        email = Api::Params.normalize_email(payload["email"].presence || "#{payload['sub'] || 'google'}@oauth.local")
        { email: email, name: Api::Params.string(payload["name"].presence || payload["given_name"].presence || email.split("@").first).presence || "User", uid: payload["sub"].to_s.presence || "google" }
      end

      def fetch_userinfo(access_token)
        uri = URI("https://www.googleapis.com/oauth2/v2/userinfo")
        request = Net::HTTP::Get.new(uri)
        request["Authorization"] = "Bearer #{access_token}"
        response = Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.request(request) }
        raise Api::Unauthorized, "Google userinfo fetch failed" unless response.is_a?(Net::HTTPSuccess)

        info = JSON.parse(response.body)
        email = Api::Params.normalize_email(info["email"].presence || "#{info['id'] || 'google'}@oauth.local")
        { email: email, name: Api::Params.string(info["name"].presence || info["given_name"].presence || email.split("@").first).presence || "User", uid: info["id"].to_s.presence || "google" }
      end
    end
  end
end
