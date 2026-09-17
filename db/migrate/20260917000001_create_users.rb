class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest
      t.string :display_name
      t.string :first_name
      t.string :last_name
      t.string :phone
      t.string :job_title
      t.string :company_name
      t.string :location
      t.string :time_zone
      t.text :bio
      t.text :avatar
      t.string :status, null: false, default: "active"
      t.string :role, null: false, default: "user"
      t.string :signup_method, null: false, default: "Email"
      t.date :signup_date
      t.boolean :verified, null: false, default: false
      t.integer :company_id
      t.datetime :email_verified_at
      t.json :preferences
      t.json :security
      t.json :permissions
      t.timestamps
    end
    add_index :users, :email, unique: true
    add_index :users, [ :role, :status ]
    add_index :users, :signup_method
  end
end
