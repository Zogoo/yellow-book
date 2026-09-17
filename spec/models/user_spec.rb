require "rails_helper"

RSpec.describe User, type: :model do
  it { is_expected.to have_many(:companies).with_foreign_key(:owner_user_id) }

  it "syncs role from company ownership" do
    user = create(:user)
    expect(user.role).to eq("user")
    create(:company, owner: user)
    user.sync_role!
    expect(user.reload.role).to eq("company")
  end
end
