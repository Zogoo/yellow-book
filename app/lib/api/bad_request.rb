module Api
  class BadRequest < Error
    def initialize(message = "Bad Request", details: nil) = super(message, status: 400, details: details)
  end
end
