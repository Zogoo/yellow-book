require "rails_helper"

RSpec.describe Auth::JwtService do
  it "round-trips a payload" do
    token = described_class.encode(kind: "user", id: 7, session_id: 3, expires_at: 1.hour.from_now)
    payload = described_class.decode(token)
    expect(payload).to include(sub: 7, kind: "user", sid: 3)
  end

  it "returns nil for expired or tampered tokens" do
    token = described_class.encode(kind: "user", id: 7, session_id: 3, expires_at: 1.minute.ago)
    expect(described_class.decode(token)).to be_nil
    expect(described_class.decode("garbage")).to be_nil
  end
end
