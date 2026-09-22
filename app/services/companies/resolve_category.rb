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

        # A category can be named in either language; match both before creating one.
        folded = Api::Text.fold(name)
        category = Category.find_by(slug: Api::Text.slugify(name)) ||
                   Category.find_by(name: name) ||
                   Category.find_by(name_mn: name) ||
                   Category.all.find { |c| [ Api::Text.fold(c.name), Api::Text.fold(c.name_mn) ].include?(folded) }
        if category
          return category
        end
        return Category.create!(name: name, slug: Api::Text.slugify(name))
      end

      Category.order(:created_at).first || Category.create!(name: "General", slug: "general")
    end
  end
end
