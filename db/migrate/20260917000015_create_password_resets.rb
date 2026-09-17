class CreatePasswordResets < ActiveRecord::Migration[8.1]
  def change
    create_table :password_resets do |t|
      t.integer :user_id, null: false
      t.string :token_hash, null: false
      t.datetime :expires_at, null: false
      t.boolean :used, null: false, default: false
      t.timestamps
    end
    add_index :password_resets, :token_hash, unique: true
    add_index :password_resets, [ :user_id, :used ]
  end
end
