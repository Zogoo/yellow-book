require "digest"

module Api
  # Input parsing/validation helpers shared by services. Every parser raises
  # Api::BadRequest with the same messages the original contract used.
  module Params
    module_function

    WEAK_PASSWORDS = %w[password password123 secret secret123 admin123! qwerty123! yellowbook123!].freeze
    TRUE_VALUES = %w[true 1 yes y on].freeze
    FALSE_VALUES = %w[false 0 no n off].freeze

    def as_object(value, message = "Payload must be an object")
      hash = value.respond_to?(:to_unsafe_h) ? value.to_unsafe_h : value
      raise Api::BadRequest, message unless hash.is_a?(Hash)

      hash.to_h.transform_keys(&:to_s)
    end

    def as_json_object(value)
      value.is_a?(Hash) ? value.transform_keys(&:to_s) : {}
    end

    def blank?(value)
      value.nil? || (value.respond_to?(:empty?) && value.empty?)
    end

    def string(value)
      value.nil? ? "" : value.to_s.strip
    end

    def optional_string(value)
      s = string(value)
      s.empty? ? nil : s
    end

    def iso(time)
      time&.utc&.iso8601(3)
    end

    def date_only(time)
      time&.utc&.strftime("%Y-%m-%d")
    end

    def time_only(time)
      time&.utc&.strftime("%H:%M:%S")
    end

    def hash_value(value)
      Digest::SHA256.hexdigest(value.to_s)
    end

    def parse_id(value, field = "id")
      raw = string(value)
      raise Api::BadRequest, "#{field} must be a valid id" unless raw.match?(/\A\d+\z/)

      raw.to_i
    end

    def parse_optional_id(value, field = "id")
      return nil if blank?(value)

      parse_id(value, field)
    end

    def normalize_email(value)
      email = string(value).downcase
      raise Api::BadRequest, "Valid email is required" if email.empty? || !email.include?("@")

      email
    end

    def parse_password(value, field = "password")
      password = string(value)
      raise Api::BadRequest, "#{field} must contain at least 12 characters" if password.length < 12
      unless password.match?(/[a-z]/) && password.match?(/[A-Z]/) && password.match?(/\d/) && password.match?(/[^A-Za-z0-9]/)
        raise Api::BadRequest, "#{field} must include uppercase, lowercase, number, and symbol characters"
      end
      raise Api::BadRequest, "#{field} is too common" if WEAK_PASSWORDS.include?(password.downcase)

      password
    end

    def parse_boolean(value, field)
      return value if value == true || value == false

      raw = string(value).downcase
      return true if TRUE_VALUES.include?(raw)
      return false if FALSE_VALUES.include?(raw)

      raise Api::BadRequest, "#{field} must be boolean"
    end

    def parse_optional_boolean(value, field)
      return nil if blank?(value)

      parse_boolean(value, field)
    end

    def parse_integer(value, field)
      raw = value.is_a?(Numeric) ? value : string(value)
      raise Api::BadRequest, "#{field} must be an integer" unless raw.to_s.match?(/\A-?\d+\z/)

      raw.to_i
    end

    def parse_rating(value)
      rating = parse_integer(value, "rating")
      raise Api::BadRequest, "rating must be between 1 and 5" unless (1..5).cover?(rating)

      rating
    end

    def parse_optional_enum(value, allowed, field)
      return nil if blank?(value)

      normalized = string(value).downcase.gsub(/[\s-]+/, "_")
      raise Api::BadRequest, "#{field} is invalid" unless allowed.include?(normalized)

      normalized
    end

    def parse_required_enum(value, allowed, field)
      parse_optional_enum(value, allowed, field) || raise(Api::BadRequest, "#{field} is required")
    end

    def normalize_slug(value, field = "slug")
      slug = string(value).downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-+|-+\z/, "")
      raise Api::BadRequest, "#{field} is required" if slug.empty?

      slug
    end

    def split_name(name)
      normalized = string(name).squeeze(" ")
      return { first_name: "", last_name: "" } if normalized.empty?

      first, *rest = normalized.split(" ")
      { first_name: first.to_s, last_name: rest.join(" ") }
    end

    def parse_date(value, end_of_day: false)
      return nil if blank?(value)

      parsed = Time.zone.parse(value.to_s)
      raise Api::BadRequest, "Invalid date input" if parsed.nil?

      end_of_day ? parsed.end_of_day : parsed.beginning_of_day
    rescue ArgumentError
      raise Api::BadRequest, "Invalid date input"
    end

    def parse_time_range(value)
      return nil if blank?(value)

      normalized = string(value).downcase
      now = Time.current
      from =
        case normalized
        when "24h", "1d", "day", "today" then now - 24.hours
        when "7d", "1w", "week", "7days" then now - 7.days
        when "30d", "1m", "month", "30days" then now - 30.days
        when "90d", "3m", "quarter", "90days" then now - 90.days
        when "365d", "1y", "year" then now - 1.year
        else raise Api::BadRequest, "timeRange is invalid"
        end
      { from: from, to: now }
    end

    # Combined created_at window from dateFrom/dateTo (explicit) or timeRange (relative).
    def date_window(query)
      from = parse_date(query["dateFrom"])
      to = parse_date(query["dateTo"], end_of_day: true)
      range = parse_time_range(query["timeRange"])
      effective_from = from || range&.dig(:from)
      effective_to = to || range&.dig(:to)
      return nil unless effective_from || effective_to

      { from: effective_from, to: effective_to }
    end

    def like(term)
      "%#{ActiveRecord::Base.sanitize_sql_like(term.to_s)}%"
    end
  end
end
