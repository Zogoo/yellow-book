class PasswordReset < ApplicationRecord
  belongs_to :user

  validates :token_hash, presence: true, uniqueness: true
  validates :expires_at, presence: true

  def usable?
    !used && expires_at > Time.current
  end
end
