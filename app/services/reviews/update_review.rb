module Reviews
  # PUT /agency/reviews/:id and /reviews/recent/:id: moderation + author edits.
  class UpdateReview < ApplicationService
    def initialize(review:, payload:, account:)
      @review = review
      @body = Api::Params.as_object(payload)
      @account = account
    end

    def call
      raise Api::Forbidden, "You cannot update this review" unless Reviews::AccessPolicy.call(review: @review, account: @account)

      attrs = {}
      if @body.key?("status")
        raise Api::Forbidden, "Only admins and agents can moderate reviews" unless @account.admin?
        attrs[:status] = Api::Params.parse_required_enum(@body["status"], Review::STATUSES, "status")
        attrs[:status_reason] = Api::Params.optional_string(@body["statusReason"] || @body["reason"])
        attrs[:moderated_at] = Time.current
        attrs[:moderated_by_admin_id] = @account.id
      end
      if %w[review content text].any? { |k| @body.key?(k) }
        raise Api::Forbidden, "You can update only your own review content" unless @account.admin? || @review.user_id == @account.id
        attrs[:content] = Reviews::PlainText.parse(@body["review"].presence || @body["content"].presence || @body["text"], "content")
      end
      if @body.key?("rating")
        raise Api::Forbidden, "You can update only your own review rating" unless @account.admin? || @review.user_id == @account.id
        attrs[:rating] = Api::Params.parse_rating(@body["rating"])
      end
      if @body.key?("companyResponse")
        raise Api::Forbidden, "Use the company reply endpoint to submit a company reply" unless @account.admin?
        attrs[:company_response] = company_response_value(@body["companyResponse"])
      end
      if @body.key?("companyResponseStatus") || @body.key?("replyStatus")
        raise Api::Forbidden, "Only admins and agents can moderate company replies" unless @account.admin?
        if @account.agent? && !CompanyAssignment.exists?(admin_id: @account.id, company_id: @review.company_id)
          raise Api::Forbidden, "Agent can moderate only assigned company replies"
        end
        attrs[:company_response_status] = Api::Params.parse_required_enum(@body["companyResponseStatus"].presence || @body["replyStatus"], Review::REPLY_STATUSES, "companyResponseStatus")
        attrs[:company_response_moderated_at] = Time.current
        attrs[:company_response_moderator_admin_id] = @account.id
        attrs[:company_response_status_reason] = Api::Params.optional_string(@body["replyStatusReason"])
      end

      status_changed = attrs.key?(:status) && attrs[:status] != @review.status
      reply_published = attrs[:company_response_status] == "approved" && @review.company_response_status != "approved"
      @review.update!(attrs)
      ActivityEvent.log("Review updated: #{@review.id}", "Star", { reviewId: @review.id, status: @review.status })
      Notifications::Deliver.review_moderated(@review) if status_changed
      Notifications::Deliver.reply_published(@review) if reply_published
      @review
    end

    private

    def company_response_value(value)
      return nil if value.nil? || (value.is_a?(String) && value.strip.empty?)
      if value.is_a?(Hash)
        return nil if value.empty? || value["text"].to_s.strip.empty?
        return value.to_json
      end
      Reviews::PlainText.parse(value, "companyResponse")
    end
  end
end
