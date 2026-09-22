module Api
  module V1
    class AdminsController < ApplicationController
      before_action :require_account!, :require_verified_email!
      before_action -> { require_roles!("super_admin", "admin") }, only: %i[index show]
      before_action -> { require_roles!("super_admin") }, only: %i[create update destroy]

      def index
        admins, meta = paginate(AdminsQuery.new(Admin.all).call(query_params))
        render_data(admins.map { |a| AdminSerializer.item(a) }, meta)
      end

      def show
        render_data(AdminSerializer.item(find_admin))
      end

      def create
        body = body_params
        name = Api::Params.string(body["name"])
        raise Api::BadRequest, "name is required" if name.empty?

        email = Api::Params.normalize_email(body["email"])
        Accounts::EnsureEmailAvailable.call(email: email)
        raise Api::BadRequest, "password is required" if body["password"].blank?

        password = Api::Params.parse_password(body["password"])
        mapped = Admins::RoleMapper.call(value: body["role"])
        permissions = body["permissions"].is_a?(Array) && body["permissions"].all?(String) ? body["permissions"] : []
        admin = Admin.create!(
          name: name, email: email, phone: Api::Params.optional_string(body["phone"]), password: password,
          role: mapped[:role], role_label: mapped[:role_label], is_agent: mapped[:role] == "agent",
          auth_role: mapped[:role] == "agent" ? "SUB_ADMIN" : "ADMIN",
          admin_role: { "super_admin" => "SUPER_ADMIN", "agent" => "AGENT" }.fetch(mapped[:role], "ADMIN"),
          status: Api::Params.parse_optional_enum(body["status"], %w[active inactive], "status") || "active",
          verified: Api::Params.parse_optional_boolean(body["verified"], "verified").nil? ? true : Api::Params.parse_boolean(body["verified"], "verified"),
          permissions: permissions, created_by: current_account.id, last_login_at: nil
        )
        render_data(AdminSerializer.item(admin), http_status: :created)
      end

      def update
        admin = find_admin
        body = body_params
        attrs = {}
        attrs[:name] = Api::Params.string(body["name"]) if body.key?("name")
        if body.key?("email")
          email = Api::Params.normalize_email(body["email"])
          Accounts::EnsureEmailAvailable.call(email: email, ignore_admin_id: admin.id)
          attrs[:email] = email
        end
        attrs[:phone] = Api::Params.optional_string(body["phone"]) if body.key?("phone")
        attrs[:status] = Api::Params.parse_required_enum(body["status"], %w[active inactive], "status") if body.key?("status")
        attrs[:verified] = Api::Params.parse_boolean(body["verified"], "verified") if body.key?("verified")
        if body.key?("role")
          mapped = Admins::RoleMapper.call(value: body["role"])
          attrs.merge!(role: mapped[:role], role_label: mapped[:role_label], is_agent: mapped[:role] == "agent",
                       auth_role: mapped[:role] == "agent" ? "SUB_ADMIN" : "ADMIN",
                       admin_role: { "super_admin" => "SUPER_ADMIN", "agent" => "AGENT" }.fetch(mapped[:role], "ADMIN"))
        end
        if body.key?("permissions")
          raise Api::BadRequest, "permissions must be a string array" unless body["permissions"].is_a?(Array) && body["permissions"].all?(String)
          attrs[:permissions] = body["permissions"]
        end
        if body.key?("password") && Api::Params.string(body["password"]).present?
          # A super admin may reset a colleague's password, never their own here:
          # changing your own goes through PUT /auth/password with the current one.
          raise Api::Forbidden, "Use the change-password endpoint for your own account" if admin.id == current_account.id

          attrs[:password] = Api::Params.parse_password(body["password"])
        end
        if body.key?("lastLogin") || body.key?("lastLoginAt")
          source = body["lastLoginAt"].presence || body["lastLogin"]
          attrs[:last_login_at] = source.present? ? Time.zone.parse(source.to_s) : nil
        end
        admin.update!(attrs)
        Session.where(admin_id: admin.id).update_all(revoked_at: Time.current) unless admin.active?
        render_data(AdminSerializer.item(admin))
      end

      def destroy
        admin = find_admin
        raise Api::BadRequest, "You cannot delete your own admin account" if admin.id == current_account.id
        raise Api::Forbidden, "Super admin accounts cannot be deleted through this endpoint" if admin.role == "super_admin"

        admin.destroy!
        render_data(id: admin.id, deleted: true)
      end

      private

      def find_admin
        Admin.find_by(id: route_id) or raise Api::NotFound, "Admin not found"
      end
    end
  end
end
