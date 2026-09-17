class Category < ApplicationRecord
  has_many :companies, dependent: :nullify

  validates :name, presence: true, uniqueness: true
  validates :slug, presence: true, uniqueness: true

  scope :public_directory, -> { where(is_public: true) }
  scope :alphabetical, -> { order(:name) }
end
