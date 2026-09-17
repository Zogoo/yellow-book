class ServiceSpecialization < ApplicationRecord
  validates :name, presence: true
  validates :category, presence: true

  scope :alphabetical, -> { order(:name) }
end
