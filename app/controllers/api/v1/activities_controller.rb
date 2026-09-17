module Api
  module V1
    class ActivitiesController < ApplicationController
      before_action :require_account!, :require_verified_email!
      before_action -> { require_roles!("super_admin", "admin", "agent") }

      def recent
        events, meta = paginate(ActivityEvent.recent_first)
        items = events.map { |e| { id: e.id, title: e.title, icon: e.icon, createdAt: Api::Params.iso(e.created_at), time: Api::Params.iso(e.created_at) } }
        render_data(items, meta)
      end
    end
  end
end
