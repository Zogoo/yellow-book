module Api
  module V1
    class ReviewsController < ApplicationController
      ANY_ROLE = %w[super_admin admin agent company user].freeze

      before_action :require_verified_email!, except: %i[recent agency_index]
      before_action -> { require_roles!(*ANY_ROLE) }, only: %i[show update destroy_recent]
      before_action -> { require_roles!("user", "company") }, only: %i[create my_reviews update_my_review destroy_my_review]
      before_action :require_account!, only: %i[like dislike share]
      before_action -> { require_roles!("company") }, only: :reply
      before_action -> { require_roles!("super_admin", "admin", "agent") }, only: :destroy

      # GET /reviews/recent — the public feed: approved reviews across the platform.
      # Moderators may widen it by status; nobody else can.
      def recent
        scope = moderator? ? Review.all : Review.approved
        reviews, meta = paginate(ReviewsQuery.new(scope).call(query_params, allow_status: moderator?))
        render_list(reviews, meta)
      end

      # GET /agency/reviews — a company's page when `companyId` is given (published
      # reviews, plus your own whatever its state), and the caller's own queue otherwise.
      def agency_index
        scope =
          if query_params["companyId"].present?
            company_reviews(Api::Params.parse_id(query_params["companyId"], "companyId"))
          else
            Reviews::ScopeForAccount.call(account: current_account)
          end
        reviews, meta = paginate(ReviewsQuery.new(scope).call(query_params, allow_status: moderator?))
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

      # Reactions only make sense on a published review.
      def require_published_review!(review)
        return if review.status == "approved"

        raise Api::NotFound, "Review not found"
      end

      def react(action)
        target = find_review
        require_published_review!(target)
        review = Reviews::ReactToReview.call(review: target, account: current_account, action: action)
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

      # Everyone sees a company's published reviews. Moderators and the company
      # itself see all of them; you always see your own.
      def company_reviews(company_id)
        scope = Review.where(company_id: company_id)
        return scope if moderator?
        return scope if current_account&.company_id == company_id

        mine = current_account&.user? ? current_account.id : nil
        mine ? scope.where("status = ? OR user_id = ?", "approved", mine) : scope.approved
      end

      def moderator?
        current_account&.admin? || false
      end

      # Reviewer contact details are for moderators and the company being reviewed.
      def expose_contact?
        current_account.present? && (current_account.admin? || current_account.company?)
      end

      def render_list(reviews, meta)
        counts = Reviews::LikeShareCounts.call(review_ids: reviews.map(&:id))
        render_data(
          reviews.map do |r|
            ReviewSerializer.recent(r, counts[r.id],
                                    include_unapproved_reply: current_account.present?,
                                    include_contact: expose_contact?)
          end,
          meta
        )
      end

      def serialize(review, include_unapproved_reply: current_account.present?)
        ReviewSerializer.recent(review, Reviews::LikeShareCounts.call(review_ids: [ review.id ])[review.id],
                                include_unapproved_reply: include_unapproved_reply,
                                include_contact: expose_contact? || review.user_id == current_account&.id)
      end
    end
  end
end
