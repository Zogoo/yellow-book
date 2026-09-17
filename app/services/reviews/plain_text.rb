module Reviews
  # Review bodies and replies are plain text: required, and no HTML markup.
  module PlainText
    module_function

    def parse(value, field)
      text = Api::Params.string(value)
      raise Api::BadRequest, "#{field} is required" if text.empty?
      raise Api::BadRequest, "#{field} cannot contain HTML markup" if text.match?(/[<>]/)

      text
    end
  end
end
