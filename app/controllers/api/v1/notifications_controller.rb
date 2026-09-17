module Api
  module V1
    class NotificationsController < ApplicationController
      before_action :require_account!, :require_verified_email!

      def index
        items, meta = paginate(Notification.where(owner_filter).recent_first)
        render_data(items.map { |n| NotificationSerializer.item(n) }, meta)
      end

      def create
        body = body_params
        title = Api::Params.string(body["title"])
        message = Api::Params.string(body["message"])
        raise Api::BadRequest, "title and message are required" if title.empty? || message.empty?

        attrs = { title: title, message: message, unread: true }.merge(optional_attrs(body))
        attrs[:unread] = Api::Params.parse_boolean(body["unread"], "unread") if body.key?("unread")
        render_data(NotificationSerializer.item(Notification.create!(attrs.merge(owner_filter))), http_status: :created)
      end

      def mark_read
        notification = find_notification
        notification.update!(unread: false)
        render_data(id: notification.id, unread: false)
      end

      def update
        notification = find_notification
        body = body_params
        attrs = optional_attrs(body)
        attrs[:title] = Api::Params.string(body["title"]) if body.key?("title")
        attrs[:message] = Api::Params.string(body["message"]) if body.key?("message")
        attrs[:unread] = Api::Params.parse_boolean(body["unread"], "unread") if body.key?("unread")
        raise Api::BadRequest, "At least one field is required (title, message, unread, timeLabel/time, icon, iconColor, bgColor)" if attrs.empty?
        raise Api::BadRequest, "title must not be empty" if attrs.key?(:title) && attrs[:title].empty?
        raise Api::BadRequest, "message must not be empty" if attrs.key?(:message) && attrs[:message].empty?

        notification.update!(attrs)
        render_data(NotificationSerializer.compact(notification))
      end

      def destroy
        find_notification.destroy!
        render_data(deleted: true)
      end

      private

      def owner_filter
        if current_account.user?
          current_account.company_id ? { company_id: current_account.company_id } : { user_id: current_account.id }
        else
          { admin_id: current_account.id }
        end
      end

      def optional_attrs(body)
        attrs = {}
        attrs[:time_label] = body["timeLabel"].presence || body["time"].presence&.to_s&.strip if body.key?("timeLabel") || body.key?("time")
        attrs[:icon] = body["icon"].nil? ? nil : body["icon"].to_s.strip if body.key?("icon")
        attrs[:icon_color] = body["iconColor"].nil? ? nil : body["iconColor"].to_s.strip if body.key?("iconColor")
        attrs[:bg_color] = body["bgColor"].nil? ? nil : body["bgColor"].to_s.strip if body.key?("bgColor")
        attrs
      end

      def find_notification
        notification = Notification.find_by(id: route_id) or raise Api::NotFound, "Notification not found"
        owner = notification.user_id == current_account.id && current_account.user? ||
                notification.admin_id == current_account.id && current_account.admin? ||
                (notification.company_id.present? && notification.company_id == current_account.company_id)
        raise Api::NotFound, "Notification not found" unless owner

        notification
      end
    end
  end
end
