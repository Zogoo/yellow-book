class CreateCompanies < ActiveRecord::Migration[8.1]
  def change
    create_table :companies do |t|
      t.integer :owner_user_id, null: false
      t.integer :category_id
      t.string :name, null: false
      t.string :slug, null: false
      t.string :website
      t.string :email
      t.string :mobile
      t.string :category_label
      t.string :service_type
      t.string :specialization
      t.boolean :emergency_service
      t.string :employees
      t.string :revenue
      t.string :country
      t.string :country_code
      t.string :phone_number
      t.string :contact_email
      t.string :status, null: false, default: "pending"
      t.boolean :verified, null: false, default: false
      t.string :location
      t.string :industry
      t.string :first_name
      t.string :last_name
      t.string :job_title
      t.string :owner_name
      t.string :phone
      t.string :tagline
      t.text :description
      t.text :services
      t.decimal :price, precision: 10, scale: 2
      t.text :image
      t.string :signup_channel
      t.json :profile
      t.json :preferences
      t.json :security
      t.timestamps
    end
    add_index :companies, :slug, unique: true
    add_index :companies, :owner_user_id
    add_index :companies, :category_id
    add_index :companies, [ :status, :verified ]
    add_index :companies, :name
  end
end
