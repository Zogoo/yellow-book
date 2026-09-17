FactoryBot.define do
  factory :category do
    sequence(:name) { |n| "Category #{n}" }
    sequence(:slug) { |n| "category-#{n}" }
    icon { "Building2" }
    color { "text-blue-500" }
    filters { {} }
  end

  factory :service_specialization do
    sequence(:name) { |n| "Specialization #{n}" }
    category { "IT & Software" }
  end
end
