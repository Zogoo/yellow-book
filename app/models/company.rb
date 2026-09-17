class Company < ApplicationRecord
  STATUSES = %w[pending approved rejected].freeze

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
end
