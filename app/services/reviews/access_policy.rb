module Reviews
  # Who may read/update/delete a given review.
  class AccessPolicy < ApplicationService
    def initialize(review:, account:)
      @review = review
      @account = account
    end

    def call
      raise Api::Unauthorized unless @account

      if @account.admin?
        return true unless @account.agent?
        return true if @review.moderator_admin_id == @account.id

        return CompanyAssignment.exists?(admin_id: @account.id, company_id: @review.company_id)
      end
      return true if @review.user_id.present? && @review.user_id == @account.id

      Company.exists?(id: @review.company_id, owner_user_id: @account.id)
    end
  end
end
