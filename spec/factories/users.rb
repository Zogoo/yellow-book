FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { "UserSecure123!" }
    display_name { "Test User" }
    first_name { "Test" }
    last_name { "User" }
    status { "active" }
    role { "user" }
    signup_method { "Email" }
    email_verified_at { Time.current }

    trait :unverified do
      email_verified_at { nil }
    end
  end
end
