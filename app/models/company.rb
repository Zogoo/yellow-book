class Company < ApplicationRecord
  STATUSES = %w[pending approved rejected].freeze

  before_save :refresh_search_text

  belongs_to :owner, class_name: "User", foreign_key: :owner_user_id, inverse_of: :companies
  belongs_to :category, optional: true
  has_many :reviews, dependent: :destroy
  has_many :favorites, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :company_assignments, dependent: :destroy
  has_many :assigned_admins, through: :company_assignments, source: :admin

  normalizes :email, with: ->(e) { e.to_s.strip.downcase.presence }
  normalizes :contact_email, with: ->(e) { e.to_s.strip.downcase.presence }

  validates :name, presence: true
  validates :slug, presence: true, uniqueness: true
  validates :status, inclusion: { in: STATUSES }

  scope :approved, -> { where(status: "approved") }
  scope :recent_first, -> { order(updated_at: :desc) }

  def category_name
    category_label.presence || category&.name
  end

  def approved?
    status == "approved"
  end

  private

  # One folded haystack so Cyrillic and Latin queries both match.
  def refresh_search_text
    self.search_text = Api::Text.searchable(
      name, slug, category_label, service_type, specialization,
      location, district, email, contact_email, owner_name, description
    )
  end
end
