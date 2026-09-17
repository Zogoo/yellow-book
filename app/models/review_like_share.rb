class ReviewLikeShare < ApplicationRecord
  ACTIONS = %w[like dislike share].freeze

  belongs_to :user
  belongs_to :review

  validates :action, inclusion: { in: ACTIONS }
end
