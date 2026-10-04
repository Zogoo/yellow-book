# robots.txt and sitemap.xml for search engines. Both use the public frontend URL so the
# links match what people share.
class SeoController < ActionController::Base
  STATIC_PATHS = %w[/ /category /popular-list /faq /about /contact /business/signup].freeze

  def robots
    render plain: <<~TXT
      User-agent: *
      Disallow: /api/
      Disallow: /admin
      Disallow: /agent
      Disallow: /company/
      Disallow: /user/
      Disallow: /auth/

      Sitemap: #{base_url}/sitemap.xml
    TXT
  end

  def sitemap
    xml = Rails.cache.fetch([ "sitemap_xml", base_url ], expires_in: 1.hour) { build_sitemap }
    render xml: xml
  end

  private

  def base_url
    ENV["APP_FRONTEND_URL"].presence&.sub(%r{/+\z}, "") || request.base_url
  end

  def build_sitemap
    urls = STATIC_PATHS.map { |path| [ "#{base_url}#{path == '/' ? '' : path}", nil ] }
    urls += Category.public_directory.alphabetical.map do |category|
      [ "#{base_url}/category?name=#{CGI.escape(category.name)}", category.updated_at ]
    end
    urls += Company.approved.order(:id).pluck(:id, :slug, :updated_at).map do |id, slug, updated_at|
      [ "#{base_url}/companies/#{id}/#{slug}", updated_at ]
    end

    entries = urls.map do |loc, lastmod|
      modified = lastmod ? "<lastmod>#{lastmod.to_date.iso8601}</lastmod>" : ""
      "<url><loc>#{ERB::Util.html_escape(loc)}</loc>#{modified}</url>"
    end
    %(<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">#{entries.join}</urlset>\n)
  end
end
