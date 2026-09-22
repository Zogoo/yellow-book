class AddLocalisationFields < ActiveRecord::Migration[8.1]
  def change
    # Mongolian is the working language; English is the second name, not the only one.
    add_column :categories, :name_mn, :string
    add_column :categories, :position, :integer, null: false, default: 0
    add_index :categories, :position

    # What Mongolians use to tell a real company from a Facebook shop, and how
    # most small businesses are actually reachable.
    add_column :companies, :registration_number, :string
    add_column :companies, :facebook_url, :string
    add_column :companies, :district, :string

    # Cyrillic case folding is not something SQLite can do, so we keep a folded
    # copy of the searchable text and fold the query the same way in Ruby.
    add_column :companies, :search_text, :text
    add_index :companies, :district
  end
end
