class Review < ApplicationRecord
  STATUSES = %w[pending approved rejected on_hold banned].freeze
  REPLY_STATUSES = %w[pending approved rejected on_hold].freeze

  belongs_to :company
  belongs_to :user, optional: true
  belongs_to :moderator, class_name: "Admin", foreign_key: :moderator_admin_id, optional: true
  belongs_to :company_response_moderator, class_name: "Admin", foreign_key: :company_response_moderator_admin_id, optional: true
  has_many :review_like_shares, dependent: :destroy

  validates :reviewer_name, presence: true
  validates :content, presence: true
  validates :rating, inclusion: { in: 1..5 }
  validates :status, inclusion: { in: STATUSES }
  validates :company_response_status, inclusion: { in: REPLY_STATUSES }, allow_nil: true

  scope :approved, -> { where(status: "approved") }
  scope :recent_first, -> { order(updated_at: :desc) }

  # companyResponse is stored as TEXT: either a JSON document or plain text.
  def parsed_company_response
    raw = company_response
    return nil if raw.nil?
    trimmed = raw.to_s.strip
    return nil if trimmed.empty? || trimmed.casecmp("null").zero?
    parsed = JSON.parse(raw)
    return nil if parsed.nil?
    parsed.is_a?(Hash) ? parsed : { "text" => parsed.to_s }
  rescue JSON::ParserError
    { "text" => raw }
  end

  def company_response_present?
    company_response.present? && company_response.to_s.strip != ""
  end
end
