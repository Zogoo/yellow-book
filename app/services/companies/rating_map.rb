module Companies
  # Approved-review average (1 decimal) and count per company id.
  class RatingMap < ApplicationService
    def initialize(company_ids:)
      @company_ids = Array(company_ids).compact.uniq
    end

    def call
      map = Hash.new { |_h, _k| { average: 0.0, count: 0 } }
      return map if @company_ids.empty?

      Review.approved.where(company_id: @company_ids).group(:company_id).pluck(:company_id, Arel.sql("AVG(rating)"), Arel.sql("COUNT(*)")).each do |company_id, avg, count|
        map[company_id] = { average: avg.to_f.round(1), count: count.to_i }
      end
      map
    end
  end
end
