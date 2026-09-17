module Api
  module V1
    class AgenciesController < ApplicationController
      def index
        scope = Company.approved.includes(:category, :owner).recent_first
        if (search = Api::Params.string(query_params["search"])).present?
          like = Api::Params.like(search)
          scope = scope.where("companies.name LIKE :q OR companies.slug LIKE :q OR companies.category_label LIKE :q", q: like)
        end
        companies, meta = paginate(scope)
        ratings = Companies::RatingMap.call(company_ids: companies.map(&:id))
        render_data(companies.map { |c| CompanySerializer.agency(c, ratings[c.id]) }, meta)
      end

      def show
        company = Company.includes(:category, :owner).find_by(id: route_id) or raise Api::NotFound, "Agency not found"
        rating = Companies::RatingMap.call(company_ids: [ company.id ])[company.id]
        render_data(CompanySerializer.item(company, rating).merge(agency: true))
      end
    end
  end
end
