module Api
  # Raised anywhere in the request cycle; ApplicationController renders it as
  # `{ message, error, statusCode, requestId }`, the wire format every client expects.
  # Each subclass lives in its own file so Zeitwerk can autoload it by name.
  class Error < StandardError
    attr_reader :status, :details

    def initialize(message, status: 400, details: nil)
      super(message)
      @status = status
      @details = details
    end

    def label
      Rack::Utils::HTTP_STATUS_CODES.fetch(status, "Error")
    end
  end
end
