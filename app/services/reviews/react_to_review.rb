module Reviews
  # like/dislike are mutually exclusive toggles per user; share always adds a row.
  class ReactToReview < ApplicationService
    def initialize(review:, account:, action:)
      @review = review
      @account = account
      @action = action
    end

    def call
      raise Api::Unauthorized unless @account
      raise Api::Forbidden, LIKE_DISLIKE_SHARE_FORBIDDEN if @account.admin?

      user_id = @account.id
      reactions = ReviewLikeShare.where(user_id: user_id, review_id: @review.id)
      case @action
      when "like"
        reactions.where(action: "dislike").delete_all
        existing = reactions.find_by(action: "like")
        existing ? existing.destroy : ReviewLikeShare.create!(user_id: user_id, review: @review, action: "like")
      when "dislike"
        reactions.where(action: "like").delete_all
        existing = reactions.find_by(action: "dislike")
        existing ? existing.destroy : ReviewLikeShare.create!(user_id: user_id, review: @review, action: "dislike")
      when "share"
        ReviewLikeShare.create!(user_id: user_id, review: @review, action: "share")
      end
      @review.reload
    end
  end
end
