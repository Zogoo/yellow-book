module Companies
  # Picks the company an /agency or /company/profile request refers to, by role.
  class ResolveForActor < ApplicationService
    def initialize(account:, company_id: nil)
      @account = account
      @company_id = Api::Params.parse_optional_id(company_id, "companyId")
    end

    def call
      raise Api::Unauthorized unless @account

      @account.admin? ? resolve_for_admin : resolve_for_user
    end

    private

    def resolve_for_admin
      if @company_id
        company = Company.includes(:category, :owner).find_by(id: @company_id) or raise Api::NotFound, "Company not found"
        if @account.agent? && !CompanyAssignment.exists?(admin_id: @account.id, company_id: company.id)
          raise Api::Forbidden, "Agent can access only assigned companies"
        end
        return company
      end

      if @account.agent?
        assignment = CompanyAssignment.includes(company: %i[category owner]).where(admin_id: @account.id).order(assigned_date: :desc).first
        raise Api::NotFound, "No company assigned to current agent" unless assignment&.company

        return assignment.company
      end

      Company.includes(:category, :owner).order(created_at: :desc).first || raise(Api::NotFound, "Company not found")
    end

    def resolve_for_user
      if @company_id
        return Company.includes(:category, :owner).find_by(id: @company_id, owner_user_id: @account.id) ||
               raise(Api::Forbidden, "You can access only your own company")
      end

      Company.includes(:category, :owner).where(owner_user_id: @account.id).order(created_at: :desc).first ||
        raise(Api::NotFound, "Company not found")
    end
  end
end
