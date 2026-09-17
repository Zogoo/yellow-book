module Api
  module V1
    class AdminController < ApplicationController
      before_action :require_account!, :require_verified_email!
      before_action -> { require_roles!("super_admin", "admin", "agent") }, only: :stats

      def stats
        render_data(
          welcomeName: current_account.name,
          registeredCompanies: Company.count,
          pendingVerifications: Company.where(status: "pending").count,
          rejectedVerifications: Company.where(status: "rejected").count,
          totalReviews: Review.count,
          pendingReviews: Review.where(status: "pending").count,
          adminUsers: Admin.count,
          averageRating: Review.average(:rating).to_f.round(2)
        )
      end
    end
  end
end
