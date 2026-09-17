class CreateSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :sessions do |t|
      t.integer :user_id
      t.integer :admin_id
      t.string :refresh_token_hash, null: false
      t.string :ip_address
      t.string :user_agent
      t.datetime :expires_at, null: false
      t.datetime :revoked_at
      t.timestamps
    end
    add_index :sessions, :refresh_token_hash, unique: true
    add_index :sessions, :user_id
    add_index :sessions, :admin_id
    add_index :sessions, :expires_at
  end
end
