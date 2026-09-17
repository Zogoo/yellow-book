class Session < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :admin, optional: true

  validates :refresh_token_hash, presence: true, uniqueness: true
  validates :expires_at, presence: true
  validate :exactly_one_actor

  scope :live, -> { where(revoked_at: nil).where("expires_at > ?", Time.current) }

  def revoke!
    update!(revoked_at: Time.current) if revoked_at.nil?
  end

  private

  def exactly_one_actor
    return if [ user_id, admin_id ].compact.size == 1

    errors.add(:base, "Exactly one actor must be provided")
  end
end
