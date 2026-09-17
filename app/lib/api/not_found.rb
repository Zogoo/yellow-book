module Api
  class NotFound < Error
    def initialize(message = "Not Found") = super(message, status: 404)
  end
end
