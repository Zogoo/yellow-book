FactoryBot.define do
  factory :admin do
    sequence(:email) { |n| "admin#{n}@example.com" }
    sequence(:name) { |n| "Admin #{n}" }
    password { "AdminSecure123!" }
    role { "admin" }
    role_label { "Admin" }
    auth_role { "ADMIN" }
    admin_role { "ADMIN" }
    status { "active" }
    verified { true }
    is_agent { false }
    permissions { [] }

    trait :super_admin do
      role { "super_admin" }
      role_label { "Super Admin" }
      admin_role { "SUPER_ADMIN" }
    end

    trait :agent do
      role { "agent" }
      role_label { "Agent" }
      auth_role { "SUB_ADMIN" }
      admin_role { "AGENT" }
      is_agent { true }
    end
  end
end
