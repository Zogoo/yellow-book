module Api
  module V1
    class CategoriesController < ApplicationController
      def index
        page = Api::Pagination.new(page: query_params["page"].to_i, limit: query_params["limit"].to_i)
        scope = Category.public_directory.alphabetical
        categories = page.apply(scope).to_a
        counts = Company.approved.where(category_id: categories.map(&:id)).group(:category_id).count
        items = categories.map do |c|
          {
            id: c.id, name: c.name, nameMn: c.name_mn, slug: c.slug, icon: c.icon, color: c.color,
            companyCount: counts[c.id] || 0, filters: c.filters || {}
          }
        end
        render_data({ categories: items }, page.meta(scope.count))
      end
    end
  end
end
