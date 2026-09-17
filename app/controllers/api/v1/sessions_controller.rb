module Api
  module V1
    class SessionsController < ApplicationController
      before_action :require_account!, :require_verified_email!

      def index
        scope = current_account.admin? ? Session.where(admin_id: current_account.id) : Session.where(user_id: current_account.id)
        sessions, meta = paginate(scope.order(created_at: :desc))
        items = sessions.map do |s|
          { id: s.id, device: s.user_agent.presence || "Unknown device", userAgent: s.user_agent, ipAddress: s.ip_address,
            createdAt: Api::Params.iso(s.created_at), lastActive: Api::Params.iso(s.created_at), expiresAt: Api::Params.iso(s.expires_at) }
        end
        render_data(items, meta)
      end
    end
  end
end
