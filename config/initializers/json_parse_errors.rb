require Rails.root.join("app/middleware/json_parse_error_handler")

Rails.application.config.middleware.insert_before ActionDispatch::ActionableExceptions, JsonParseErrorHandler
