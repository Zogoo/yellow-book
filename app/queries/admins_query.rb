class AdminsQuery < ApplicationQuery
  def call(query)
    scope = @relation.recent_first
    if (search = Api::Params.string(query["search"])).present?
      like = Api::Params.like(search)
      scope = scope.where("name LIKE :q OR email LIKE :q", q: like)
    end
    status = Api::Params.parse_optional_enum(query["status"], %w[active inactive], "status")
    scope = scope.where(status: status) if status
    if query["role"].present?
      mapped = Admins::RoleMapper.call(value: query["role"])
      scope = scope.where(role: mapped[:role])
      scope = scope.where(role_label: mapped[:role_label]) unless %w[Admin Agent].include?(mapped[:role_label])
    end
    from = Api::Params.parse_date(query["dateFrom"])
    to = Api::Params.parse_date(query["dateTo"], end_of_day: true)
    scope = scope.where("admins.created_at >= ?", from) if from
    scope = scope.where("admins.created_at <= ?", to) if to
    scope
  end
end
