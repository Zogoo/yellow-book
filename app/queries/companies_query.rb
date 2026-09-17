class CompaniesQuery < ApplicationQuery
  # search + status + category + date window; approved-only when not an admin view.
  def call(query, admin_view: false, approved_only: !admin_view)
    scope = @relation.includes(:category, :owner).recent_first
    scope = scope.approved if approved_only
    if (search = Api::Params.string(query["search"])).present?
      like = Api::Params.like(search)
      scope = scope.where("companies.name LIKE :q OR companies.slug LIKE :q OR companies.category_label LIKE :q OR companies.email LIKE :q", q: like)
    end
    status = Api::Params.parse_optional_enum(query["status"], Company::STATUSES, "status")
    scope = scope.where(status: status) if status && !approved_only
    if query["category"].present?
      like = Api::Params.like(query["category"])
      scope = scope.left_joins(:category).where("companies.category_label LIKE :q OR categories.name LIKE :q", q: like)
    end
    if (window = Api::Params.date_window(query))
      scope = scope.where("companies.created_at >= ?", window[:from]) if window[:from]
      scope = scope.where("companies.created_at <= ?", window[:to]) if window[:to]
    end
    scope
  end

  def recent(query)
    scope = @relation.includes(:category).recent_first
    if (search = Api::Params.string(query["search"])).present?
      like = Api::Params.like(search)
      scope = scope.where("companies.name LIKE :q OR companies.slug LIKE :q", q: like)
    end
    scope = scope.where(status: Api::Params.parse_required_enum(query["status"], Company::STATUSES, "status")) if query["status"].present?
    scope
  end
end
