# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_09_23_000001) do
  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "activity_events", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "icon"
    t.json "payload"
    t.string "time_label"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_activity_events_on_created_at"
  end

  create_table "admins", force: :cascade do |t|
    t.string "admin_role"
    t.string "auth_role", default: "ADMIN", null: false
    t.datetime "created_at", null: false
    t.integer "created_by"
    t.string "created_on"
    t.string "email", null: false
    t.boolean "is_agent", default: false, null: false
    t.datetime "last_login_at"
    t.string "name", null: false
    t.string "password_digest", null: false
    t.json "permissions"
    t.string "phone"
    t.json "preferences"
    t.json "profile"
    t.string "role", default: "admin", null: false
    t.string "role_label", default: "Admin", null: false
    t.json "security"
    t.string "status", default: "active", null: false
    t.datetime "updated_at", null: false
    t.boolean "verified", default: true, null: false
    t.index ["email"], name: "index_admins_on_email", unique: true
    t.index ["role", "status"], name: "index_admins_on_role_and_status"
  end

  create_table "categories", force: :cascade do |t|
    t.string "color"
    t.datetime "created_at", null: false
    t.json "filters"
    t.string "icon"
    t.boolean "is_public", default: true, null: false
    t.string "name", null: false
    t.string "name_mn"
    t.integer "position", default: 0, null: false
    t.string "slug", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_categories_on_name", unique: true
    t.index ["position"], name: "index_categories_on_position"
    t.index ["slug"], name: "index_categories_on_slug", unique: true
  end

  create_table "companies", force: :cascade do |t|
    t.integer "category_id"
    t.string "category_label"
    t.string "contact_email"
    t.string "country"
    t.string "country_code"
    t.datetime "created_at", null: false
    t.text "description"
    t.string "district"
    t.string "email"
    t.boolean "emergency_service"
    t.string "employees"
    t.string "facebook_url"
    t.string "first_name"
    t.text "image"
    t.string "industry"
    t.string "job_title"
    t.string "last_name"
    t.string "location"
    t.string "mobile"
    t.string "name", null: false
    t.string "owner_name"
    t.integer "owner_user_id", null: false
    t.string "phone"
    t.string "phone_number"
    t.json "preferences"
    t.decimal "price", precision: 10, scale: 2
    t.json "profile"
    t.string "registration_number"
    t.string "revenue"
    t.text "search_text"
    t.json "security"
    t.string "service_type"
    t.text "services"
    t.string "signup_channel"
    t.string "slug", null: false
    t.string "specialization"
    t.string "status", default: "pending", null: false
    t.string "tagline"
    t.datetime "updated_at", null: false
    t.boolean "verified", default: false, null: false
    t.string "website"
    t.index ["category_id"], name: "index_companies_on_category_id"
    t.index ["district"], name: "index_companies_on_district"
    t.index ["name"], name: "index_companies_on_name"
    t.index ["owner_user_id"], name: "index_companies_on_owner_user_id"
    t.index ["slug"], name: "index_companies_on_slug", unique: true
    t.index ["status", "verified"], name: "index_companies_on_status_and_verified"
  end

  create_table "company_assignments", force: :cascade do |t|
    t.integer "admin_id", null: false
    t.datetime "assigned_date", null: false
    t.integer "company_id", null: false
    t.datetime "created_at", null: false
    t.string "primary_contact"
    t.string "status", default: "Assigned", null: false
    t.datetime "updated_at", null: false
    t.index ["admin_id", "status"], name: "index_company_assignments_on_admin_id_and_status"
    t.index ["company_id", "admin_id"], name: "index_company_assignments_on_company_id_and_admin_id", unique: true
  end

  create_table "favorites", force: :cascade do |t|
    t.string "category"
    t.integer "company_id", null: false
    t.datetime "created_at", null: false
    t.string "name"
    t.decimal "rating", precision: 3, scale: 2
    t.datetime "saved_at"
    t.string "slug"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["company_id"], name: "index_favorites_on_company_id"
    t.index ["user_id", "company_id"], name: "index_favorites_on_user_id_and_company_id", unique: true
  end

  create_table "notifications", force: :cascade do |t|
    t.integer "admin_id"
    t.string "bg_color"
    t.integer "company_id"
    t.datetime "created_at", null: false
    t.string "icon"
    t.string "icon_color"
    t.text "message", null: false
    t.string "time_label"
    t.string "title", null: false
    t.boolean "unread", default: true, null: false
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["admin_id", "unread"], name: "index_notifications_on_admin_id_and_unread"
    t.index ["company_id", "unread"], name: "index_notifications_on_company_id_and_unread"
    t.index ["user_id", "unread"], name: "index_notifications_on_user_id_and_unread"
  end

  create_table "oauth_accounts", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "provider", null: false
    t.string "provider_uid", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["provider", "provider_uid"], name: "index_oauth_accounts_on_provider_and_provider_uid", unique: true
    t.index ["user_id", "provider"], name: "index_oauth_accounts_on_user_id_and_provider", unique: true
  end

  create_table "oauth_authorization_requests", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "intent", default: "login"
    t.string "provider", null: false
    t.string "redirect_uri"
    t.string "state", null: false
    t.datetime "updated_at", null: false
    t.index ["expires_at"], name: "index_oauth_authorization_requests_on_expires_at"
    t.index ["state"], name: "index_oauth_authorization_requests_on_state", unique: true
  end

  create_table "otp_codes", force: :cascade do |t|
    t.string "code_hash", null: false
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "expires_at", null: false
    t.string "purpose", null: false
    t.datetime "updated_at", null: false
    t.index ["email", "purpose"], name: "index_otp_codes_on_email_and_purpose"
    t.index ["expires_at"], name: "index_otp_codes_on_expires_at"
  end

  create_table "password_resets", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "token_hash", null: false
    t.datetime "updated_at", null: false
    t.boolean "used", default: false, null: false
    t.integer "user_id", null: false
    t.index ["token_hash"], name: "index_password_resets_on_token_hash", unique: true
    t.index ["user_id", "used"], name: "index_password_resets_on_user_id_and_used"
  end

  create_table "review_like_shares", force: :cascade do |t|
    t.string "action", limit: 20, null: false
    t.datetime "created_at", null: false
    t.integer "review_id", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["review_id", "action"], name: "index_review_like_shares_on_review_id_and_action"
    t.index ["user_id", "review_id"], name: "index_review_like_shares_on_user_id_and_review_id"
  end

  create_table "reviews", force: :cascade do |t|
    t.integer "company_id", null: false
    t.string "company_name"
    t.text "company_response"
    t.datetime "company_response_moderated_at"
    t.integer "company_response_moderator_admin_id"
    t.string "company_response_status"
    t.string "company_response_status_reason"
    t.datetime "company_response_submitted_at"
    t.text "content", null: false
    t.datetime "created_at", null: false
    t.integer "dislikes", default: 0, null: false
    t.integer "likes", default: 0, null: false
    t.datetime "moderated_at"
    t.integer "moderated_by_admin_id"
    t.integer "moderator_admin_id"
    t.integer "rating", null: false
    t.string "reviewer_email"
    t.string "reviewer_name", null: false
    t.integer "shares", default: 0, null: false
    t.string "status", default: "pending", null: false
    t.string "status_reason"
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["company_id", "status"], name: "index_reviews_on_company_id_and_status"
    t.index ["company_id", "user_id"], name: "index_reviews_on_company_and_user_unique", unique: true, where: "user_id IS NOT NULL"
    t.index ["company_response_status"], name: "index_reviews_on_company_response_status"
    t.index ["created_at"], name: "index_reviews_on_created_at"
    t.index ["moderator_admin_id", "status"], name: "index_reviews_on_moderator_admin_id_and_status"
    t.index ["rating"], name: "index_reviews_on_rating"
    t.index ["status"], name: "index_reviews_on_status"
    t.index ["user_id"], name: "index_reviews_on_user_id"
  end

  create_table "service_specializations", force: :cascade do |t|
    t.string "category", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_service_specializations_on_category"
  end

  create_table "sessions", force: :cascade do |t|
    t.integer "admin_id"
    t.datetime "created_at", null: false
    t.datetime "expires_at", null: false
    t.string "ip_address"
    t.string "refresh_token_hash", null: false
    t.datetime "revoked_at"
    t.datetime "updated_at", null: false
    t.string "user_agent"
    t.integer "user_id"
    t.index ["admin_id"], name: "index_sessions_on_admin_id"
    t.index ["expires_at"], name: "index_sessions_on_expires_at"
    t.index ["refresh_token_hash"], name: "index_sessions_on_refresh_token_hash", unique: true
    t.index ["user_id"], name: "index_sessions_on_user_id"
  end

  create_table "support_messages", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.datetime "handled_at"
    t.string "handled_by"
    t.text "message", null: false
    t.string "name", null: false
    t.string "status", default: "new", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id"
    t.index ["created_at"], name: "index_support_messages_on_created_at"
    t.index ["status"], name: "index_support_messages_on_status"
  end

  create_table "users", force: :cascade do |t|
    t.text "avatar"
    t.text "bio"
    t.integer "company_id"
    t.string "company_name"
    t.datetime "created_at", null: false
    t.string "display_name"
    t.string "email", null: false
    t.datetime "email_verified_at"
    t.string "first_name"
    t.string "job_title"
    t.string "last_name"
    t.string "location"
    t.string "password_digest"
    t.json "permissions"
    t.string "phone"
    t.json "preferences"
    t.string "role", default: "user", null: false
    t.json "security"
    t.date "signup_date"
    t.string "signup_method", default: "Email", null: false
    t.string "status", default: "active", null: false
    t.string "time_zone"
    t.datetime "updated_at", null: false
    t.boolean "verified", default: false, null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["role", "status"], name: "index_users_on_role_and_status"
    t.index ["signup_method"], name: "index_users_on_signup_method"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
end
