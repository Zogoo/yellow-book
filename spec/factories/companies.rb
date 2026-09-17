FactoryBot.define do
  factory :company do
    association :owner, factory: :user
    category
    sequence(:name) { |n| "Company #{n}" }
    sequence(:slug) { |n| "company-#{n}" }
    category_label { category.name }
    sequence(:email) { |n| "company#{n}@example.com" }
    website { "https://example.com" }
    service_type { "Consulting" }
    specialization { "Software" }
    location { "Ulaanbaatar" }
    description { "A company." }
    phone_number { "+97611111111" }
    contact_email { email }
    owner_name { "Owner" }
    status { "approved" }
    verified { true }
    price { 50 }

    trait :pending do
      status { "pending" }
      verified { false }
    end
  end

  factory :company_assignment do
    company
    association :admin, factory: [ :admin, :agent ]
    status { "Assigned" }
  end
end
