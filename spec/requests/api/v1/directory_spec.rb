require "rails_helper"

RSpec.describe "Public directory", type: :request do
  let!(:category) { create(:category, name: "IT & Software", slug: "it-software") }
  let!(:approved) { create(:company, category: category, name: "Approved Co") }
  let!(:pending) { create(:company, :pending, category: category, name: "Pending Co") }
  let!(:review) { create(:review, company: approved, rating: 5) }

  it "lists categories" do
    get "/api/v1/categories"
    expect(response).to have_http_status(:ok)
    expect(data["categories"].map { |c| c["name"] }).to include("IT & Software")
  end

  it "lists only approved listings with ratings" do
    get "/api/v1/listings", params: { limit: 10 }
    expect(response).to have_http_status(:ok)
    names = data["listings"].map { |l| l["name"] }
    expect(names).to include("Approved Co")
    expect(names).not_to include("Pending Co")
    expect(data["listings"].first).to include("rating" => 5.0, "ratingCount" => 1, "slug" => approved.slug)
    expect(json["meta"]).to include("page" => 1, "limit" => 10, "total" => 1, "hasNext" => false)
  end

  it "searches listings" do
    get "/api/v1/listings", params: { search: "approved" }
    expect(data["listings"].size).to eq(1)
    get "/api/v1/listings", params: { search: "zzz" }
    expect(data["listings"]).to be_empty
  end

  it "filters listings by category" do
    get "/api/v1/listings", params: { category: "IT" }
    expect(data["listings"].size).to eq(1)
  end

  it "serves /companies as listings for anonymous callers" do
    get "/api/v1/companies"
    expect(data["listings"].size).to eq(1)
  end

  it "shows an approved company and hides a pending one" do
    get "/api/v1/companies/#{approved.id}"
    expect(response).to have_http_status(:ok)
    expect(data["name"]).to eq("Approved Co")
    get "/api/v1/companies/#{pending.id}"
    expect(response).to have_http_status(:not_found)
  end

  it "lists agencies and registration options" do
    get "/api/v1/agencies"
    expect(data.size).to eq(1)
    get "/api/v1/company-registration-options"
    expect(data["categories"]).to include("IT & Software")
  end

  it "returns approved reviews publicly" do
    create(:review, :pending, company: approved)
    get "/api/v1/agency/reviews", params: { companyId: approved.id }
    expect(data.size).to eq(1)
    expect(data.first["status"]).to eq("approved")
    get "/api/v1/reviews/recent"
    expect(data.size).to eq(1)
  end
end
