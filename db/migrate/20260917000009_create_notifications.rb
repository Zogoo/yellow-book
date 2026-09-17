class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.integer :user_id
      t.integer :admin_id
      t.integer :company_id
      t.string :title, null: false
      t.text :message, null: false
      t.string :time_label
      t.string :icon
      t.string :icon_color
      t.string :bg_color
      t.boolean :unread, null: false, default: true
      t.timestamps
    end
    add_index :notifications, [ :user_id, :unread ]
    add_index :notifications, [ :admin_id, :unread ]
    add_index :notifications, [ :company_id, :unread ]
  end
end
