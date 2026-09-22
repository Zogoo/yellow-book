class CompaniesQuery < ApplicationQuery
  # search + status + category + date window; approved-only when not an admin view.
  def call(query, admin_view: false, approved_only: !admin_view)
    scope = @relation.includes(:category, :owner).recent_first
    scope = scope.approved if approved_only
    if (search = Api::Params.string(query["search"])).present?
      # Folded on both sides so Cyrillic matches regardless of case.
      scope = scope.where("companies.search_text LIKE ?", "%#{Api::Text.fold(search)}%")
    end
    if (district = Api::Params.optional_string(query["district"])).present?
      scope = scope.where(district: district)
    end
    status = Api::Params.parse_optional_enum(query["status"], Company::STATUSES, "status")
    scope = scope.where(status: status) if status && !approved_only
    if query["category"].present?
      # The caller may name a category in either language, or use its slug.
      term = Api::Params.string(query["category"])
      like = Api::Params.like(term)
      scope = scope.left_joins(:category).where(
        "companies.category_label LIKE :q OR categories.name LIKE :q OR categories.name_mn LIKE :q OR categories.slug = :slug",
        q: like, slug: Api::Text.slugify(term)
      )
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
      scope = scope.where("companies.search_text LIKE ?", "%#{Api::Text.fold(search)}%")
    end
    scope = scope.where(status: Api::Params.parse_required_enum(query["status"], Company::STATUSES, "status")) if query["status"].present?
    scope
  end
end
