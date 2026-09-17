module Companies
  # categoryId → existing category; category/categoryLabel → upsert by slug; else the oldest category (creating "General").
  class ResolveCategory < ApplicationService
    def initialize(body:)
      @body = body
    end

    def call
      category_id = Api::Params.parse_optional_id(@body["categoryId"].presence || @body["category_id"], "categoryId")
      if category_id
        return Category.find_by(id: category_id) || raise(Api::BadRequest, "categoryId does not reference an existing category")
      end

      raw_name = @body["category"].presence || @body["categoryLabel"]
      if raw_name.present? || raw_name == ""
        name = Api::Params.string(raw_name)
        raise Api::BadRequest, "category must not be empty" if name.empty?

        slug = Api::Params.normalize_slug(name)
        category = Category.find_by(slug: slug) || Category.find_by(name: name)
        if category
          category.update!(name: name) if category.name != name && !Category.where.not(id: category.id).exists?(name: name)
          return category
        end
        return Category.create!(name: name, slug: slug)
      end

      Category.order(:created_at).first || Category.create!(name: "General", slug: "general")
    end
  end
end
