require Rails.root.join("app/middleware/json_parse_error_handler")

# Sits just inside the exception reporters so a malformed body becomes the API's
# 400 contract. `ActionableExceptions` was the old anchor, but it only exists
# where requests are considered local, so production could not boot at all.
Rails.application.config.middleware.insert_after ActionDispatch::DebugExceptions, JsonParseErrorHandler
