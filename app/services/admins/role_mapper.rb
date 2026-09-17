module Admins
  # Free-form role labels from the admin UI → (role, role_label) columns.
  class RoleMapper < ApplicationService
    MAP = {
      "" => { role: "admin", role_label: "Admin" }, "admin" => { role: "admin", role_label: "Admin" },
      "super admin" => { role: "super_admin", role_label: "Super Admin" },
      "super_admin" => { role: "super_admin", role_label: "Super Admin" },
      "super-admin" => { role: "super_admin", role_label: "Super Admin" },
      "agent" => { role: "agent", role_label: "Agent" }, "moderator" => { role: "agent", role_label: "Moderator" },
      "support" => { role: "agent", role_label: "Support" }, "viewer" => { role: "agent", role_label: "Viewer" }
    }.freeze

    def initialize(value:)
      @value = Api::Params.string(value.presence || "admin").downcase
    end

    def call
      MAP.fetch(@value, MAP["admin"])
    end
  end
end
