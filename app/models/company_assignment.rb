class CompanyAssignment < ApplicationRecord
  belongs_to :company
  belongs_to :admin

  before_validation { self.assigned_date ||= Time.current }

  validates :admin_id, uniqueness: { scope: :company_id }
end
