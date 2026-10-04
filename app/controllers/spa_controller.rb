class SpaController < ActionController::Base
  # Paths the Angular router knows. Anything else still gets the app (it renders its own
  # "page not found"), but with a real 404 so crawlers do not index soft-404 pages.
  KNOWN_PATHS = [
    %r{\A/(about|contact|faq|popular-list|category|catagory|agency)/?\z},
    %r{\A/business/signup/?\z},
    %r{\A/auth/[\w/-]+\z},
    %r{\A/companies/\d+(/[\w-]+)?/?\z},
    %r{\A/(user|company|admin|agent)(/.*)?\z}
  ].freeze

  def index
    spa_index = Rails.root.join("public", "index.html")
    if spa_index.exist?
      render file: spa_index, layout: false, content_type: "text/html", status: spa_status
    else
      render plain: "Frontend not built. Run: cd frontend && npm run build", status: :service_unavailable
    end
  end

  private

  def spa_status
    return :not_found unless KNOWN_PATHS.any? { |pattern| pattern.match?(request.path) }

    company_id = request.path[%r{\A/companies/(\d+)}, 1] || (request.path.start_with?("/agency") && params[:id].presence)
    return :not_found if company_id && !Company.approved.exists?(id: company_id)

    :ok
  end
end
