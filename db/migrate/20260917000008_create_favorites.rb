class CreateFavorites < ActiveRecord::Migration[8.1]
  def change
    create_table :favorites do |t|
      t.integer :user_id, null: false
      t.integer :company_id, null: false
      t.string :name
      t.string :slug
      t.string :category
      t.decimal :rating, precision: 3, scale: 2
      t.datetime :saved_at
      t.timestamps
    end
    add_index :favorites, [ :user_id, :company_id ], unique: true
    add_index :favorites, :company_id
  end
end
