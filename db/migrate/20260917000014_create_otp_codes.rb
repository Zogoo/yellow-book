class CreateOtpCodes < ActiveRecord::Migration[8.1]
  def change
    create_table :otp_codes do |t|
      t.string :email, null: false
      t.string :code_hash, null: false
      t.string :purpose, null: false
      t.datetime :expires_at, null: false
      t.timestamps
    end
    add_index :otp_codes, [ :email, :purpose ]
    add_index :otp_codes, :expires_at
  end
end
