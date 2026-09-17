module Api
  module V1
    # The company owner's workspace (also reachable by admins/agents via ?companyId=).
    class AgencyController < ApplicationController
      before_action :require_account!, :require_verified_email!
      before_action -> { require_roles!("company", "super_admin", "admin", "agent") }

      def dashboard
        company = resolve_company
        reviews = company.reviews.order(:created_at).to_a
        approved = reviews.select { |r| r.status == "approved" }
        average = approved.any? ? (approved.sum(&:rating).to_f / approved.size).round(2) : 0
        trend = reviews.group_by { |r| r.created_at.utc.strftime("%Y-%m") }.sort.map { |month, rows| { month: month, count: rows.size } }
        complete = [ company.description, company.location, company.website, company.phone_number, company.contact_email, company.owner_name ].all?(&:present?)
        render_data(totalReviews: reviews.size, averageRating: average, verificationStatus: company.status, profileComplete: complete, monthlyReviewTrend: trend)
      end

      def company
        company = resolve_company
        render_data(CompanySerializer.item(company, Companies::RatingMap.call(company_ids: [ company.id ])[company.id]))
      end

      def update_company
        company = resolve_company
        Companies::UpdateCompany.call(company: company, payload: body_params, account: current_account)
        company.reload
        render_data(CompanySerializer.item(company, Companies::RatingMap.call(company_ids: [ company.id ])[company.id]))
      end

      def notifications
        company = resolve_company
        items, meta = paginate(Notification.where(company_id: company.id).recent_first)
        render_data(items.map { |n| NotificationSerializer.agency(n) }, meta)
      end

      def update_notification
        notification = find_company_notification
        unread = Api::Params.parse_optional_boolean(body_params["unread"], "unread")
        raise Api::BadRequest, "unread is required" if unread.nil?

        notification.update!(unread: unread)
        render_data(id: notification.id, unread: notification.unread, title: notification.title, message: notification.message)
      end

      def destroy_notification
        find_company_notification.destroy!
        render_data(ok: true)
      end

      private

      def resolve_company
        Companies::ResolveForActor.call(account: current_account, company_id: query_params["companyId"])
      end

      def find_company_notification
        notification = Notification.find_by(id: route_id) or raise Api::NotFound, "Notification not found"
        company = Companies::ResolveForActor.call(account: current_account)
        raise Api::Forbidden, "Notification does not belong to your company" unless notification.company_id == company.id

        notification
      end
    end
  end
end
