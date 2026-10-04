require "rails_helper"

RSpec.describe "Search engine endpoints", type: :request do
  let!(:approved) { create(:company, name: "Approved Co") }
  let!(:pending) { create(:company, :pending, name: "Pending Co") }

  before { Rails.cache.clear }

  it "serves robots.txt pointing at the sitemap" do
    get "/robots.txt"
    expect(response).to have_http_status(:ok)
    expect(response.body).to include("Disallow: /admin", "Sitemap: http://www.example.com/sitemap.xml")
  end

  it "lists static pages and approved companies only in the sitemap" do
    get "/sitemap.xml"
    expect(response).to have_http_status(:ok)
    expect(response.media_type).to eq("application/xml")
    expect(response.body).to include("/companies/#{approved.id}/#{approved.slug}", "/popular-list")
    expect(response.body).not_to include("/companies/#{pending.id}/")
  end

  describe "SPA fallback status" do
    let(:index) { Rails.root.join("public", "index.html") }
    let!(:created_index) { index.exist? ? false : (File.write(index, "<!doctype html><app-root></app-root>") && true) }

    after { File.delete(index) if created_index }

    it "returns 200 for app routes and existing companies" do
      get "/category"
      expect(response).to have_http_status(:ok)
      get "/companies/#{approved.id}/#{approved.slug}"
      expect(response).to have_http_status(:ok)
    end

    it "returns a real 404 for unknown pages and missing or unpublished companies" do
      get "/does-not-exist"
      expect(response).to have_http_status(:not_found)
      expect(response.body).to include("app-root")
      get "/companies/999999/nope"
      expect(response).to have_http_status(:not_found)
      get "/agency", params: { id: pending.id }
      expect(response).to have_http_status(:not_found)
    end
  end
end
