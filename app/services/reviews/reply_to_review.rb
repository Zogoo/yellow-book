module Reviews
  # POST /agency/reviews/:id/reply: one company reply per review, pending moderation.
  class ReplyToReview < ApplicationService
    def initialize(review:, payload:, account:)
      @review = review
      @body = Api::Params.as_object(payload)
      @account = account
    end

    def call
      company = Company.includes(:owner).find_by(id: @review.company_id) or raise Api::NotFound, "Company not found"
      raise Api::Forbidden, "Only the company owner can reply to this review" unless company.owner_user_id == @account.id
      raise Api::Forbidden, "A company reply has already been submitted for this review" if @review.company_response_present?

      raw = @body["reply_text"].presence || @body["replyText"].presence || @body["text"].presence || @body["content"].presence ||
            (@body["companyResponse"].is_a?(Hash) ? @body["companyResponse"]["text"] : @body["companyResponse"])
      text = Reviews::PlainText.parse(raw, "reply text")
      owner = company.owner
      now = Time.current
      response = {
        name: owner&.display_label || company.owner_name || "Company",
        title: owner&.job_title || company.job_title || "Owner",
        text: text,
        date: Api::Params.date_only(now),
        time: now.strftime("%H:%M:%S"),
        avatar: owner&.avatar
      }
      @review.update!(
        company_response: response.to_json, company_response_status: "pending",
        company_response_submitted_at: now, company_response_moderated_at: nil, company_response_moderator_admin_id: nil
      )
      @review
    end
  end
end
