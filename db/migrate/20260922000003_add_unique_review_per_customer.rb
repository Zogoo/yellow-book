class AddUniqueReviewPerCustomer < ActiveRecord::Migration[8.1]
  def up
    # One review per customer per company. Older duplicates keep the newest row.
    duplicates = execute(<<~SQL).to_a
      SELECT company_id, user_id FROM reviews
      WHERE user_id IS NOT NULL
      GROUP BY company_id, user_id HAVING COUNT(*) > 1
    SQL
    duplicates.each do |row|
      ids = execute("SELECT id FROM reviews WHERE company_id = #{row['company_id']} AND user_id = #{row['user_id']} ORDER BY id DESC").to_a.map { |r| r["id"] }
      execute("DELETE FROM reviews WHERE id IN (#{ids.drop(1).join(',')})") if ids.size > 1
    end

    add_index :reviews, [ :company_id, :user_id ], unique: true, where: "user_id IS NOT NULL", name: "index_reviews_on_company_and_user_unique"
  end

  def down
    remove_index :reviews, name: "index_reviews_on_company_and_user_unique"
  end
end
