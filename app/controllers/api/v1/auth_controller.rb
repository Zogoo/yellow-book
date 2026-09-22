module Api
  module V1
    class AuthController < ApplicationController
      before_action :require_account!, only: %i[me logout change_password]
      before_action -> { Auth::RateLimiter.check!(:register, request.remote_ip) }, only: :register
      before_action -> { Auth::RateLimiter.check!(:login, request.remote_ip) }, only: :login
      before_action -> { Auth::RateLimiter.check!(:email_code_request, request.remote_ip) }, only: :request_email_code
      before_action -> { Auth::RateLimiter.check!(:email_code_verify, request.remote_ip) }, only: :verify_email_code
      before_action -> { Auth::RateLimiter.check!(:oauth_authorize, request.remote_ip) }, only: :oauth_authorize
      before_action -> { Auth::RateLimiter.check!(:oauth_callback, request.remote_ip) }, only: %i[oauth_callback oauth_callback_get]
      before_action -> { Auth::RateLimiter.check!(:password_reset, request.remote_ip) }, only: %i[forgot_password reset_password]

      def register
        render_data(Auth::RegisterAccount.call(payload: body_params, request: request), http_status: :created)
      end

      def login
        render_data(Auth::LoginAccount.call(payload: body_params, request: request), http_status: :created)
      end

      def request_email_code
        render_data(Auth::RequestEmailCode.call(payload: body_params), http_status: :created)
      end

      def verify_email_code
        render_data(Auth::VerifyEmailCode.call(payload: body_params, request: request), http_status: :created)
      end

      def logout
        Session.find_by(id: current_account.session_id)&.revoke!
        render_data({ message: "Logged out successfully" }, http_status: :created)
      end

      def me
        if current_account.admin?
          admin = Admin.find_by(id: current_account.id) or raise Api::Unauthorized, "Account not found"
          return render_data(token: current_account.token, user: AuthSerializer.admin_item(admin))
        end
        user = User.find_by(id: current_account.id) or raise Api::Unauthorized, "Account not found"
        user.sync_role!
        company = user.companies.order(created_at: :desc).first
        render_data(token: current_account.token, user: AuthSerializer.user_item(user, company ? "company" : "user", company&.id))
      end

      def oauth_authorize
        render_data(Auth::GoogleOauth.authorize(params[:provider], query_params))
      end

      def oauth_callback_get
        redirect_to Auth::GoogleOauth.callback_redirect(params[:provider], query_params, request), allow_other_host: true, status: :found
      end

      def oauth_callback
        render_data(Auth::GoogleOauth.callback_with_id_token(params[:provider], body_params, request), http_status: :created)
      end

      def change_password
        render_data(Auth::ChangePassword.call(account: current_account, payload: body_params))
      end

      def forgot_password
        email = Api::Params.normalize_email(body_params["email"])
        user = User.find_by(email: email)
        Auth::SendPasswordReset.call(user: user) if user
        render_data({ message: "Password reset instructions sent" }, http_status: :created)
      end

      def reset_password
        render_data(Auth::ResetPassword.call(payload: body_params), http_status: :created)
      end
    end
  end
end
