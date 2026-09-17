Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      # Auth
      post "auth/register", to: "auth#register"
      post "auth/login", to: "auth#login"
      post "auth/email-code/request", to: "auth#request_email_code"
      post "auth/email-code/verify", to: "auth#verify_email_code"
      post "auth/logout", to: "auth#logout"
      get  "auth/me", to: "auth#me"
      post "auth/forgot-password", to: "auth#forgot_password"
      post "auth/reset-password", to: "auth#reset_password"
      get  "auth/oauth/:provider/authorize", to: "auth#oauth_authorize"
      get  "auth/oauth/:provider/callback", to: "auth#oauth_callback_get"
      post "auth/oauth/:provider/callback", to: "auth#oauth_callback"
      get  "auth/oauth/:provider", to: "auth#oauth_authorize"

      # Admin
      get "admin/stats", to: "admin#stats"
      resources :users, only: %i[index show create update destroy]
      resources :admins, only: %i[index show create update destroy]
      get "agent/dashboard", to: "agent_dashboard#show"
      get "activities/recent", to: "activities#recent"
      get "specialization", to: "specializations#index"
      post "specialization", to: "specializations#create"
      put "specialization/:id", to: "specializations#update"
      patch "specialization/:id", to: "specializations#update"
      delete "specialization/:id", to: "specializations#destroy"

      # Directory
      get "companies", to: "companies#index"
      get "listings", to: "companies#listings"
      get "companies/recent", to: "companies#recent"
      get "companies/recent/:id", to: "companies#recent_show"
      put "companies/recent/:id", to: "companies#recent_update"
      patch "companies/recent/:id", to: "companies#recent_update"
      delete "companies/recent/:id", to: "companies#recent_destroy"
      get "companies/:id", to: "companies#show"
      post "companies", to: "companies#create"
      put "companies/:id", to: "companies#update"
      patch "companies/:id", to: "companies#update"
      delete "companies/:id", to: "companies#destroy"
      get "company-registration-options", to: "company_options#show"
      get "categories", to: "categories#index"
      get "agencies", to: "agencies#index"
      get "agencies/:id", to: "agencies#show"

      # Company workspace
      get "agency/dashboard", to: "agency#dashboard"
      get "agency/company", to: "agency#company"
      put "agency/company", to: "agency#update_company"
      get "agency/notifications", to: "agency#notifications"
      put "agency/notifications/:id", to: "agency#update_notification"
      patch "agency/notifications/:id", to: "agency#update_notification"
      delete "agency/notifications/:id", to: "agency#destroy_notification"

      # Reviews
      get "reviews/recent", to: "reviews#recent"
      get "reviews/recent/:id", to: "reviews#show"
      put "reviews/recent/:id", to: "reviews#update"
      patch "reviews/recent/:id", to: "reviews#update"
      delete "reviews/recent/:id", to: "reviews#destroy_recent"
      get "agency/reviews", to: "reviews#agency_index"
      post "agency/reviews", to: "reviews#create"
      get "agency/reviews/:id", to: "reviews#show"
      put "agency/reviews/:id", to: "reviews#update"
      patch "agency/reviews/:id", to: "reviews#update"
      post "agency/reviews/:id/like", to: "reviews#like"
      post "agency/reviews/:id/dislike", to: "reviews#dislike"
      post "agency/reviews/:id/share", to: "reviews#share"
      post "agency/reviews/:id/reply", to: "reviews#reply"
      delete "agency/reviews/:id", to: "reviews#destroy"
      get "user/my-reviews", to: "reviews#my_reviews"
      put "user/my-reviews/:id", to: "reviews#update_my_review"
      patch "user/my-reviews/:id", to: "reviews#update_my_review"
      delete "user/my-reviews/:id", to: "reviews#destroy_my_review"

      # Profiles
      get "company/profile", to: "profiles#company_show"
      put "company/profile", to: "profiles#company_update"
      patch "company/profile", to: "profiles#company_update"
      get "user/profile", to: "profiles#user_show"
      put "user/profile", to: "profiles#user_update"
      patch "user/profile", to: "profiles#user_update"
      get "subadmin/profile", to: "profiles#subadmin_show"
      put "subadmin/profile", to: "profiles#subadmin_update"
      patch "subadmin/profile", to: "profiles#subadmin_update"

      # Sub-admin queues
      get "subadmin/companies", to: "subadmin#companies"
      put "subadmin/companies/:id", to: "subadmin#update_company"
      patch "subadmin/companies/:id", to: "subadmin#update_company"
      delete "subadmin/companies/:id", to: "subadmin#destroy_company"
      get "subadmin/reviews", to: "subadmin#reviews"
      put "subadmin/reviews/:id", to: "subadmin#update_review"
      patch "subadmin/reviews/:id", to: "subadmin#update_review"
      delete "subadmin/reviews/:id", to: "subadmin#destroy_review"

      # Favorites
      get "favorites", to: "favorites#index"
      post "favorites", to: "favorites#create"
      delete "favorites/:id", to: "favorites#destroy"
      get "user/favorites", to: "favorites#user_index"
      post "user/favorites", to: "favorites#user_create"
      delete "user/favorites/:id", to: "favorites#user_destroy"
      get "user/favourite-companies", to: "favorites#user_index"
      delete "user/favourite-companies/:id", to: "favorites#user_destroy"

      # Notifications & sessions
      get "notifications", to: "notifications#index"
      post "notifications", to: "notifications#create"
      patch "notifications/:id/read", to: "notifications#mark_read"
      put "notifications/:id", to: "notifications#update"
      patch "notifications/:id", to: "notifications#update"
      delete "notifications/:id", to: "notifications#destroy"
      get "sessions", to: "sessions#index"

      match "*path", to: "/application#not_found", via: :all
    end
  end

  # SPA catch-all: everything except the API, health check and asset-like paths
  # is served by the built Angular app.
  get "*path", to: "spa#index", constraints: ->(req) {
    !req.path.start_with?("/api/", "/up") && !req.path.match?(/\.\w+$/)
  }
end
