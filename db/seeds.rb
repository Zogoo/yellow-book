require_relative "catalog"

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
  regular_user.assign_attributes(password: "UserSecure123!", display_name: "Болор Ганзориг", first_name: "Болор", last_name: "Ганзориг",
                                 status: "active", role: "user", signup_method: "Email", email_verified_at: Time.current)
  regular_user.save!

  company_owner = User.find_or_initialize_by(email: "company@yellowbook.local")
  company_owner.assign_attributes(password: "CompanySecure123!", display_name: "Сэлэнгэ Батаа", first_name: "Сэлэнгэ", last_name: "Батаа",
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

  # Categories and specialisations are shared with production; see db/catalog.rb.
  Catalog.apply!

  companies = [
    { name: "Найрамдал Мал Эмнэлэг", website: "https://nairamdal-vet.mn", facebook_url: "https://facebook.com/nairamdalvet",
      category_label: "Амьтан, тэжээвэр", service_type: "Мал эмнэлэг", specialization: "Мал эмнэлэг",
      location: "Улаанбаатар", district: "Баянзүрх", revenue: "100-500 сая ₮", mobile: "+97699112233",
      email: "sain@nairamdal-vet.mn", registration_number: "6012345",
      description: "Нохой, муурны эмчилгээ, вакцин, 24 цагийн яаралтай тусламж.",
      image: nil, price: 35_000, emergency_service: true, employees: "11-30", industry: "Мал эмнэлэг" },
    { name: "Гоо Урлан Салон", website: "https://goourlan.mn", facebook_url: "https://facebook.com/goourlan",
      category_label: "Гоо сайхан", service_type: "Гоо сайхны салон", specialization: "Үс засалт",
      location: "Улаанбаатар", district: "Сүхбаатар", revenue: "100-500 сая ₮", mobile: "+97688220044",
      email: "tavtai@goourlan.mn", registration_number: "6023456",
      description: "Үс засалт, будалт, арьс арчилгаа. Урьдчилсан захиалгаар ажиллана.",
      image: nil, price: 45_000, emergency_service: false, employees: "1-10", industry: "Гоо сайхан" },
    { name: "Говь Аялал Трэвэл", website: "https://gobi-travel.mn", facebook_url: "https://facebook.com/gobitravel",
      category_label: "Аялал жуулчлал", service_type: "Аялалын компани", specialization: "Аялал зохион байгуулалт",
      location: "Улаанбаатар", district: "Чингэлтэй", revenue: "500 сая - 1 тэрбум ₮", mobile: "+97694445566",
      email: "info@gobi-travel.mn", registration_number: "6034567",
      description: "Говь, Хөвсгөл чиглэлийн аялал, гадаад жуулчдын хөтөлбөр.",
      image: nil, price: 250_000, emergency_service: true, employees: "11-30", industry: "Аялал жуулчлал" },
    { name: "Тэхномон Солюшнс", website: "https://tehnomon.mn", facebook_url: "https://facebook.com/tehnomon",
      category_label: "Мэдээллийн технологи", service_type: "Вэб хөгжүүлэлт", specialization: "Вэб хөгжүүлэлт",
      location: "Улаанбаатар", district: "Хан-Уул", revenue: "500 сая - 1 тэрбум ₮", mobile: "+97695556677",
      email: "hello@tehnomon.mn", registration_number: "6045678",
      description: "Вэб сайт, мобайл апп, системийн интеграц хийдэг баг.",
      image: nil, price: 80_000, emergency_service: true, employees: "31-50", industry: "Программ хангамж" }
  ]
  records = companies.map do |attrs|
    slug = Api::Text.slugify(attrs[:name])
    company = Company.find_or_initialize_by(slug: slug)
    company.assign_attributes(
      owner: company.new_record? ? seed_user : company.owner, category: Category.find_by(name_mn: attrs[:category_label]),
      name: attrs[:name], website: attrs[:website],
      category_label: Category.find_by(name_mn: attrs[:category_label])&.name || attrs[:category_label],
      service_type: attrs[:service_type],
      specialization: attrs[:specialization], location: attrs[:location], revenue: attrs[:revenue], mobile: attrs[:mobile],
      phone_number: attrs[:mobile], email: attrs[:email], contact_email: attrs[:email], description: attrs[:description],
      image: attrs[:image], price: attrs[:price], emergency_service: attrs[:emergency_service], employees: attrs[:employees],
      industry: attrs[:industry], district: attrs[:district], registration_number: attrs[:registration_number],
      facebook_url: attrs[:facebook_url], status: "approved", verified: true, signup_channel: "Seed",
      owner_name: "Сэлэнгэ Батаа"
    )
    company.save!
    company
  end
  vet, salon, travel, = records
  seed_user.update_column(:company_id, vet.id)
  salon.update!(owner: company_owner, owner_name: "Сэлэнгэ Батаа", first_name: "Сэлэнгэ", last_name: "Батаа", job_title: "Захирал")
  company_owner.update_column(:company_id, salon.id)
  seed_user.sync_role!
  company_owner.sync_role!

  # Customers are named people; each writes one review per company.
  reviewers = [
    [ "alice@yellowbook.local", "Алтанцэцэг Ганбат" ],
    [ "bob@yellowbook.local", "Батбаяр Доржсүрэн" ],
    [ "carol@yellowbook.local", "Сарангэрэл Энхбаяр" ],
    [ "david@yellowbook.local", "Даваасүрэн Мөнх" ],
    [ "eve@yellowbook.local", "Энхжаргал Цэрэн" ]
  ].to_h do |email, name|
    person = User.find_or_initialize_by(email: email)
    person.assign_attributes(password: "ReviewerSeed123!", display_name: name,
                             first_name: name.split.first, last_name: name.split.last,
                             status: "active", role: "user", signup_method: "Email", email_verified_at: Time.current)
    person.save!
    [ email, person ]
  end

  # Kept in step with this list rather than created once, so renaming a demo
  # reviewer actually shows up on the page.
  [
    [ "nairamdal-mal-emneleg", "alice@yellowbook.local", 5, "Нохойгоо яаралтай үзүүлэхэд тэр өдөртөө хүлээн авч, эмчилгээний явцыг алхам алхмаар тайлбарлаж өгсөн." ],
    [ "goo-urlan-salon", "bob@yellowbook.local", 4, "Захиалгаараа яг цагтаа орлоо. Үс засалт сайхан болсон, зогсоол нь л жаахан давчуу юм." ],
    [ "goo-urlan-salon", "carol@yellowbook.local", 5, "Ярьсан өнгийг яг таг гаргаж өглөө. Мастер маань юу хийж байгаагаа тайлбарлаж байсан нь таалагдсан." ],
    [ "govi-ayalal-trevel", "david@yellowbook.local", 4, "Говь руу 5 хоног яваад ирлээ. Хөтөч маш туршлагатай, хоолны зохион байгуулалт сайн байсан." ],
    [ "govi-ayalal-trevel", "eve@yellowbook.local", 5, "Гэр бүлээрээ явсан. Хуваарь тодорхой, машин нь цэвэрхэн, үнэ нь ярьсан дүнгээсээ хэтрээгүй." ],
    [ "tekhnomon-solyushns", "user@yellowbook.local", 5, "Вэб сайтаа хийлгэсэн. Долоо хоног бүр ахицаа үзүүлж, тохирсон хугацаандаа багтаасан." ]
  ].each do |slug, email, rating, content|
    company = Company.find_by!(slug: slug)
    author = reviewers[email] || regular_user
    review = Review.find_or_initialize_by(company: company, user: author)
    review.assign_attributes(reviewer_name: author.display_name, reviewer_email: author.email,
                             content: content, rating: rating, status: "approved",
                             company_name: company.name, moderated_at: Time.current)
    review.save!
  end

  Review.order(:id).limit(3).each do |review|
    next if review.user_id == regular_user.id

    ReviewLikeShare.find_or_create_by!(user: regular_user, review: review, action: "like")
  end
  if (first_review = Review.order(:id).first)
    ReviewLikeShare.find_or_create_by!(user: company_owner, review: first_review, action: "share")
  end

  [ vet, travel ].each do |company|
    Favorite.find_or_create_by!(user: regular_user, company: company) do |f|
      f.assign_attributes(name: company.name, slug: company.slug, category: company.category_label, saved_at: Time.current)
    end
  end

  if Notification.none?
    Notification.create!(user: seed_user, title: "Тавтай морилно уу", message: "Таны бүртгэл амжилттай үүслээ.", icon: "CheckCircle", icon_color: "text-green-600", bg_color: "bg-green-100", unread: true)
    Notification.create!(company: vet, title: "Байгууллага баталгаажлаа", message: %(Таны "#{vet.name}" хуудас лавлахад нийтлэгдлээ.), icon: "BadgeCheck", icon_color: "text-blue-600", bg_color: "bg-blue-100", unread: false)
    Notification.create!(company: salon, title: "Шинэ сэтгэгдэл", message: "Карол Уайт 5 одтой сэтгэгдэл үлдээлээ.", icon: "Star", icon_color: "text-yellow-600", bg_color: "bg-yellow-100", unread: true)
    Notification.create!(admin: super_admin, title: "Хүлээгдэж буй байгууллага", message: "Шинэ байгууллага баталгаажуулалт хүлээж байна.", icon: "Bell", icon_color: "text-amber-600", bg_color: "bg-amber-100", unread: true)
  end

  [ vet, salon ].each do |company|
    assignment = CompanyAssignment.find_or_initialize_by(company: company, admin: agent)
    assignment.assign_attributes(status: "Assigned", primary_contact: company == salon ? company_owner.email : seed_user.email)
    assignment.save!
  end

  if ActivityEvent.none?
    ActivityEvent.create!(title: "Database seeded", icon: "Database", time_label: "Just now", payload: { seedVersion: "3.0" })
    ActivityEvent.create!(title: "New company registered: #{vet.name}", icon: "Building2", time_label: "1h ago", payload: { companyId: vet.id })
    ActivityEvent.create!(title: "Review submitted", icon: "Star", time_label: "2h ago", payload: {})
  end

  puts "Seeded: #{User.count} users, #{Admin.count} admins, #{Category.count} categories, #{Company.count} companies, #{Review.count} reviews."
  puts "Logins: admin@yellowbook.local/AdminSecure123!  agent@yellowbook.local/AgentSecure123!  user@yellowbook.local/UserSecure123!  company@yellowbook.local/CompanySecure123!"
end
