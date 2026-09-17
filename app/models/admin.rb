class Admin < ApplicationRecord
  has_secure_password validations: false

  attribute :permissions, :json, default: -> { [] }

  belongs_to :creator, class_name: "Admin", foreign_key: :created_by, optional: true
  has_many :notifications, dependent: :destroy
  has_many :company_assignments, dependent: :destroy
  has_many :assigned_companies, through: :company_assignments, source: :company
  has_many :moderated_reviews, class_name: "Review", foreign_key: :moderator_admin_id, dependent: :nullify
  has_many :sessions, dependent: :destroy

  normalizes :email, with: ->(e) { e.to_s.strip.downcase }

  validates :name, presence: true
  validates :email, presence: true, uniqueness: { case_sensitive: false }
  validates :status, inclusion: { in: %w[active inactive] }
  validates :role, inclusion: { in: %w[super_admin admin agent] }

  scope :recent_first, -> { order(created_at: :desc) }

  def agent?
    role == "agent"
  end

  def super_admin?
    role == "super_admin" || admin_role == "SUPER_ADMIN"
  end

  def active?
    status == "active"
  end

  # Platform role as used by role-based authorization: super_admin | admin | agent.
  def platform_role
    return "super_admin" if role == "super_admin"
    return "agent" if agent?
    "admin"
  end

  def normalized_permissions
    Array(permissions).map { |p| p.to_s.strip.downcase }.reject(&:empty?).uniq
  end
end
