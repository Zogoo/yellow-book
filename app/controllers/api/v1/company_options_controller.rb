module Api
  module V1
    # Distinct option lists for the business registration wizard (open endpoint).
    class CompanyOptionsController < ApplicationController
      def show
        rows = Company.where.not(category_label: nil).pluck(:category_label, :service_type, :location)
        render_data(
          categories: rows.map(&:first).compact_blank.uniq.sort,
          services: rows.map { |r| r[1] }.compact_blank.uniq.sort,
          destinations: rows.map { |r| r[2] }.compact_blank.uniq.sort
        )
      end
    end
  end
end
