class ActivityEvent < ApplicationRecord
  validates :title, presence: true

  scope :recent_first, -> { order(created_at: :desc) }

  # Activity logging is non-critical: never let it break the request that triggered it.
  def self.log(title, icon, payload = nil)
    create!(title: title, icon: icon, payload: payload)
  rescue StandardError => e
    Rails.logger.warn("activity log failed: #{e.message}")
    nil
  end
end
