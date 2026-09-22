module Api
  module V1
    # Distinct option lists for the business registration wizard (open endpoint).
    class CompanyOptionsController < ApplicationController
      def show
        rows = Rails.cache.fetch("company_registration_options", expires_in: 10.minutes) do
          Company.approved.where.not(category_label: nil).limit(2_000).pluck(:category_label, :service_type, :location)
        end
        render_data(
          categories: rows.map(&:first).compact_blank.uniq.sort,
          services: rows.map { |r| r[1] }.compact_blank.uniq.sort,
          destinations: rows.map { |r| r[2] }.compact_blank.uniq.sort
        )
      end
    end
  end
end
