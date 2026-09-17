module Reviews
  # {review_id => {likes:, dislikes:, shares:}} computed from review_like_shares rows.
  class LikeShareCounts < ApplicationService
    def initialize(review_ids:)
      @review_ids = Array(review_ids).compact.uniq
    end

    def call
      map = @review_ids.to_h { |id| [ id, { likes: 0, dislikes: 0, shares: 0 } ] }
      return map if @review_ids.empty?

      ReviewLikeShare.where(review_id: @review_ids).group(:review_id, :action).count.each do |(review_id, action), count|
        key = { "like" => :likes, "dislike" => :dislikes, "share" => :shares }[action]
        map[review_id][key] = count if key
      end
      map
    end
  end
end
