require "rails_helper"

RSpec.describe Review, type: :model do
  it { is_expected.to belong_to(:company) }

  it "parses the JSON company response" do
    review = build(:review, company_response: { text: "hi" }.to_json)
    expect(review.parsed_company_response).to include("text" => "hi")
    expect(review.company_response_present?).to be(true)
  end
end
