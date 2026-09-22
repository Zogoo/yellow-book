module Api
  class Conflict < Error
    def initialize(message = "Conflict", details: nil) = super(message, status: 409, details: details)
  end
end
