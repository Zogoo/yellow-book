class CreateReviewLikeShares < ActiveRecord::Migration[8.1]
  def change
    create_table :review_like_shares do |t|
      t.integer :user_id, null: false
      t.integer :review_id, null: false
      t.string :action, null: false, limit: 20
      t.timestamps
    end
    add_index :review_like_shares, [ :review_id, :action ]
    add_index :review_like_shares, [ :user_id, :review_id ]
  end
end
