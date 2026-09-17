class CreateReviews < ActiveRecord::Migration[8.1]
  def change
    create_table :reviews do |t|
      t.integer :company_id, null: false
      t.integer :user_id
      t.integer :moderator_admin_id
      t.string :company_name
      t.string :reviewer_name, null: false
      t.string :reviewer_email
      t.text :content, null: false
      t.integer :rating, null: false
      t.string :status, null: false, default: "pending"
      t.integer :likes, null: false, default: 0
      t.integer :shares, null: false, default: 0
      t.integer :dislikes, null: false, default: 0
      t.text :company_response
      t.string :company_response_status
      t.datetime :company_response_submitted_at
      t.datetime :company_response_moderated_at
      t.integer :company_response_moderator_admin_id
      t.timestamps
    end
    add_index :reviews, [ :company_id, :status ]
    add_index :reviews, [ :moderator_admin_id, :status ]
    add_index :reviews, :company_response_status
    add_index :reviews, :created_at
    add_index :reviews, :user_id
  end
end
