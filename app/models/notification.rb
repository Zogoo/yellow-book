class Notification < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :admin, optional: true
  belongs_to :company, optional: true

  validates :title, presence: true
  validates :message, presence: true

  scope :recent_first, -> { order(created_at: :desc) }
end
