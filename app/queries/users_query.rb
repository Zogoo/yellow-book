class UsersQuery < ApplicationQuery
  def call(query)
    scope = @relation.recent_first
    if (search = Api::Params.string(query["search"])).present?
      like = Api::Params.like(search)
      scope = scope.where("display_name LIKE :q OR first_name LIKE :q OR last_name LIKE :q OR email LIKE :q", q: like)
    end
    status = Api::Params.parse_optional_enum(query["status"], %w[active suspended], "status")
    scope = scope.where(status: status) if status
    scope = scope.where(signup_method: query["signupMethod"].to_s) if query["signupMethod"].present?
    from = Api::Params.parse_date(query["dateFrom"])
    to = Api::Params.parse_date(query["dateTo"], end_of_day: true)
    scope = scope.where("users.created_at >= ?", from) if from
    scope = scope.where("users.created_at <= ?", to) if to
    scope
  end
end
