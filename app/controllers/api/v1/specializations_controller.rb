module Api
  module V1
    class SpecializationsController < ApplicationController
      before_action :require_account!, :require_verified_email!
      before_action -> { require_roles!("super_admin", "admin", "agent") }
      before_action -> { require_permissions!("specializations_read") }, only: :index
      before_action -> { require_permissions!("specializations_write") }, only: %i[create update destroy]

      def index
        scope = ServiceSpecialization.alphabetical
        if (search = Api::Params.string(query_params["search"])).present?
          like = Api::Params.like(search)
          scope = scope.where("name LIKE :q OR category LIKE :q", q: like)
        end
        scope = scope.where("category LIKE ?", Api::Params.like(query_params["category"])) if query_params["category"].present?
        items, meta = paginate(scope)
        render_data(items.map { |s| serialize(s) }, meta)
      end

      def create
        body = body_params
        name = Api::Params.string(body["name"])
        category = Api::Params.string(body["category"])
        raise Api::BadRequest, "name is required" if name.empty?
        raise Api::BadRequest, "category is required" if category.empty?

        render_data(serialize(ServiceSpecialization.create!(name: name, category: category)), http_status: :created)
      end

      def update
        spec = find_specialization
        body = body_params
        attrs = {}
        if body.key?("name")
          attrs[:name] = Api::Params.string(body["name"])
          raise Api::BadRequest, "name must not be empty" if attrs[:name].empty?
        end
        if body.key?("category")
          attrs[:category] = Api::Params.string(body["category"])
          raise Api::BadRequest, "category must not be empty" if attrs[:category].empty?
        end
        spec.update!(attrs)
        render_data(serialize(spec))
      end

      def destroy
        spec = find_specialization
        spec.destroy!
        render_data(deleted: true, id: spec.id)
      end

      private

      def find_specialization
        ServiceSpecialization.find_by(id: route_id) or raise Api::NotFound, "Specialization not found"
      end

      def serialize(spec)
        { id: spec.id, name: spec.name, category: spec.category }
      end
    end
  end
end
