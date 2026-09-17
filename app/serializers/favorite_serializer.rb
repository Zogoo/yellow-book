module FavoriteSerializer
  module_function

  def item(favorite, rating)
    company = favorite.company
    saved_at = favorite.saved_at || favorite.created_at
    {
      id: favorite.id,
      name: company.name,
      slug: company.slug,
      listingId: favorite.company_id,
      category: company.category_name,
      rating: rating[:average],
      savedAt: Api::Params.iso(saved_at),
      assigned: Api::Params.date_only(saved_at),
      userId: favorite.user_id,
      createdAt: Api::Params.iso(favorite.created_at),
      updatedAt: Api::Params.iso(favorite.updated_at)
    }
  end

  def created(favorite, rating)
    item(favorite, rating).except(:assigned).merge(savedAt: Api::Params.iso(favorite.created_at))
  end
end
