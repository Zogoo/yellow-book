class CreateServiceSpecializations < ActiveRecord::Migration[8.1]
  def change
    create_table :service_specializations do |t|
      t.string :name, null: false
      t.string :category, null: false
      t.timestamps
    end
    add_index :service_specializations, :category
  end
end
