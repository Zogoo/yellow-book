require "rails_helper"

RSpec.describe Auth::RateLimiter do
  around do |example|
    previous = ENV["DISABLE_RATE_LIMIT"]
    ENV["DISABLE_RATE_LIMIT"] = "false"
    Rails.cache.clear
    example.run
  ensure
    ENV["DISABLE_RATE_LIMIT"] = previous
  end

  it "raises TooManyRequests once the window limit is exceeded" do
    limit = described_class::RULES.fetch(:login)[:limit]
    limit.times { described_class.check!(:login, "10.0.0.1") }
    expect { described_class.check!(:login, "10.0.0.1") }.to raise_error(Api::TooManyRequests)
    expect { described_class.check!(:login, "10.0.0.2") }.not_to raise_error
  end
end
