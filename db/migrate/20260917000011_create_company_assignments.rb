class CreateCompanyAssignments < ActiveRecord::Migration[8.1]
  def change
    create_table :company_assignments do |t|
      t.integer :company_id, null: false
      t.integer :admin_id, null: false
      t.string :status, null: false, default: "Assigned"
      t.string :primary_contact
      t.datetime :assigned_date, null: false
      t.timestamps
    end
    add_index :company_assignments, [ :company_id, :admin_id ], unique: true
    add_index :company_assignments, [ :admin_id, :status ]
  end
end
