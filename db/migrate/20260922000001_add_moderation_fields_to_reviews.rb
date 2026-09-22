class AddModerationFieldsToReviews < ActiveRecord::Migration[8.1]
  def change
    # Moderation has to be explainable and attributable.
    add_column :reviews, :status_reason, :string
    add_column :reviews, :moderated_at, :datetime
    add_column :reviews, :moderated_by_admin_id, :integer
    add_column :reviews, :company_response_status_reason, :string

    add_index :reviews, :status
    add_index :reviews, :rating
  end
end
