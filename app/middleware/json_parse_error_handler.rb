# Turns an unparseable JSON body into the API's 400 error contract instead of a 500.
class JsonParseErrorHandler
  def initialize(app)
    @app = app
  end

  def call(env)
    @app.call(env)
  rescue ActionDispatch::Http::Parameters::ParseError
    request_id = env["action_dispatch.request_id"]
    body = { message: "Malformed JSON request body", error: "Bad Request", statusCode: 400, requestId: request_id }.to_json
    [ 400, { "Content-Type" => "application/json" }, [ body ] ]
  end
end
