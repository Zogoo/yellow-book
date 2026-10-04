module Api
  module V1
    # Public platform counters. The home page used to display invented numbers;
    # these are the real ones, cached briefly because they change slowly.
    class StatsController < ApplicationController
      def show
        stats = Rails.cache.fetch("public_stats", expires_in: 5.minutes) do
          {
            verifiedCompanies: Company.approved.where(verified: true).count,
            companies: Company.approved.count,
            # System accounts (e.g. the directory import owner) are not members.
            users: User.where(status: "active").where.not(signup_method: "System").count,
            reviews: Review.approved.count,
            categories: Category.count
          }
        end
        render_data(stats)
      end
    end
  end
end
