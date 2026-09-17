class OtpCode < ApplicationRecord
  PURPOSES = %w[signup login reset_password].freeze

  validates :email, :code_hash, :purpose, :expires_at, presence: true
  validates :purpose, inclusion: { in: PURPOSES }

  scope :live, -> { where("expires_at > ?", Time.current) }
end
