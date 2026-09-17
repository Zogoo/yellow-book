FactoryBot.define do
  factory :review do
    company
    user
    reviewer_name { "Reviewer" }
    reviewer_email { "reviewer@example.com" }
    content { "A solid experience overall." }
    rating { 4 }
    status { "approved" }
    company_name { company.name }

    trait :pending do
      status { "pending" }
    end
  end

  factory :notification do
    title { "Title" }
    message { "Message" }
    unread { true }
  end

  factory :favorite do
    user
    company
  end
end
