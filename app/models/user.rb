class User < ApplicationRecord
  has_secure_password validations: false

  attribute :permissions, :json, default: -> { [] }

  has_many :companies, foreign_key: :owner_user_id, dependent: :destroy, inverse_of: :owner
  belongs_to :owned_company, class_name: "Company", foreign_key: :company_id, optional: true
  has_many :reviews, dependent: :nullify
  has_many :review_like_shares, dependent: :destroy
  has_many :favorites, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :sessions, dependent: :destroy
  has_many :oauth_accounts, dependent: :destroy
  has_many :password_resets, dependent: :destroy

  normalizes :email, with: ->(e) { e.to_s.strip.downcase }

  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :status, inclusion: { in: %w[active suspended] }
  validates :role, inclusion: { in: %w[user company] }

  scope :recent_first, -> { order(created_at: :desc) }

  def display_label
    combined = [ first_name.to_s, last_name.to_s ].join(" ").strip
    display_name.to_s.strip.presence || combined.presence || email.to_s.split("@").first.presence || "User"
  end

  def active?
    status == "active"
  end

  # Keeps `role` in sync with company ownership (mirrors the DB trigger in the original schema).
  def sync_role!
    next_role = companies.exists? ? "company" : "user"
    update_column(:role, next_role) if role != next_role
  end
end
