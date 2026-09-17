module Api
  module V1
    class CompaniesController < ApplicationController
      before_action :require_verified_email!, except: %i[index listings show]
      before_action -> { require_roles!("super_admin", "admin", "agent") }, only: %i[recent recent_show recent_update]
      before_action -> { require_roles!("super_admin", "admin") }, only: %i[recent_destroy destroy]
      before_action -> { require_roles!("super_admin", "admin", "company", "user") }, only: :create
      before_action -> { require_roles!("super_admin", "admin", "agent", "company") }, only: :update

      # Public directory; admins get the full company projection (and may filter by status).
      def index
        admin_view = current_account&.admin?
        listing_projection = query_params["projection"].to_s.strip.downcase == "listing" || !admin_view
        companies, meta = paginate(CompaniesQuery.new(Company.all).call(query_params, admin_view: admin_view))
        ratings = Companies::RatingMap.call(company_ids: companies.map(&:id))
        if listing_projection
          render_data({ listings: companies.map { |c| CompanySerializer.listing(c, ratings[c.id]) } }, meta)
        else
          render_data(companies.map { |c| CompanySerializer.item(c, ratings[c.id]) }, meta)
        end
      end

      def listings
        companies, meta = paginate(CompaniesQuery.new(Company.all).call(query_params, admin_view: false, approved_only: true))
        ratings = Companies::RatingMap.call(company_ids: companies.map(&:id))
        render_data({ listings: companies.map { |c| CompanySerializer.listing(c, ratings[c.id]) } }, meta)
      end

      def show
        company = Company.includes(:category, :owner).find_by(id: route_id) or raise Api::NotFound, "Company not found"
        unless company.approved? || can_see_unapproved?(company)
          raise Api::NotFound, "Company not found"
        end
        render_data(CompanySerializer.item(company, Companies::RatingMap.call(company_ids: [ company.id ])[company.id]))
      end

      def create
        company = Companies::CreateCompany.call(payload: body_params, account: current_account)
        render_data(CompanySerializer.item(company, { average: 0, count: 0 }), http_status: :created)
      end

      def update
        company = find_company
        Companies::UpdateCompany.call(company: company, payload: body_params, account: current_account)
        company.reload
        render_data(CompanySerializer.item(company, Companies::RatingMap.call(company_ids: [ company.id ])[company.id]))
      end

      def destroy
        company = find_company
        owner_id = company.owner_user_id
        company.destroy!
        User.find_by(id: owner_id)&.sync_role!
        ActivityEvent.log("Company deleted: #{company.name}", "Trash2", { companyId: company.id })
        render_data(id: company.id, deleted: true)
      end

      def recent
        companies, meta = paginate(CompaniesQuery.new(Company.all).recent(query_params))
        render_data(companies.map { |c| CompanySerializer.recent(c) }, meta)
      end

      def recent_show
        render_data(CompanySerializer.recent(find_company))
      end

      def recent_update
        update
      end

      def recent_destroy
        destroy
      end

      private

      def find_company
        Company.includes(:category, :owner).find_by(id: route_id) or raise Api::NotFound, "Company not found"
      end

      def can_see_unapproved?(company)
        account = current_account
        return false unless account
        if account.admin?
          return true unless account.agent?
          return CompanyAssignment.exists?(admin_id: account.id, company_id: company.id)
        end
        company.owner_user_id == account.id
      end
    end
  end
end
