class ReviewsQuery < ApplicationQuery
  # Shared filter set for every review list endpoint.
  def call(query, allow_status: true, use_time_range: true, search_company_name: false)
    scope = @relation.includes(:company, :user).recent_first
    if (search = Api::Params.string(query["search"])).present?
      like = Api::Params.like(search)
      scope = if search_company_name
        scope.where("reviews.reviewer_name LIKE :q OR reviews.content LIKE :q OR reviews.company_name LIKE :q", q: like)
      else
        scope.where("reviews.reviewer_name LIKE :q OR reviews.content LIKE :q", q: like)
      end
    end
    if allow_status && query["status"].present?
      scope = scope.where(status: Api::Params.parse_required_enum(query["status"], Review::STATUSES, "status"))
    end
    scope = scope.where(rating: Api::Params.parse_rating(query["rating"])) unless Api::Params.blank?(query["rating"])
    window = use_time_range ? Api::Params.date_window(query) : explicit_window(query)
    if window
      scope = scope.where("reviews.created_at >= ?", window[:from]) if window[:from]
      scope = scope.where("reviews.created_at <= ?", window[:to]) if window[:to]
    end
    scope
  end

  private

  def explicit_window(query)
    from = Api::Params.parse_date(query["dateFrom"])
    to = Api::Params.parse_date(query["dateTo"], end_of_day: true)
    from || to ? { from: from, to: to } : nil
  end
end
