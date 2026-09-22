module Api
  module V1
    class SessionsController < ApplicationController
      before_action :require_account!, :require_verified_email!

      def destroy
        session = own_sessions.find_by(id: route_id) or raise Api::NotFound, "Session not found"
        session.revoke!
        render_data(id: session.id, revoked: true, current: session.id == current_account.session_id)
      end

      def index
        scope = own_sessions
        sessions, meta = paginate(scope.order(created_at: :desc))
        items = sessions.map do |s|
          { id: s.id, device: s.user_agent.presence || "Unknown device", userAgent: s.user_agent, ipAddress: s.ip_address,
            current: s.id == current_account.session_id,
            createdAt: Api::Params.iso(s.created_at), signedInAt: Api::Params.iso(s.created_at), expiresAt: Api::Params.iso(s.expires_at) }
        end
        render_data(items, meta)
      end

      private

      def own_sessions
        scope = current_account.admin? ? Session.where(admin_id: current_account.id) : Session.where(user_id: current_account.id)
        scope.live
      end
    end
  end
end
