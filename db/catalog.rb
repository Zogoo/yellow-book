# The catalogue every environment shares: the categories Mongolians actually
# shop for, and the service specialisations that hang off them. Demo companies
# and reviews live in `db/seeds.rb` and never reach production.
module Catalog
  module_function

  CATEGORIES = [
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
                   specializations: { label: "Чиглэл", options: [ "Онлайн худалдаа", "Их дэлгүүр", "Мэргэжлийн дэлгүүр" ] }, emergencyService: false } },
      # Large employers (mining, manufacturing, media, corporate offices) had nowhere to live.
      { name: "Industry & energy", name_mn: "Үйлдвэр, эрчим хүч", slug: "industry-energy", icon: "Factory", color: "text-yellow-700",
        filters: { serviceTypes: { label: "Төрөл", options: [ "Уул уурхай", "Үйлдвэр", "Хүнсний үйлдвэр", "Эрчим хүч", "Групп компани" ] },
                   emergencyService: false } },
      { name: "Media & entertainment", name_mn: "Хэвлэл мэдээлэл, энтертайнмент", slug: "media-entertainment", icon: "Clapperboard", color: "text-purple-500",
        filters: { serviceTypes: { label: "Төрөл", options: [ "Телевиз", "Хэвлэл мэдээлэл", "Кино театр", "Караоке, клуб" ] },
                   emergencyService: false } },
      { name: "Business services", name_mn: "Бизнесийн үйлчилгээ", slug: "business-services", icon: "Briefcase", color: "text-cyan-700",
        filters: { serviceTypes: { label: "Төрөл", options: [ "Компани", "Мэргэжлийн үйлчилгээ", "Бизнесийн үйлчилгээ", "Нийлүүлэгч" ] },
                   emergencyService: false } }
  ].freeze

  SPECIALIZATIONS = [
      [ "Мал эмнэлэг", "Амьтан, тэжээвэр" ], [ "Амьтны арчилгаа", "Амьтан, тэжээвэр" ],
      [ "Үс засалт", "Гоо сайхан" ], [ "Арьс арчилгаа", "Гоо сайхан" ],
      [ "Аялал зохион байгуулалт", "Аялал жуулчлал" ], [ "Тийз захиалга", "Аялал жуулчлал" ],
      [ "Вэб хөгжүүлэлт", "Мэдээллийн технологи" ], [ "Мобайл апп", "Мэдээллийн технологи" ],
      [ "Сантехник", "Барилга, засвар" ], [ "Цахилгаан", "Барилга, засвар" ],
      [ "Хот доторх хүргэлт", "Тээвэр, хүргэлт" ]
  ].freeze

  # Idempotent: safe on every boot. Position comes from the order above, so
  # reordering this list reorders the grid on the next deploy.
  def apply!
    CATEGORIES.each_with_index do |attrs, index|
      category = Category.find_or_initialize_by(slug: attrs[:slug])
      category.assign_attributes(attrs.merge(position: index))
      category.save!
    end
    # "More" was never a category: it was a row that linked back to the same page.
    Category.where(slug: "more").destroy_all

    SPECIALIZATIONS.each do |name, category|
      ServiceSpecialization.find_or_create_by!(name: name, category: category)
    end
  end
end
