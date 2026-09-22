require "rails_helper"

RSpec.describe "Localisation", type: :request do
  let!(:category) { create(:category, name: "Beauty & wellbeing", name_mn: "Гоо сайхан", slug: "beauty-wellbeing") }
  let!(:company) do
    create(:company, category: category, category_label: "Гоо сайхан", name: "Гоо Урлан Салон",
                     slug: "goo-urlan-salon", location: "Улаанбаатар", district: "Сүхбаатар",
                     registration_number: "6023456", facebook_url: "https://facebook.com/goourlan")
  end

  it "returns both names and a listing count for each category" do
    create(:review, company: company)
    get "/api/v1/categories"
    row = data["categories"].find { |c| c["slug"] == "beauty-wellbeing" }
    expect(row).to include("name" => "Beauty & wellbeing", "nameMn" => "Гоо сайхан", "companyCount" => 1)
  end

  it "finds Cyrillic names regardless of case" do
    get "/api/v1/listings", params: { search: "гоо урлан" }
    expect(data["listings"].map { |l| l["name"] }).to eq([ "Гоо Урлан Салон" ])

    get "/api/v1/listings", params: { search: "ГОО" }
    expect(data["listings"].size).to eq(1)
  end

  it "still finds Latin text" do
    get "/api/v1/listings", params: { search: "salon" }
    expect(data["listings"].size).to eq(1)
  end

  it "filters by Ulaanbaatar district" do
    create(:company, district: "Баянгол", name: "Өөр газар")
    get "/api/v1/listings", params: { district: "Сүхбаатар" }
    expect(data["listings"].map { |l| l["district"] }).to eq([ "Сүхбаатар" ])
  end

  it "publishes the district, phone and Facebook page a caller needs to make contact" do
    get "/api/v1/listings"
    listing = data["listings"].first
    expect(listing).to include("district" => "Сүхбаатар", "facebookUrl" => "https://facebook.com/goourlan")
    expect(listing["phone"]).to be_present
  end

  it "shows the registration number on the company record" do
    get "/api/v1/companies/#{company.id}"
    expect(data).to include("registrationNumber" => "6023456", "district" => "Сүхбаатар")
  end

  describe "slugs" do
    it "transliterates Mongolian names instead of producing an empty slug" do
      expect(Api::Text.slugify("Гоо Урлан Салон")).to eq("goo-urlan-salon")
      expect(Api::Text.slugify("Найрамдал Мал Эмнэлэг")).to eq("nairamdal-mal-emneleg")
    end

    it "registers a Mongolian business and gives it a usable slug" do
      post "/api/v1/auth/register", params: {
        email: "shine@example.mn", password: "ShineKompani123!", companyName: "Шинэ Компани",
        district: "Хан-Уул", registrationNumber: "6099999", facebookUrl: "https://facebook.com/shine"
      }, as: :json
      expect(response).to have_http_status(:created)
      created = Company.find_by(name: "Шинэ Компани")
      expect(created.slug).to eq("shine-kompani")
      expect(created.district).to eq("Хан-Уул")
      expect(created.registration_number).to eq("6099999")
    end
  end
end
