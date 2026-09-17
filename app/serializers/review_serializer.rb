module ReviewSerializer
  module_function

  def recent(review, counts = nil, include_unapproved_reply: false)
    counts ||= { likes: review.likes, dislikes: review.dislikes, shares: review.shares }
    response_status = review.company_response_status
    can_show = include_unapproved_reply || response_status == "approved"
    {
      id: review.id,
      reviewerName: review.reviewer_name,
      reviewerEmail: review.reviewer_email,
      content: review.content,
      rating: review.rating,
      date: Api::Params.date_only(review.created_at),
      time: Api::Params.time_only(review.created_at),
      likes: counts[:likes],
      shares: counts[:shares],
      dislikes: counts[:dislikes],
      status: review.status,
      companyName: review.company&.name,
      companyId: review.company_id,
      companyResponse: can_show ? review.parsed_company_response : nil,
      companyResponseStatus: response_status,
      companyResponseSubmittedAt: Api::Params.iso(review.company_response_submitted_at),
      companyResponseModeratedAt: Api::Params.iso(review.company_response_moderated_at)
    }
  end

  def mine(review, counts = nil)
    base = recent(review, counts)
    base.merge(
      company: base[:companyName],
      review: base[:content],
      text: base[:content],
      createdAt: Api::Params.iso(review.created_at),
      updatedAt: Api::Params.iso(review.updated_at)
    )
  end

  def moderation(review)
    {
      id: review.id,
      status: review.status,
      companyName: review.company&.name,
      reviewerName: review.reviewer_name,
      rating: review.rating,
      content: review.content,
      companyResponse: review.parsed_company_response,
      companyResponseStatus: review.company_response_status
    }
  end
end
