module Api
  class TooManyRequests < Error
    def initialize(message = "Too many requests. Please try again shortly.") = super(message, status: 429)
  end
end
