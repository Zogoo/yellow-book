class ApplicationController < ActionController::API
  include Authenticatable

  # Bodies are read verbatim; never nest them under the controller name.
  wrap_parameters false

  before_action :set_locale

  rescue_from Api::Error, with: :render_api_error
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :render_record_invalid
  rescue_from ActionController::ParameterMissing do |e|
    render_error(e.message, 400)
  end

  def not_found
    render_error("Cannot #{request.method} #{request.path}", 404)
  end

  private

  def set_locale
    locale = request.headers["X-Locale"]&.to_sym
    I18n.locale = I18n.available_locales.include?(locale) ? locale : I18n.default_locale
  end

  # Every successful response is `{ data }` or `{ data, meta }`.
  # Accepts either a positional payload or inline keyword pairs (`render_data(id: 1)`).
  def render_data(data = nil, meta = nil, http_status: :ok, **inline)
    data = inline if data.nil? && inline.any?
    body = { data: data }
    body[:meta] = meta if meta
    render json: body, status: http_status
  end

  def render_error(message, status, details: nil)
    body = { message: message, error: Rack::Utils::HTTP_STATUS_CODES.fetch(status, "Error"), statusCode: status, requestId: request.request_id }
    body[:details] = details if details
    render json: body, status: status
  end

  def render_api_error(error)
    render_error(error.message, error.status, details: error.details)
  end

  def render_not_found
    render_error("Not Found", 404)
  end

  def render_record_invalid(exception)
    render_error(exception.record.errors.full_messages.join("; "), 400)
  end

  # Request bodies are free-form JSON documents (validated in services).
  def body_params
    request.request_parameters.to_h
  end

  def query_params
    request.query_parameters.to_h
  end

  def pagination
    Api::Pagination.from(query_params)
  end

  def paginate(scope)
    page = pagination
    [ page.apply(scope).to_a, page.meta(scope.count(:all)) ]
  end

  def route_id(key = :id, field = "id")
    raw = params[key].to_s.strip
    raise Api::BadRequest, "#{field} is required" if raw.empty?

    Api::Params.parse_id(raw, field)
  end
end
