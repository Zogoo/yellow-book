class Category < ApplicationRecord
  # Mongolian first, English second; either may be missing in old rows.
  has_many :companies, dependent: :nullify

  validates :name, presence: true, uniqueness: true
  validates :slug, presence: true, uniqueness: true

  scope :public_directory, -> { where(is_public: true) }
  scope :alphabetical, -> { order(:position, :name) }

  def display_name(locale = "mn")
    locale.to_s == "en" ? (name.presence || name_mn.to_s) : (name_mn.presence || name.to_s)
  end
end
