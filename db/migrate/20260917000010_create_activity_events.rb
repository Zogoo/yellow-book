class CreateActivityEvents < ActiveRecord::Migration[8.1]
  def change
    create_table :activity_events do |t|
      t.string :icon
      t.string :title, null: false
      t.string :time_label
      t.json :payload
      t.timestamps
    end
    add_index :activity_events, :created_at
  end
end
