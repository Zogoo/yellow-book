module Api
  class Unauthorized < Error
    def initialize(message = "Authentication is required") = super(message, status: 401)
  end
end
