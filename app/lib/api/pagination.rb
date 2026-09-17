module Api
  # page/limit/offset parsing with the meta block every list endpoint returns.
  class Pagination
    DEFAULT_LIMIT = 20
    MAX_LIMIT = 100

    attr_reader :page, :limit

    def self.from(query)
      page = Integer(query["page"].to_s, exception: false)
      limit = Integer(query["limit"].to_s, exception: false)
      new(page: page, limit: limit)
    end

    def initialize(page: nil, limit: nil)
      @page = page.is_a?(Integer) && page.positive? ? page : 1
      @limit = limit.is_a?(Integer) && limit.positive? ? [ limit, MAX_LIMIT ].min : DEFAULT_LIMIT
    end

    def offset
      (page - 1) * limit
    end

    def apply(relation)
      relation.offset(offset).limit(limit)
    end

    def meta(total)
      total_pages = [ 1, (total.to_f / limit).ceil ].max
      remaining = [ total - (page - 1) * limit, 0 ].max
      {
        page: page,
        limit: limit,
        pageSize: [ limit, remaining ].min,
        total: total,
        totalPages: total_pages,
        hasNext: page < total_pages,
        hasPrevious: page > 1
      }
    end
  end
end
