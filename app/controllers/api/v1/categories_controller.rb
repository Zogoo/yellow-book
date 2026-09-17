module Api
  module V1
    class CategoriesController < ApplicationController
      def index
        page = Api::Pagination.new(page: query_params["page"].to_i, limit: query_params["limit"].to_i)
        scope = Category.public_directory.alphabetical
        categories = page.apply(scope).to_a
        items = categories.map { |c| { id: c.id, name: c.name, slug: c.slug, icon: c.icon, color: c.color, filters: c.filters || {} } }
        render_data({ categories: items }, page.meta(scope.count))
      end
    end
  end
end
