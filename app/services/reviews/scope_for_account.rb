module Reviews
  # Which reviews an actor may list: owners see their companies' reviews,
  # plain users their own, agents their assigned companies', admins everything.
  class ScopeForAccount < ApplicationService
    def initialize(account:, anonymous_approved_only: true)
      @account = account
      @anonymous_approved_only = anonymous_approved_only
    end

    def call
      scope = Review.all
      return @anonymous_approved_only ? scope.approved : scope if @account.nil?

      if @account.user?
        owned_ids = Company.where(owner_user_id: @account.id).pluck(:id)
        owned_ids.any? ? scope.where(company_id: owned_ids) : scope.where(user_id: @account.id)
      elsif @account.agent?
        scope.where(company_id: CompanyAssignment.where(admin_id: @account.id).select(:company_id))
      else
        scope
      end
    end
  end
end
