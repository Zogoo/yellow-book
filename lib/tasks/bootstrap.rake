namespace :app do
  desc "Create the category catalogue and the first administrator. Safe to run on every boot."
  task bootstrap: :environment do
    require_relative "../../db/catalog"

    Catalog.apply!
    puts "Catalog: #{Category.count} categories, #{ServiceSpecialization.count} specialisations."

    email = ENV["ADMIN_EMAIL"].to_s.strip.downcase
    password = ENV["ADMIN_PASSWORD"].to_s

    if email.empty? || password.empty?
      puts "Admin: ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping."
      next
    end

    if Admin.exists?(email: email)
      # Never reset the password of an account that already exists: an
      # administrator who changed theirs would get it reverted on each deploy.
      puts "Admin: #{email} already exists, left untouched."
      next
    end

    Admin.create!(
      email: email, name: ENV.fetch("ADMIN_NAME", "Administrator"),
      password: password, role: "super_admin", role_label: "Super Admin",
      status: "active", verified: true, auth_role: "ADMIN",
      admin_role: "SUPER_ADMIN", is_agent: false
    )
    puts "Admin: created #{email}."
  end
end
