module Api
  class Forbidden < Error
    def initialize(message = "Forbidden") = super(message, status: 403)
  end
end
