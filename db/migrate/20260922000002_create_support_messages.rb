class CreateSupportMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :support_messages do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.text :message, null: false
      t.string :status, null: false, default: "new"
      t.integer :user_id
      t.string :handled_by
      t.datetime :handled_at
      t.timestamps
    end

    add_index :support_messages, :status
    add_index :support_messages, :created_at
  end
end
