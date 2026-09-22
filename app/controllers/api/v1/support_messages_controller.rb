module Api
  module V1
    # The public contact form, and the admin queue that receives it.
    class SupportMessagesController < ApplicationController
      before_action -> { Auth::RateLimiter.check!(:support_message, request.remote_ip) }, only: :create
      before_action :require_account!, :require_verified_email!, except: :create
      before_action -> { require_roles!("super_admin", "admin", "agent") }, except: :create

      def create
        body = body_params
        name = Api::Params.string(body["name"])
        message = Api::Params.string(body["message"])
        raise Api::BadRequest, "name is required" if name.empty?
        raise Api::BadRequest, "message is required" if message.empty?
        raise Api::BadRequest, "message must be at least 10 characters" if message.length < 10

        record = SupportMessage.create!(
          name: name, email: Api::Params.normalize_email(body["email"]), message: message,
          user_id: current_account&.user? ? current_account.id : nil
        )
        Notifications::Deliver.support_message(record)
        render_data({ id: record.id, message: "Thanks — we received your message and will reply by email." }, http_status: :created)
      end

      def index
        scope = SupportMessage.recent_first
        scope = scope.where(status: Api::Params.parse_required_enum(query_params["status"], SupportMessage::STATUSES, "status")) if query_params["status"].present?
        messages, meta = paginate(scope)
        render_data(messages.map { |m| serialize(m) }, meta)
      end

      def update
        record = SupportMessage.find_by(id: route_id) or raise Api::NotFound, "Message not found"
        status = Api::Params.parse_required_enum(body_params["status"], SupportMessage::STATUSES, "status")
        record.update!(status: status, handled_by: current_account.name, handled_at: status == "handled" ? Time.current : nil)
        render_data(serialize(record))
      end

      private

      def serialize(record)
        {
          id: record.id, name: record.name, email: record.email, message: record.message,
          status: record.status, handledBy: record.handled_by, handledAt: Api::Params.iso(record.handled_at),
          createdAt: Api::Params.iso(record.created_at)
        }
      end
    end
  end
end
