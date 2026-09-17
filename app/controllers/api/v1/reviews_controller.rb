module Api
  module V1
    class ReviewsController < ApplicationController
      ANY_ROLE = %w[super_admin admin agent company user].freeze

      before_action :require_verified_email!, except: %i[recent agency_index]
      before_action -> { require_roles!(*ANY_ROLE) }, only: %i[show update destroy_recent]
      before_action -> { require_roles!("user") }, only: %i[create my_reviews update_my_review destroy_my_review]
      before_action :require_account!, only: %i[like dislike share]
      before_action -> { require_roles!("company") }, only: :reply
      before_action -> { require_roles!("super_admin", "admin", "agent") }, only: :destroy

      # GET /reviews/recent — approved by default; authenticated callers may pick a status.
      def recent
        scope = Reviews::ScopeForAccount.call(account: current_account, anonymous_approved_only: false).approved
        allow_status = current_account.present?
        scope = scope.unscope(where: :status) if allow_status && query_params["status"].present?
        reviews, meta = paginate(ReviewsQuery.new(scope).call(query_params, allow_status: allow_status))
        render_list(reviews, meta)
      end

      # GET /agency/reviews
      def agency_index
        scope = Reviews::ScopeForAccount.call(account: current_account)
        scope = scope.where(company_id: Api::Params.parse_id(query_params["companyId"], "companyId")) if query_params["companyId"].present?
        scope = scope.unscope(where: :status) if current_account.nil? && query_params["status"].present?
        reviews, meta = paginate(ReviewsQuery.new(scope).call(query_params))
        render_list(reviews, meta)
      end

      def show
        review = find_review
        raise Api::Forbidden, "You cannot access this review" unless Reviews::AccessPolicy.call(review: review, account: current_account)

        render_data(serialize(review, include_unapproved_reply: true))
      end

      def create
        review = Reviews::CreateReview.call(payload: body_params, query: query_params, account: current_account)
        render_data(ReviewSerializer.recent(review, { likes: 0, dislikes: 0, shares: 0 }), http_status: :created)
      end

      def update
        review = Reviews::UpdateReview.call(review: find_review, payload: body_params, account: current_account)
        render_data(serialize(review, include_unapproved_reply: true))
      end

      def destroy
        destroy_review
      end

      def destroy_recent
        destroy_review
      end

      def like = react("like")
      def dislike = react("dislike")
      def share = react("share")

      def reply
        review = Reviews::ReplyToReview.call(review: find_review, payload: body_params, account: current_account)
        render_data(serialize(review, include_unapproved_reply: true), http_status: :created)
      end

      def my_reviews
        scope = Review.where(user_id: current_account.id)
        reviews, meta = paginate(ReviewsQuery.new(scope).call(query_params, use_time_range: false, search_company_name: true))
        counts = Reviews::LikeShareCounts.call(review_ids: reviews.map(&:id))
        render_data(reviews.map { |r| ReviewSerializer.mine(r, counts[r.id]) }, meta.merge(perPage: meta[:limit]))
      end

      def update_my_review
        review = find_review
        raise Api::Forbidden, "You can update only your own reviews" unless review.user_id == current_account.id

        body = body_params
        attrs = {}
        attrs[:rating] = Api::Params.parse_rating(body["rating"]) if body.key?("rating")
        if %w[review content text].any? { |k| body.key?(k) }
          attrs[:content] = Reviews::PlainText.parse(body["review"].presence || body["content"].presence || body["text"], "content")
        end
        review.update!(attrs)
        render_data(ReviewSerializer.mine(review, Reviews::LikeShareCounts.call(review_ids: [ review.id ])[review.id]))
      end

      def destroy_my_review
        review = find_review
        raise Api::Forbidden, "You can delete only your own reviews" unless review.user_id == current_account.id

        review.destroy!
        ActivityEvent.log("Review deleted: #{review.id}", "Trash2", { reviewId: review.id })
        head :no_content
      end

      private

      def react(action)
        review = Reviews::ReactToReview.call(review: find_review, account: current_account, action: action)
        render_data(serialize(review), http_status: :created)
      end

      def destroy_review
        review = find_review
        raise Api::Forbidden, "Companies cannot delete user reviews" if current_account.user? && current_account.company?
        raise Api::Forbidden, "You cannot delete this review" unless Reviews::AccessPolicy.call(review: review, account: current_account)

        review.destroy!
        ActivityEvent.log("Review deleted: #{review.id}", "Trash2", { reviewId: review.id })
        render_data(id: review.id, deleted: true)
      end

      def find_review
        Review.includes(:company, :user).find_by(id: route_id) or raise Api::NotFound, "Review not found"
      end

      def render_list(reviews, meta)
        counts = Reviews::LikeShareCounts.call(review_ids: reviews.map(&:id))
        render_data(reviews.map { |r| ReviewSerializer.recent(r, counts[r.id], include_unapproved_reply: current_account.present?) }, meta)
      end

      def serialize(review, include_unapproved_reply: current_account.present?)
        ReviewSerializer.recent(review, Reviews::LikeShareCounts.call(review_ids: [ review.id ])[review.id], include_unapproved_reply: include_unapproved_reply)
      end
    end
  end
end
