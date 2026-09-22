module Api
  module V1
    class UsersController < ApplicationController
      before_action :require_account!, :require_verified_email!
      before_action -> { require_roles!("super_admin", "admin", "agent"); require_permissions!("users_read") }, only: %i[index show]
      before_action -> { require_roles!("super_admin", "admin"); require_permissions!("users_write") }, only: %i[create update destroy]

      def index
        users, meta = paginate(UsersQuery.new(User.all).call(query_params))
        render_data(users.map { |u| UserSerializer.list_item(u) }, meta)
      end

      def show
        render_data(UserSerializer.detail(find_user))
      end

      def create
        body = body_params
        email = Api::Params.normalize_email(body["email"])
        Accounts::EnsureEmailAvailable.call(email: email)
        name = Api::Params.string(body["name"])
        raise Api::BadRequest, "name is required" if name.empty?

        names = Api::Params.split_name(name)
        password = body["password"].present? ? Api::Params.parse_password(body["password"]) : nil
        verified = Api::Params.parse_optional_boolean(body["verified"].presence || body["emailVerified"], "verified") || false
        user = User.create!(
          email: email, password: password, first_name: names[:first_name].presence, last_name: names[:last_name].presence,
          display_name: name, phone: Api::Params.optional_string(body["phone"]),
          status: Api::Params.parse_optional_enum(body["status"], %w[active suspended], "status") || "active",
          role: "user", signup_method: Api::Params.string(body["signupMethod"]).presence || "Email",
          email_verified_at: verified ? Time.current : nil
        )
        render_data(UserSerializer.list_item(user), http_status: :created)
      end

      def update
        user = find_user
        body = body_params
        attrs = {}
        if body.key?("name")
          name = Api::Params.string(body["name"])
          names = Api::Params.split_name(name)
          attrs.merge!(display_name: name.presence, first_name: names[:first_name].presence, last_name: names[:last_name].presence)
        end
        if body.key?("email")
          email = Api::Params.normalize_email(body["email"])
          Accounts::EnsureEmailAvailable.call(email: email, ignore_user_id: user.id)
          attrs[:email] = email
        end
        attrs[:phone] = Api::Params.optional_string(body["phone"]) if body.key?("phone")
        attrs[:status] = Api::Params.parse_required_enum(body["status"], %w[active suspended], "status") if body.key?("status")
        attrs[:signup_method] = body["signupMethod"].presence.to_s.presence || "Email" if body.key?("signupMethod")
        if body.key?("verified") || body.key?("emailVerified")
          attrs[:email_verified_at] = Api::Params.parse_boolean(body["verified"].nil? ? body["emailVerified"] : body["verified"], "verified") ? Time.current : nil
        end
        if body.key?("password")
          password = Api::Params.string(body["password"])
          attrs[:password_digest] = password.empty? ? nil : BCrypt::Password.create(Api::Params.parse_password(password))
        end
        user.update!(attrs)
        user.sync_role!
        # Losing access has to mean losing the session too.
        Session.where(user_id: user.id).update_all(revoked_at: Time.current) unless user.active?
        render_data(UserSerializer.list_item(user.reload))
      end

      def destroy
        user = find_user
        owned = user.companies.count
        if owned.positive?
          raise Api::Conflict, "This account owns #{owned} #{'company'.pluralize(owned)}. Reassign or delete the #{'company'.pluralize(owned)} first — deleting the owner would erase customers' reviews."
        end

        user.destroy!
        render_data(id: user.id, deleted: true)
      end

      private

      def find_user
        User.find_by(id: route_id) or raise Api::NotFound, "User not found"
      end
    end
  end
end
