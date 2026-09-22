# A message from the public contact form. Kept so "Send" means something.
class SupportMessage < ApplicationRecord
  STATUSES = %w[new handled].freeze

  belongs_to :user, optional: true

  validates :name, :email, :message, presence: true
  validates :status, inclusion: { in: STATUSES }

  scope :recent_first, -> { order(created_at: :desc) }
  scope :unhandled, -> { where(status: "new") }
end
