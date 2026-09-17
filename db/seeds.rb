# Idempotent demo data for local development and QA.
# Run with: bin/rails db:seed  (db:prepare runs it on a fresh database).
if Rails.env.production? || Rails.env.test?
  puts "Skipping demo seeds in #{Rails.env}."
else
  seed_user = User.find_or_initialize_by(email: "seed@yellowbook.local")
  seed_user.assign_attributes(password: "SeedUser123!", display_name: "Seed User", status: "active", role: "company",
                              signup_method: "Email", email_verified_at: Time.current)
  seed_user.save!

  regular_user = User.find_or_initialize_by(email: "user@yellowbook.local")
  regular_user.assign_attributes(password: "UserSecure123!", display_name: "Regular User", first_name: "Regular", last_name: "User",
                                 status: "active", role: "user", signup_method: "Email", email_verified_at: Time.current)
  regular_user.save!

  company_owner = User.find_or_initialize_by(email: "company@yellowbook.local")
  company_owner.assign_attributes(password: "CompanySecure123!", display_name: "Company Owner", first_name: "Company", last_name: "Owner",
                                  status: "active", role: "company", signup_method: "Email", email_verified_at: Time.current)
  company_owner.save!

  super_admin = Admin.find_or_initialize_by(email: "admin@yellowbook.local")
  super_admin.assign_attributes(name: "Super Admin", password: "AdminSecure123!", role: "super_admin", role_label: "Super Admin",
                                status: "active", verified: true, auth_role: "ADMIN", admin_role: "SUPER_ADMIN", is_agent: false)
  super_admin.save!

  agent = Admin.find_or_initialize_by(email: "agent@yellowbook.local")
  agent.assign_attributes(name: "Test Agent", password: "AgentSecure123!", role: "agent", role_label: "Agent",
                          status: "active", verified: true, auth_role: "SUB_ADMIN", admin_role: "AGENT", is_agent: true)
  agent.save!

  [
    { name: "Animals & Pets", slug: "animals-pets", icon: "PawPrint", color: "text-green-500",
      filters: { serviceTypes: { label: "Service Types", options: [ "Veterinary", "Grooming", "Boarding" ] },
                 specializations: { label: "Specializations", options: [ "Pet Care", "Exotic Pets" ] }, emergencyService: true } },
    { name: "Beauty & Wellbeing", slug: "beauty-wellbeing", icon: "Sparkles", color: "text-pink-500",
      filters: { serviceTypes: { label: "Service Types", options: [ "Salon", "Spa", "Barber" ] },
                 specializations: { label: "Specializations", options: [ "Beauty", "Wellness" ] }, emergencyService: false } },
    { name: "Tourism & Hospitality", slug: "tourism-hospitality", icon: "Plane", color: "text-amber-500",
      filters: { serviceTypes: { label: "Service Types", options: [ "Travel", "Tours", "Hotels" ] },
                 specializations: { label: "Specializations", options: [ "Tourism", "Adventure" ] }, emergencyService: true } },
    { name: "IT & Software", slug: "it-software", icon: "Laptop", color: "text-blue-500",
      filters: { serviceTypes: { label: "Service Types", options: [ "Web Dev", "Consulting", "Cloud" ] },
                 specializations: { label: "Specializations", options: [ "Software", "Security" ] }, emergencyService: true } },
    { name: "Food & Beverage", slug: "food-beverage", icon: "Utensils", color: "text-orange-500",
      filters: { serviceTypes: { label: "Service Types", options: [ "Restaurant", "Catering" ] },
                 specializations: { label: "Specializations", options: [ "Local Cuisine" ] }, emergencyService: false } },
    { name: "Home Services", slug: "home-services", icon: "Home", color: "text-teal-500",
      filters: { serviceTypes: { label: "Service Types", options: [ "Cleaning", "Repair" ] },
                 specializations: { label: "Specializations", options: [ "Plumbing", "Electrical" ] }, emergencyService: true } },
    { name: "Education", slug: "education", icon: "GraduationCap", color: "text-indigo-500",
      filters: { serviceTypes: { label: "Service Types", options: [ "Tutoring", "Courses" ] },
                 specializations: { label: "Specializations", options: [ "Languages", "STEM" ] }, emergencyService: false } },
    { name: "More", slug: "more", icon: "MoreHorizontal", color: "text-gray-500", filters: {} }
  ].each do |attrs|
    category = Category.find_or_initialize_by(slug: attrs[:slug])
    category.assign_attributes(attrs)
    category.save!
  end

  [
    [ "Veterinary", "Animals & Pets" ], [ "Grooming", "Animals & Pets" ], [ "Hair Salon", "Beauty & Wellbeing" ], [ "Spa", "Beauty & Wellbeing" ],
    [ "Tour Guide", "Tourism & Hospitality" ], [ "Travel Agency", "Tourism & Hospitality" ], [ "Web Development", "IT & Software" ], [ "Software Consulting", "IT & Software" ]
  ].each { |name, category| ServiceSpecialization.find_or_create_by!(name: name, category: category) }

  companies = [
    { name: "PetCare Plus", website: "https://petcare.example.com", category_label: "Animals & Pets", service_type: "Veterinary", specialization: "Pet Care",
      location: "Ulaanbaatar", revenue: "$100K", mobile: "+1234567890", email: "hello@petcare.example.com", description: "Pet care services.",
      image: "/logo/p1.png", price: 45, emergency_service: true, employees: "10-20", industry: "Pet Care" },
    { name: "Beauty Haven", website: "https://beauty.example.com", category_label: "Beauty & Wellbeing", service_type: "Salon", specialization: "Beauty",
      location: "Ulaanbaatar", revenue: "$200K", mobile: "+1234567891", email: "hello@beauty.example.com", description: "Beauty and wellness services.",
      image: "/logo/p2.png", price: 60, emergency_service: false, employees: "1-10", industry: "Beauty" },
    { name: "Gobi Adventures", website: "https://gobi.example.com", category_label: "Tourism & Hospitality", service_type: "Travel", specialization: "Tourism",
      location: "Gobi Desert", revenue: "$300K", mobile: "+1234567892", email: "hello@gobi.example.com", description: "Tourism and travel services.",
      image: "/logo/image6.png", price: 120, emergency_service: true, employees: "21-50", industry: "Tourism" },
    { name: "Tech Solutions", website: "https://tech.example.com", category_label: "IT & Software", service_type: "Web Dev", specialization: "Software",
      location: "Ulaanbaatar", revenue: "$400K", mobile: "+1234567893", email: "hello@tech.example.com", description: "IT solutions and software development.",
      image: "/logo/image7.png", price: 95, emergency_service: true, employees: "51+", industry: "Software" }
  ]
  records = companies.map do |attrs|
    slug = attrs[:name].downcase.gsub(/[^a-z0-9]+/, "-").gsub(/\A-+|-+\z/, "")
    company = Company.find_or_initialize_by(slug: slug)
    company.assign_attributes(
      owner: company.new_record? ? seed_user : company.owner, category: Category.find_by(name: attrs[:category_label]),
      name: attrs[:name], website: attrs[:website], category_label: attrs[:category_label], service_type: attrs[:service_type],
      specialization: attrs[:specialization], location: attrs[:location], revenue: attrs[:revenue], mobile: attrs[:mobile],
      phone_number: attrs[:mobile], email: attrs[:email], contact_email: attrs[:email], description: attrs[:description],
      image: attrs[:image], price: attrs[:price], emergency_service: attrs[:emergency_service], employees: attrs[:employees],
      industry: attrs[:industry], status: "approved", verified: true, signup_channel: "Seed", owner_name: "Seed Owner"
    )
    company.save!
    company
  end
  petcare, beauty, gobi, = records
  seed_user.update_column(:company_id, petcare.id)
  beauty.update!(owner: company_owner, owner_name: "Company Owner", first_name: "Company", last_name: "Owner", job_title: "Founder")
  company_owner.update_column(:company_id, beauty.id)
  seed_user.sync_role!
  company_owner.sync_role!

  if Review.none?
    [
      [ "petcare-plus", "Alice Johnson", "alice@example.com", 5, "Excellent pet care! My dog loved it." ],
      [ "petcare-plus", "Bob Smith", "bob@example.com", 4, "Good service, friendly staff." ],
      [ "beauty-haven", "Carol White", "carol@example.com", 5, "Best salon in town!" ],
      [ "beauty-haven", "David Brown", nil, 4, "Great haircut and styling." ],
      [ "gobi-adventures", "Eve Davis", "eve@example.com", 5, "Amazing tour experience." ],
      [ "tech-solutions", "Frank Wilson", "frank@example.com", 5, "Professional web development." ]
    ].each do |slug, name, email, rating, content|
      company = Company.find_by!(slug: slug)
      Review.create!(company: company, user: regular_user, reviewer_name: name, reviewer_email: email, content: content,
                     rating: rating, status: "approved", company_name: company.name)
    end
  end

  Review.order(:id).limit(3).each do |review|
    ReviewLikeShare.find_or_create_by!(user: regular_user, review: review, action: "like")
  end
  if (first_review = Review.order(:id).first)
    ReviewLikeShare.find_or_create_by!(user: company_owner, review: first_review, action: "share")
  end

  Favorite.find_or_create_by!(user: regular_user, company: petcare) { |f| f.assign_attributes(name: petcare.name, slug: petcare.slug, category: "Animals & Pets", rating: 4.5, saved_at: Time.current) }
  Favorite.find_or_create_by!(user: regular_user, company: gobi) { |f| f.assign_attributes(name: gobi.name, slug: gobi.slug, category: "Tourism & Hospitality", rating: 5, saved_at: Time.current) }

  if Notification.none?
    Notification.create!(user: seed_user, title: "Welcome to Yellow Book", message: "Your account has been set up successfully.", icon: "CheckCircle", icon_color: "text-green-600", bg_color: "bg-green-100", unread: true)
    Notification.create!(company: petcare, title: "Company Approved", message: %(Your company "#{petcare.name}" is now live on the directory.), icon: "BadgeCheck", icon_color: "text-blue-600", bg_color: "bg-blue-100", unread: false)
    Notification.create!(company: beauty, title: "New review received", message: "Carol White left a 5-star review for Beauty Haven.", icon: "Star", icon_color: "text-yellow-600", bg_color: "bg-yellow-100", unread: true)
    Notification.create!(admin: super_admin, title: "New Company Pending", message: "A new company has been submitted for review.", icon: "Bell", icon_color: "text-amber-600", bg_color: "bg-amber-100", unread: true)
  end

  [ petcare, beauty ].each do |company|
    assignment = CompanyAssignment.find_or_initialize_by(company: company, admin: agent)
    assignment.assign_attributes(status: "Assigned", primary_contact: company == beauty ? company_owner.email : seed_user.email)
    assignment.save!
  end

  if ActivityEvent.none?
    ActivityEvent.create!(title: "Database seeded", icon: "Database", time_label: "Just now", payload: { seedVersion: "2.0" })
    ActivityEvent.create!(title: "New company registered: PetCare Plus", icon: "Building2", time_label: "1h ago", payload: { companyId: petcare.id })
    ActivityEvent.create!(title: "Review submitted", icon: "Star", time_label: "2h ago", payload: {})
  end

  puts "Seeded: #{User.count} users, #{Admin.count} admins, #{Category.count} categories, #{Company.count} companies, #{Review.count} reviews."
  puts "Logins: admin@yellowbook.local/AdminSecure123!  agent@yellowbook.local/AgentSecure123!  user@yellowbook.local/UserSecure123!  company@yellowbook.local/CompanySecure123!"
end
