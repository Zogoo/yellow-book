class OauthAuthorizationRequest < ApplicationRecord
  validates :provider, :state, :expires_at, presence: true
  validates :state, uniqueness: true

  def expired?
    expires_at < Time.current
  end
end
