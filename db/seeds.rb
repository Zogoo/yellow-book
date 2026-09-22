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

  # The category set Mongolians actually shop for. Mongolian name first, English second.
  [
    { name: "Food & drink", name_mn: "Хоол, ундаа", slug: "food-drink", icon: "Utensils", color: "text-orange-500",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Ресторан", "Кафе", "Хүргэлт", "Кейтеринг" ] },
                 specializations: { label: "Чиглэл", options: [ "Монгол хоол", "Азийн хоол", "Европ хоол", "Бууз, банш" ] }, emergencyService: false } },
    { name: "Beauty & wellbeing", name_mn: "Гоо сайхан", slug: "beauty-wellbeing", icon: "Sparkles", color: "text-pink-500",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Үсчин", "Гоо сайхны салон", "Массаж", "Маникюр" ] },
                 specializations: { label: "Чиглэл", options: [ "Үс засалт", "Арьс арчилгаа", "Хумс" ] }, emergencyService: false } },
    { name: "Health & clinics", name_mn: "Эмнэлэг, эрүүл мэнд", slug: "health-clinics", icon: "Stethoscope", color: "text-red-500",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Эмнэлэг", "Шүдний эмнэлэг", "Лаборатори", "Оптик" ] },
                 specializations: { label: "Чиглэл", options: [ "Хүүхдийн", "Эмэгтэйчүүдийн", "Шүд", "Нүд" ] }, emergencyService: true } },
    { name: "Car services", name_mn: "Авто үйлчилгээ", slug: "car-services", icon: "Car", color: "text-slate-600",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Засвар", "Угаалга", "Оношилгоо", "Сэлбэг" ] },
                 specializations: { label: "Чиглэл", options: [ "Хөдөлгүүр", "Явах эд анги", "Цахилгаан", "Дугуй" ] }, emergencyService: true } },
    { name: "Construction & repair", name_mn: "Барилга, засвар", slug: "construction-repair", icon: "Hammer", color: "text-amber-600",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Барилга", "Засвар үйлчилгээ", "Дизайн", "Материал" ] },
                 specializations: { label: "Чиглэл", options: [ "Сантехник", "Цахилгаан", "Заслын ажил", "Цонх, хаалга" ] }, emergencyService: true } },
    { name: "Home services", name_mn: "Гэр ахуйн үйлчилгээ", slug: "home-services", icon: "Home", color: "text-teal-500",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Цэвэрлэгээ", "Нүүлгэлт", "Угаалга", "Засвар" ] },
                 specializations: { label: "Чиглэл", options: [ "Оффис цэвэрлэгээ", "Гэрийн цэвэрлэгээ", "Хивс угаалга" ] }, emergencyService: true } },
    { name: "Education & training", name_mn: "Боловсрол, сургалт", slug: "education-training", icon: "GraduationCap", color: "text-indigo-500",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Сургалтын төв", "Хувийн багш", "Цэцэрлэг", "Онлайн сургалт" ] },
                 specializations: { label: "Чиглэл", options: [ "Гадаад хэл", "Математик", "Хөгжим", "Програмчлал" ] }, emergencyService: false } },
    { name: "Tourism & hospitality", name_mn: "Аялал жуулчлал", slug: "tourism-hospitality", icon: "Plane", color: "text-sky-500",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Аялалын компани", "Зочид буудал", "Жуулчны бааз", "Тийз" ] },
                 specializations: { label: "Чиглэл", options: [ "Говь", "Хөвсгөл", "Адал явдалт", "Гадаад аялал" ] }, emergencyService: false } },
    { name: "IT & software", name_mn: "Мэдээллийн технологи", slug: "it-software", icon: "Laptop", color: "text-blue-500",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Вэб хөгжүүлэлт", "Программ хангамж", "Сүлжээ", "Компьютер засвар" ] },
                 specializations: { label: "Чиглэл", options: [ "Вэб сайт", "Мобайл апп", "Систем интеграц", "Мэдээллийн аюулгүй байдал" ] }, emergencyService: true } },
    { name: "Finance & insurance", name_mn: "Санхүү, даатгал", slug: "finance-insurance", icon: "DollarSign", color: "text-emerald-600",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Нягтлан бодох", "Аудит", "Даатгал", "Зээл" ] },
                 specializations: { label: "Чиглэл", options: [ "Татвар", "Санхүүгийн тайлан", "Авто даатгал", "Эрүүл мэндийн даатгал" ] }, emergencyService: false } },
    { name: "Legal services", name_mn: "Хууль, өмгөөлөл", slug: "legal-services", icon: "Scale", color: "text-stone-600",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Өмгөөллийн газар", "Нотариат", "Зөвлөх үйлчилгээ" ] },
                 specializations: { label: "Чиглэл", options: [ "Иргэний хэрэг", "Компанийн эрх зүй", "Гэр бүлийн хэрэг" ] }, emergencyService: false } },
    { name: "Delivery & logistics", name_mn: "Тээвэр, хүргэлт", slug: "delivery-logistics", icon: "Truck", color: "text-yellow-600",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Хот доторх хүргэлт", "Орон нутаг", "Олон улс", "Нүүлгэлт" ] },
                 specializations: { label: "Чиглэл", options: [ "Хүнс", "Ачаа тээвэр", "Шуудан" ] }, emergencyService: true } },
    { name: "Events & weddings", name_mn: "Хурим, арга хэмжээ", slug: "events-weddings", icon: "PartyPopper", color: "text-fuchsia-500",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Хурим зохион байгуулалт", "Гэрэл зураг", "Чимэглэл", "Хөгжим" ] },
                 specializations: { label: "Чиглэл", options: [ "Хурим", "Төрсөн өдөр", "Корпорат арга хэмжээ" ] }, emergencyService: false } },
    { name: "Real estate", name_mn: "Үл хөдлөх хөрөнгө", slug: "real-estate", icon: "Building2", color: "text-cyan-600",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Худалдаа", "Түрээс", "Үнэлгээ", "Менежмент" ] },
                 specializations: { label: "Чиглэл", options: [ "Орон сууц", "Оффис", "Газар" ] }, emergencyService: false } },
    { name: "Animals & pets", name_mn: "Амьтан, тэжээвэр", slug: "animals-pets", icon: "PawPrint", color: "text-green-500",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Мал эмнэлэг", "Арчилгаа", "Дэлгүүр", "Зочид буудал" ] },
                 specializations: { label: "Чиглэл", options: [ "Нохой", "Муур", "Бусад амьтад" ] }, emergencyService: true } },
    { name: "Shops & retail", name_mn: "Дэлгүүр, худалдаа", slug: "shops-retail", icon: "ShoppingBag", color: "text-violet-500",
      filters: { serviceTypes: { label: "Төрөл", options: [ "Хүнсний дэлгүүр", "Хувцас", "Цахилгаан бараа", "Барилгын материал" ] },
                 specializations: { label: "Чиглэл", options: [ "Онлайн худалдаа", "Их дэлгүүр", "Мэргэжлийн дэлгүүр" ] }, emergencyService: false } }
  ].each_with_index do |attrs, index|
    category = Category.find_or_initialize_by(slug: attrs[:slug])
    category.assign_attributes(attrs.merge(position: index))
    category.save!
  end
  # "More" was never a category: it was a row that linked back to the same page.
  Category.where(slug: "more").destroy_all

  [
    [ "Мал эмнэлэг", "Амьтан, тэжээвэр" ], [ "Амьтны арчилгаа", "Амьтан, тэжээвэр" ],
    [ "Үс засалт", "Гоо сайхан" ], [ "Арьс арчилгаа", "Гоо сайхан" ],
    [ "Аялал зохион байгуулалт", "Аялал жуулчлал" ], [ "Тийз захиалга", "Аялал жуулчлал" ],
    [ "Вэб хөгжүүлэлт", "Мэдээллийн технологи" ], [ "Мобайл апп", "Мэдээллийн технологи" ],
    [ "Сантехник", "Барилга, засвар" ], [ "Цахилгаан", "Барилга, засвар" ],
    [ "Хот доторх хүргэлт", "Тээвэр, хүргэлт" ]
  ].each { |name, category| ServiceSpecialization.find_or_create_by!(name: name, category: category) }

  companies = [
    { name: "Найрамдал Мал Эмнэлэг", website: "https://nairamdal-vet.mn", facebook_url: "https://facebook.com/nairamdalvet",
      category_label: "Амьтан, тэжээвэр", service_type: "Мал эмнэлэг", specialization: "Мал эмнэлэг",
      location: "Улаанбаатар", district: "Баянзүрх", revenue: "100-500 сая ₮", mobile: "+97699112233",
      email: "sain@nairamdal-vet.mn", registration_number: "6012345",
      description: "Нохой, муурны эмчилгээ, вакцин, 24 цагийн яаралтай тусламж.",
      image: nil, price: 45, emergency_service: true, employees: "11-30", industry: "Мал эмнэлэг" },
    { name: "Гоо Урлан Салон", website: "https://goourlan.mn", facebook_url: "https://facebook.com/goourlan",
      category_label: "Гоо сайхан", service_type: "Гоо сайхны салон", specialization: "Үс засалт",
      location: "Улаанбаатар", district: "Сүхбаатар", revenue: "100-500 сая ₮", mobile: "+97688220044",
      email: "tavtai@goourlan.mn", registration_number: "6023456",
      description: "Үс засалт, будалт, арьс арчилгаа. Урьдчилсан захиалгаар ажиллана.",
      image: nil, price: 60, emergency_service: false, employees: "1-10", industry: "Гоо сайхан" },
    { name: "Говь Аялал Трэвэл", website: "https://gobi-travel.mn", facebook_url: "https://facebook.com/gobitravel",
      category_label: "Аялал жуулчлал", service_type: "Аялалын компани", specialization: "Аялал зохион байгуулалт",
      location: "Улаанбаатар", district: "Чингэлтэй", revenue: "500 сая - 1 тэрбум ₮", mobile: "+97694445566",
      email: "info@gobi-travel.mn", registration_number: "6034567",
      description: "Говь, Хөвсгөл чиглэлийн аялал, гадаад жуулчдын хөтөлбөр.",
      image: nil, price: 120, emergency_service: true, employees: "11-30", industry: "Аялал жуулчлал" },
    { name: "Тэхномон Солюшнс", website: "https://tehnomon.mn", facebook_url: "https://facebook.com/tehnomon",
      category_label: "Мэдээллийн технологи", service_type: "Вэб хөгжүүлэлт", specialization: "Вэб хөгжүүлэлт",
      location: "Улаанбаатар", district: "Хан-Уул", revenue: "500 сая - 1 тэрбум ₮", mobile: "+97695556677",
      email: "hello@tehnomon.mn", registration_number: "6045678",
      description: "Вэб сайт, мобайл апп, системийн интеграц хийдэг баг.",
      image: nil, price: 95, emergency_service: true, employees: "31-50", industry: "Программ хангамж" }
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
    [ "alice@yellowbook.local", "Alice Johnson" ],
    [ "bob@yellowbook.local", "Bob Smith" ],
    [ "carol@yellowbook.local", "Carol White" ],
    [ "david@yellowbook.local", "David Brown" ],
    [ "eve@yellowbook.local", "Eve Davis" ]
  ].to_h do |email, name|
    person = User.find_or_initialize_by(email: email)
    person.assign_attributes(password: "Reviewer#{name.split.first}123!", display_name: name,
                             first_name: name.split.first, last_name: name.split.last,
                             status: "active", role: "user", signup_method: "Email", email_verified_at: Time.current)
    person.save!
    [ email, person ]
  end

  if Review.none?
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
      Review.create!(company: company, user: author, reviewer_name: author.display_name, reviewer_email: author.email,
                     content: content, rating: rating, status: "approved", company_name: company.name,
                     moderated_at: Time.current)
    end
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
