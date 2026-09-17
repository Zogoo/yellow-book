module Api
  module V1
    class FavoritesController < ApplicationController
      before_action :require_account!, :require_verified_email!
      before_action -> { require_roles!("user", "company") }, only: %i[index create]
      before_action -> { require_roles!("user") }, only: %i[user_index user_create user_destroy]
      before_action -> { require_roles!("user", "company", "super_admin", "admin", "agent") }, only: :destroy

      def index = list
      def user_index = list

      def create = create_favorite
      def user_create = create_favorite

      def destroy
        remove_favorite
        render_data(deleted: true)
      end

      def user_destroy
        remove_favorite
        head :no_content
      end

      private

      def list
        raise Api::Forbidden, "Favorites are available only for user-based accounts" unless current_account.user?

        favorites, meta = paginate(Favorite.includes(company: :category).where(user_id: current_account.id).order(created_at: :desc))
        ratings = Companies::RatingMap.call(company_ids: favorites.map(&:company_id))
        render_data(favorites.map { |f| FavoriteSerializer.item(f, ratings[f.company_id]) }, meta)
      end

      def create_favorite
        raise Api::Forbidden, "Favorites are available only for user-based accounts" unless current_account.user?

        body = body_params
        raw = body["companyId"].presence || body["listingId"]
        raise Api::BadRequest, "companyId or listingId is required" if raw.blank?

        company_id = Api::Params.parse_id(raw, "companyId")
        company = Company.includes(:category).find_by(id: company_id) or raise Api::BadRequest, "companyId does not reference an existing company"
        favorite = Favorite.find_or_create_by!(user_id: current_account.id, company_id: company.id)
        rating = Companies::RatingMap.call(company_ids: [ company.id ])[company.id]
        render_data(FavoriteSerializer.created(favorite, rating), http_status: :created)
      end

      def remove_favorite
        favorite = Favorite.find_by(id: route_id) or raise Api::NotFound, "Favorite not found"
        raise Api::Forbidden, "You can delete only your own favorites" if current_account.user? && favorite.user_id != current_account.id

        favorite.destroy!
      end
    end
  end
end
