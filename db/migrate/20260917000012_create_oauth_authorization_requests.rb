class CreateOauthAuthorizationRequests < ActiveRecord::Migration[8.1]
  def change
    create_table :oauth_authorization_requests do |t|
      t.string :provider, null: false
      t.string :state, null: false
      t.string :redirect_uri
      t.string :intent, default: "login"
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :oauth_authorization_requests, :state, unique: true
    add_index :oauth_authorization_requests, :expires_at
  end
end
