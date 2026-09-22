module Auth
  # Fixed-window per-IP throttling for the abuse-prone auth endpoints.
  class RateLimiter
    Rule = Struct.new(:name, :limit, :window)

    RULES = {
      register: Rule.new("auth_signup", 8, 60),
      login: Rule.new("auth_login", 12, 60),
      email_code_request: Rule.new("auth_email_code_request", 8, 60),
      email_code_verify: Rule.new("auth_email_code_verify", 12, 60),
      oauth_authorize: Rule.new("auth_oauth_authorize", 20, 60),
      oauth_callback: Rule.new("auth_oauth_callback", 20, 60),
      password_reset: Rule.new("auth_password_reset", 6, 60),
      support_message: Rule.new("support_message", 5, 300)
    }.freeze

    def self.check!(rule_key, ip)
      return if ENV.fetch("DISABLE_RATE_LIMIT") { Rails.env.test? ? "true" : "false" } == "true"

      rule = RULES.fetch(rule_key)
      key = "rate:#{rule.name}:#{ip.presence || 'unknown'}"
      count = Rails.cache.increment(key, 1, expires_in: rule.window.seconds, initial: 0)
      if count.nil?
        Rails.cache.write(key, 1, expires_in: rule.window.seconds)
        count = 1
      end
      raise Api::TooManyRequests if count > rule.limit
    end
  end
end
