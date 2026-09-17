# Request-spec helpers: a real session-backed bearer token for a user or admin.
module AuthHelpers
  def auth_headers(account)
    result = account.is_a?(Admin) ? Auth::IssueSession.call(admin: account, request: nil) : Auth::IssueSession.call(user: account, request: nil)
    { "Authorization" => "Bearer #{result.token}" }
  end

  def json
    JSON.parse(response.body)
  end

  def data
    json["data"]
  end

  def mail_text(mail)
    mail.multipart? ? mail.text_part.body.to_s : mail.body.to_s
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
