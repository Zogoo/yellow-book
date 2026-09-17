class CreateOauthAccounts < ActiveRecord::Migration[8.1]
  def change
    create_table :oauth_accounts do |t|
      t.integer :user_id, null: false
      t.string :provider, null: false
      t.string :provider_uid, null: false
      t.timestamps
    end
    add_index :oauth_accounts, [ :provider, :provider_uid ], unique: true
    add_index :oauth_accounts, [ :user_id, :provider ], unique: true
  end
end
