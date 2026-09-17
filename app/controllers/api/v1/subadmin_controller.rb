module Api
  module V1
    # Assigned-company and review-moderation queues for agents (admins see everything).
    class SubadminController < ApplicationController
      before_action :require_account!, :require_verified_email!
      before_action -> { require_roles!("agent", "super_admin", "admin") }

      def companies
        scope = CompanyAssignment.includes(:company).order(assigned_date: :desc)
        if current_account.agent?
          scope = scope.where(admin_id: current_account.id)
        elsif query_params["adminId"].present?
          scope = scope.where(admin_id: Api::Params.parse_id(query_params["adminId"], "adminId"))
        end
        scope = scope.where(status: query_params["status"].to_s) if query_params["status"].present?
        if (search = Api::Params.string(query_params["search"])).present?
          like = Api::Params.like(search)
          scope = scope.joins(:company).where("companies.name LIKE :q OR companies.category_label LIKE :q OR companies.email LIKE :q", q: like)
        end
        assignments, meta = paginate(scope)
        render_data(assignments.map { |a| CompanySerializer.assignment(a) }, meta)
      end

      def update_company
        assignment = find_assignment
        raise Api::Forbidden, "You can update only your assigned companies" if current_account.agent? && assignment.admin_id != current_account.id

        body = body_params
        ActiveRecord::Base.transaction do
          assignment.update!(status: body["assignmentStatus"].to_s) if body.key?("assignmentStatus")
          assignment.update!(primary_contact: Api::Params.optional_string(body["primaryContact"])) if body.key?("primaryContact")
          assignment.company.update!(status: Api::Params.parse_required_enum(body["status"], Company::STATUSES, "status")) if body.key?("status")
        end
        assignment.reload
        render_data(id: assignment.id, companyId: assignment.company_id, name: assignment.company.name, status: assignment.company.status,
                    primaryContact: assignment.primary_contact, assignedDate: Api::Params.iso(assignment.assigned_date))
      end

      def destroy_company
        assignment = find_assignment
        raise Api::Forbidden, "You can delete only your assignments" if current_account.agent? && assignment.admin_id != current_account.id

        assignment.destroy!
        render_data(ok: true)
      end

      def reviews
        scope = Review.all
        if current_account.agent?
          scope = scope.where(company_id: CompanyAssignment.where(admin_id: current_account.id).select(:company_id))
        elsif query_params["adminId"].present?
          scope = scope.where(moderator_admin_id: Api::Params.parse_id(query_params["adminId"], "adminId"))
        end
        reviews, meta = paginate(ReviewsQuery.new(scope).call(query_params))
        counts = Reviews::LikeShareCounts.call(review_ids: reviews.map(&:id))
        render_data(reviews.map { |r| ReviewSerializer.recent(r, counts[r.id], include_unapproved_reply: true) }, meta)
      end

      def update_review
        review = find_assigned_review("You can update only assigned company reviews")
        body = body_params
        attrs = {}
        attrs[:status] = Api::Params.parse_required_enum(body["status"], Review::STATUSES, "status") if body.key?("status")
        if body.key?("companyResponseStatus") || body.key?("replyStatus")
          attrs[:company_response_status] = Api::Params.parse_required_enum(body["companyResponseStatus"].presence || body["replyStatus"], Review::REPLY_STATUSES, "companyResponseStatus")
          attrs[:company_response_moderated_at] = Time.current
          attrs[:company_response_moderator_admin_id] = current_account.id
        end
        attrs[:content] = Api::Params.string(body["content"].presence || body["text"]) if body.key?("content") || body.key?("text")
        attrs[:rating] = Api::Params.parse_rating(body["rating"]) if body.key?("rating")
        review.update!(attrs)
        render_data(ReviewSerializer.moderation(review))
      end

      def destroy_review
        review = find_assigned_review("You can delete only assigned company reviews")
        review.destroy!
        render_data(id: review.id, deleted: true)
      end

      private

      # :id may be an assignment id or a company id.
      def find_assignment
        id = route_id
        CompanyAssignment.includes(:company).find_by(id: id) || CompanyAssignment.includes(:company).find_by(company_id: id) ||
          raise(Api::NotFound, "Assignment not found")
      end

      def find_assigned_review(message)
        review = Review.includes(:company).find_by(id: route_id) or raise Api::NotFound, "Review not found"
        if current_account.agent? && !CompanyAssignment.exists?(admin_id: current_account.id, company_id: review.company_id)
          raise Api::Forbidden, message
        end
        review
      end
    end
  end
end
