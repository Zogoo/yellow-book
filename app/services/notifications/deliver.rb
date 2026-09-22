module Notifications
  # One place that decides who hears about what. Every call is best-effort: a
  # notification must never break the action that triggered it.
  class Deliver < ApplicationService
    ICONS = {
      review_received: { icon: "Star", icon_color: "text-yellow-600", bg_color: "bg-yellow-100" },
      review_published: { icon: "CheckCircle", icon_color: "text-green-600", bg_color: "bg-green-100" },
      review_rejected: { icon: "XCircle", icon_color: "text-red-600", bg_color: "bg-red-100" },
      reply_published: { icon: "MessageCircle", icon_color: "text-blue-600", bg_color: "bg-blue-100" },
      reply_submitted: { icon: "MessageSquare", icon_color: "text-blue-600", bg_color: "bg-blue-100" },
      support_message: { icon: "Megaphone", icon_color: "text-amber-600", bg_color: "bg-amber-100" }
    }.freeze

    def initialize(event:, title:, message:, user: nil, company: nil, admin: nil)
      @event = event
      @title = title
      @message = message
      @user = user
      @company = company
      @admin = admin
    end

    def call
      return nil unless @user || @company || @admin

      style = ICONS.fetch(@event, ICONS[:review_received])
      Notification.create!(
        user: @user, company: @company, admin: @admin,
        title: @title, message: @message, unread: true, **style
      )
    rescue StandardError => e
      Rails.logger.warn("[Notifications] #{@event} failed: #{e.class}: #{e.message}")
      nil
    end

    class << self
      def review_received(review)
        company = review.company
        return unless company

        call(event: :review_received, company: company,
             title: "New #{review.rating}-star review",
             message: "#{review.reviewer_name} reviewed #{company.name}: #{excerpt(review.content)}")
      end

      def review_moderated(review)
        return unless review.user_id

        if review.status == "approved"
          call(event: :review_published, user: review.user,
               title: "Your review is published",
               message: "Your review of #{review.company_name} is now visible on #{review.company_name}'s page.")
        elsif %w[rejected banned].include?(review.status)
          call(event: :review_rejected, user: review.user,
               title: "Your review was not published",
               message: "Your review of #{review.company_name} did not meet the guidelines. Contact support if you think this is wrong.")
        end
      end

      def reply_submitted(review)
        admin = Admin.find_by(id: review.moderator_admin_id) ||
                CompanyAssignment.where(company_id: review.company_id).order(:assigned_date).first&.admin
        return unless admin

        call(event: :reply_submitted, admin: admin,
             title: "Company reply awaiting moderation",
             message: "#{review.company_name} replied to #{review.reviewer_name}'s review.")
      end

      def reply_published(review)
        return unless review.user_id

        call(event: :reply_published, user: review.user,
             title: "#{review.company_name} replied to your review",
             message: excerpt(review.parsed_company_response&.dig("text").to_s))
      end

      def support_message(record)
        Admin.where(role: %w[super_admin admin]).find_each do |admin|
          call(event: :support_message, admin: admin,
               title: "New contact message",
               message: "#{record.name} (#{record.email}): #{excerpt(record.message)}")
        end
      end

      private

      def excerpt(text, limit = 120)
        clean = text.to_s.strip
        clean.length > limit ? "#{clean[0, limit]}…" : clean
      end
    end
  end
end
