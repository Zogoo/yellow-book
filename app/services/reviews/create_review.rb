module Reviews
  COMPANY_CANNOT_REVIEW = "You cannot review your own company.".freeze
  LIKE_DISLIKE_SHARE_FORBIDDEN = "Only regular users and companies can like, dislike, or share reviews. Admins and sub-admins cannot.".freeze

  class CreateReview < ApplicationService
    def initialize(payload:, query:, account:)
      @body = Api::Params.as_object(payload)
      @query = query
      @account = account
    end

    def call
      raise Api::Unauthorized, "Authentication is required to submit a review." unless @account&.user?

      company = Company.find_by(id: resolve_company_id) or raise Api::BadRequest, "companyId does not reference an existing company"
      raise Api::Forbidden, COMPANY_CANNOT_REVIEW if company.owner_user_id == @account.id
      existing = Review.find_by(company_id: company.id, user_id: @account.id)
      if existing
        raise Api::Conflict.new(
          "You have already reviewed #{company.name}. Edit your existing review instead.",
          details: { reviewId: existing.id, companyId: company.id }
        )
      end
      reviewer_name = Api::Params.string(@body["reviewerName"]).presence || @account.name.presence || "Anonymous Reviewer"
      reviewer_email = @body["reviewerEmail"].present? ? Api::Params.normalize_email(@body["reviewerEmail"]) : @account.email
      content = Reviews::PlainText.parse(@body["content"].presence || @body["review"].presence || @body["text"], "content")
      rating = Api::Params.parse_rating(@body["rating"])
      moderator_id = Api::Params.parse_optional_id(@body["moderatorAdminId"].presence || @body["moderator_admin_id"], "moderatorAdminId")

      review = Review.create!(
        company: company, company_name: company.name, user_id: @account.id, moderator_admin_id: moderator_id,
        reviewer_name: reviewer_name, reviewer_email: reviewer_email, content: content, rating: rating,
        status: "pending", likes: 0, shares: 0, dislikes: 0, company_response: nil
      )
      ActivityEvent.log("Review created: #{review.id}", "Star", { reviewId: review.id, companyId: company.id })
      Notifications::Deliver.review_received(review)
      review
    end

    private

    def resolve_company_id
      candidates = %w[companyId company_id listingId listing_id]
      raw = candidates.map { |k| @body[k] }.find(&:present?) || candidates.map { |k| @query[k] }.find(&:present?)
      return Api::Params.parse_id(raw, "companyId") if raw.present?

      slug_raw = %w[companySlug company_slug].map { |k| @body[k].presence || @query[k] }.find(&:present?)
      if slug_raw.present?
        slug = slug_raw.to_s.strip.downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-+|-+\z/, "")
        company = Company.find_by(slug: slug) if slug.present?
        return company.id if company
      end
      raise Api::BadRequest, "companyId (or companySlug) is required to identify the company you are reviewing. Pass it in the request body or query (e.g. companyId, listingId, or companySlug)."
    end
  end
end
