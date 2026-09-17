module Api
  module V1
    class AgentDashboardController < ApplicationController
      before_action :require_account!, :require_verified_email!
      before_action -> { require_roles!("agent", "super_admin", "admin") }

      def show
        raise Api::Forbidden, "Agent dashboard is available only for admin accounts" unless current_account.admin?

        if current_account.agent?
          ids = CompanyAssignment.where(admin_id: current_account.id).distinct.pluck(:company_id)
          return render_data(pendingReviews: 0, approvedReviews: 0, totalCompanies: 0) if ids.empty?

          return render_data(
            pendingReviews: Review.where(company_id: ids, status: "pending").count,
            approvedReviews: Review.where(company_id: ids, status: "approved").count,
            totalCompanies: ids.size
          )
        end
        render_data(pendingReviews: Review.where(status: "pending").count, approvedReviews: Review.approved.count, totalCompanies: Company.count)
      end
    end
  end
end
