class CreateAdmins < ActiveRecord::Migration[8.1]
  def change
    create_table :admins do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :role, null: false, default: "admin"
      t.string :role_label, null: false, default: "Admin"
      t.string :status, null: false, default: "active"
      t.boolean :verified, null: false, default: true
      t.string :phone
      t.boolean :is_agent, null: false, default: false
      t.string :auth_role, null: false, default: "ADMIN"
      t.string :admin_role
      t.json :permissions
      t.json :profile
      t.json :preferences
      t.json :security
      t.string :created_on
      t.datetime :last_login_at
      t.integer :created_by
      t.timestamps
    end
    add_index :admins, :email, unique: true
    add_index :admins, [ :role, :status ]
  end
end
