module Accounts
  # Emails are unique across users and admins ("global email uniqueness").
  class EnsureEmailAvailable < ApplicationService
    def initialize(email:, ignore_user_id: nil, ignore_admin_id: nil)
      @email = email
      @ignore_user_id = ignore_user_id
      @ignore_admin_id = ignore_admin_id
    end

    def call
      user = User.find_by(email: @email)
      admin = Admin.find_by(email: @email)
      raise Api::BadRequest, "Email already exists" if user && user.id != @ignore_user_id
      raise Api::BadRequest, "Email already exists" if admin && admin.id != @ignore_admin_id

      true
    end
  end
end
