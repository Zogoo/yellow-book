module Api
  module V1
    # Distinct option lists for the business registration wizard (open endpoint).
    class CompanyOptionsController < ApplicationController
      def show
        rows = Rails.cache.fetch("company_registration_options", expires_in: 10.minutes) do
          Company.approved.where.not(category_label: nil).limit(2_000).pluck(:category_label, :service_type, :location)
        end
        render_data(
          # Every category, named in the caller's language: a new business must
          # not be limited to the ones that already have a listing.
          categories: categories,
          services: rows.map { |r| r[1] }.compact_blank.uniq.sort,
          destinations: rows.map { |r| r[2] }.compact_blank.uniq.sort
        )
      end

      private

      # Not cached: the list is small, and a category added today should appear
      # in the wizard today.
      def categories
        Category.alphabetical.map { |category| category.display_name(I18n.locale) }.compact_blank
      end
    end
  end
end
