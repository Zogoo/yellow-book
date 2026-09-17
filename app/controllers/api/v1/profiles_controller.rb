module Api
  module V1
    class ProfilesController < ApplicationController
      before_action :require_account!, :require_verified_email!
      before_action -> { require_roles!("company") }, only: %i[company_show company_update]
      before_action -> { require_roles!("user", "company") }, only: %i[user_show user_update]
      before_action -> { require_roles!("agent", "super_admin", "admin") }, only: %i[subadmin_show subadmin_update]

      def company_show
        company = Companies::ResolveForActor.call(account: current_account)
        render_data(CompanySerializer.profile(company, Api::Params.as_json_object(company.profile),
                                              Api::Params.as_json_object(company.preferences), Api::Params.as_json_object(company.security)))
      end

      def company_update
        company = Companies::ResolveForActor.call(account: current_account)
        render_data(Companies::UpdateCompanyProfile.call(company: company, payload: body_params))
      end

      def user_show
        render_data(UserSerializer.profile(find_user))
      end

      def user_update
        render_data(UserSerializer.profile(Accounts::UpdateUserProfile.call(user: find_user, payload: body_params)))
      end

      def subadmin_show
        admin = subadmin_target(required: false)
        render_data(AdminSerializer.subadmin_profile(admin, Api::Params.as_json_object(admin.profile),
                                                     Api::Params.as_json_object(admin.preferences), Api::Params.as_json_object(admin.security)))
      end

      def subadmin_update
        render_data(Accounts::UpdateSubadminProfile.call(admin: subadmin_target(required: true), payload: body_params))
      end

      private

      def find_user
        User.find_by(id: current_account.id) or raise Api::NotFound, "User not found"
      end

      def subadmin_target(required:)
        id = if current_account.agent?
          current_account.id
        elsif required
          Api::Params.parse_id(query_params["adminId"], "adminId")
        else
          Api::Params.parse_optional_id(query_params["adminId"], "adminId") || Admin.where(role: "agent").order(:id).pick(:id)
        end
        raise Api::NotFound, "Subadmin profile not found" unless id

        Admin.find_by(id: id) or raise Api::NotFound, "Subadmin profile not found"
      end
    end
  end
end
