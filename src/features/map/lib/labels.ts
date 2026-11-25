import type { StatsWindow, TimePreset } from './types'

/**
 * Bảng ánh xạ đầy đủ result_type, address type và các category từ Geoapify Place Details / Geocoding API
 * sang nhãn tiếng Việt hiển thị trên badge địa điểm.
 */
export const LOCATION_TYPE_LABELS: Record<string, string> = {
  // 1. Geoapify result_type & Address granularity levels
  premise: 'Khuôn viên / Cơ sở',
  amenity: 'Tiện ích / Điểm dịch vụ',
  building: 'Toà nhà',
  street: 'Đường phố',
  neighbourhood: 'Khu dân cư',
  quarter: 'Khu phố',
  suburb: 'Khu vực / Phường',
  district: 'Quận / Huyện',
  ward: 'Phường / Xã',
  postcode: 'Mã bưu chính',
  city: 'Thành phố',
  town: 'Thị xã / Thị trấn',
  village: 'Làng / Xã',
  hamlet: 'Thôn / Xóm',
  locality: 'Khu vực địa phương',
  county: 'Huyện / Quận',
  state: 'Tỉnh / Thành phố',
  province: 'Tỉnh',
  region: 'Vùng / Miền',
  country: 'Quốc gia',
  island: 'Đảo',
  archipelago: 'Quần đảo',
  unknown: 'Địa điểm',

  // 2. Nhóm category chính của Geoapify Place Details API
  catering: 'Ẩm thực & Đồ uống',
  commercial: 'Mua sắm & Thương mại',
  entertainment: 'Giải trí & Văn hoá',
  education: 'Giáo dục',
  healthcare: 'Y tế & Sức khoẻ',
  accommodation: 'Lưu trú',
  tourism: 'Du lịch & Tham quan',
  leisure: 'Thư giãn & Công viên',
  sport: 'Thể thao',
  service: 'Dịch vụ',
  natural: 'Thiên nhiên',
  administrative: 'Hành chính',
  office: 'Văn phòng & Công sở',
  public_transport: 'Giao thông công cộng',
  highway: 'Tuyến đường',
  parking: 'Bãi đỗ xe',
  man_made: 'Công trình',
  heritage: 'Di sản',
  religion: 'Tôn giáo & Tín ngưỡng',
  pet: 'Thú cưng',
  camping: 'Cắm trại',
  beach: 'Bãi biển',
  airport: 'Sân bay',
  national_park: 'Vườn quốc gia',
  populated_place: 'Khu dân cư',
  residential: 'Khu nhà ở',
  industrial: 'Khu công nghiệp',
  production: 'Cơ sở sản xuất',
  rental: 'Cho thuê',
  activity: 'Hoạt động cộng đồng',
  ski: 'Thể thao mùa đông',
  political: 'Đơn vị hành chính',
  postal_code: 'Khu vực bưu chính',

  // 3. Các sub-category chi tiết phổ biến của Geoapify Place Details API
  'catering.restaurant': 'Nhà hàng',
  'catering.cafe': 'Quán cà phê',
  'catering.fast_food': 'Đồ ăn nhanh',
  'catering.bar': 'Quán bar',
  'catering.pub': 'Quán rượu / Pub',
  'catering.ice_cream': 'Quán kem',
  'catering.bakery': 'Tiệm bánh',
  'catering.food_court': 'Khu ẩm thực',
  'catering.biergarten': 'Vườn bia',
  'catering.taproom': 'Quán bia thủ công',

  'commercial.supermarket': 'Siêu thị',
  'commercial.shopping_mall': 'Trung tâm thương mại',
  'commercial.marketplace': 'Chợ / Khu chợ',
  'commercial.clothing': 'Cửa hàng thời trang',
  'commercial.convenience': 'Cửa hàng tiện lợi',
  'commercial.department_store': 'Trung tâm bách hoá',
  'commercial.books': 'Hiệu sách',
  'commercial.electronics': 'Cửa hàng điện tử',
  'commercial.gift_and_souvenir': 'Quà lưu niệm',
  'commercial.jewelry': 'Trang sức',
  'commercial.chemist': 'Hiệu thuốc / Mỹ phẩm',
  'commercial.florist': 'Cửa hàng hoa',
  'commercial.food_and_drink': 'Cửa hàng thực phẩm',
  'commercial.health_and_beauty': 'Chăm sóc sắc đẹp',
  'commercial.houseware_and_hardware': 'Gia dụng & Kim khí',
  'commercial.pet': 'Cửa hàng thú cưng',
  'commercial.toys_and_games': 'Đồ chơi',
  'commercial.vehicle': 'Showroom / Xe cộ',
  'commercial.gas': 'Trạm xăng',

  'education.school': 'Trường học',
  'education.university': 'Trường đại học',
  'education.college': 'Trường cao đẳng',
  'education.kindergarten': 'Trường mầm non',
  'education.library': 'Thư viện',
  'education.driving_school': 'Trung tâm dạy lái xe',
  'education.language_school': 'Trung tâm ngoại ngữ',
  'education.music_school': 'Trường nhạc',

  'healthcare.hospital': 'Bệnh viện',
  'healthcare.pharmacy': 'Nhà thuốc',
  'healthcare.clinic_or_praxis': 'Phòng khám',
  'healthcare.dentist': 'Nha khoa',
  'healthcare.veterinary': 'Thú y',

  'accommodation.hotel': 'Khách sạn',
  'accommodation.motel': 'Nhà nghỉ',
  'accommodation.hostel': 'Nhà trọ / Hostel',
  'accommodation.guest_house': 'Nhà khách / Homestay',
  'accommodation.apartment': 'Căn hộ dịch vụ',
  'accommodation.chalet': 'Khu nghỉ dưỡng',

  'entertainment.cinema': 'Rạp chiếu phim',
  'entertainment.theatre': 'Nhà hát',
  'entertainment.museum': 'Bảo tàng',
  'entertainment.culture': 'Trung tâm văn hoá',
  'entertainment.nightclub': 'Câu lạc bộ đêm',
  'entertainment.theme_park': 'Công viên giải trí',
  'entertainment.zoo': 'Sở thú',
  'entertainment.aquarium': 'Thủy cung',
  'entertainment.bowling_alley': 'Sân bowling',
  'entertainment.water_park': 'Công viên nước',
  'entertainment.escape_game': 'Trò chơi giải đố',

  'tourism.attraction': 'Điểm tham quan',
  'tourism.sights': 'Danh thắng',
  'tourism.viewpoint': 'Điểm ngắm cảnh',
  'tourism.information': 'Thông tin du lịch',
  'tourism.artwork': 'Công trình nghệ thuật',

  'leisure.park': 'Công viên',
  'leisure.playground': 'Sân chơi',
  'leisure.garden': 'Vườn hoa / Vườn cảnh',
  'leisure.picnic': 'Điểm dã ngoại',
  'leisure.spa': 'Spa & Thư giãn',
  'leisure.fitness': 'Phòng tập thể hình',

  'sport.stadium': 'Sân vận động',
  'sport.sports_centre': 'Trung tâm thể thao',
  'sport.swimming_pool': 'Hồ bơi',
  'sport.pitch': 'Sân thể thao',
  'sport.fitness': 'Phòng gym',
  'sport.golf': 'Sân golf',
  'sport.tennis': 'Sân tennis',

  'service.financial': 'Dịch vụ tài chính',
  'service.bank': 'Ngân hàng',
  'service.atm': 'Cây ATM',
  'service.post': 'Bưu điện',
  'service.police': 'Công an / Đồn cảnh sát',
  'service.fire_station': 'Trạm cứu hỏa',
  'service.vehicle': 'Dịch vụ xe / Sửa xe',
  'service.travel_agency': 'Đại lý du lịch',
  'service.beauty': 'Salon làm đẹp',

  'natural.water': 'Hồ / Sông ngòi',
  'natural.forest': 'Rừng cây',
  'natural.mountain': 'Núi đồi',
  'natural.sand': 'Bãi cát',
  'natural.protected_area': 'Khu bảo tồn',

  'public_transport.train': 'Ga tàu hỏa',
  'public_transport.subway': 'Ga tàu điện ngầm',
  'public_transport.bus': 'Trạm / Bến xe buýt',
  'public_transport.tram': 'Trạm tàu điện',
  'public_transport.ferry': 'Bến phà',

  'building.residential': 'Toà nhà dân cư',
  'building.commercial': 'Toà nhà thương mại',
  'building.university': 'Toà nhà đại học',
  'building.school': 'Toà nhà trường học',
  'building.hospital': 'Toà nhà bệnh viện',
  'building.hotel': 'Toà nhà khách sạn',
  'building.office': 'Toà nhà văn phòng',
  'building.industrial': 'Nhà xưởng công nghiệp',
  'building.historic': 'Công trình lịch sử',
  'building.place_of_worship': 'Cơ sở tôn giáo',
  'building.sports': 'Nhà thi đấu thể thao',
  'building.tourism': 'Công trình du lịch',
  'building.transportation': 'Nhà ga / Bến xe',

  'populated_place.city': 'Thành phố',
  'populated_place.town': 'Thị xã / Thị trấn',
  'populated_place.village': 'Làng / Xã',
  'populated_place.hamlet': 'Thôn / Xóm',
  'populated_place.suburb': 'Khu vực / Phường',
  'populated_place.neighbourhood': 'Khu dân cư',
  'populated_place.quarter': 'Khu phố',
  'populated_place.district': 'Quận / Huyện',
  'populated_place.province': 'Tỉnh',
  'populated_place.county': 'Huyện / Quận',
  'populated_place.municipality': 'Đô thị',
  'populated_place.borough': 'Quận nội thành',
  'populated_place.city_block': 'Khu phố / Lô phố',

  'office.company': 'Công ty',
  'office.government': 'Cơ quan nhà nước',
  'office.coworking': 'Không gian làm việc chung',
  'office.diplomatic': 'Cơ quan ngoại giao',
  'office.it': 'Công ty công nghệ',
  'office.educational_institution': 'Tổ chức giáo dục',

  'heritage.unesco': 'Di sản UNESCO',
  'religion.place_of_worship': 'Nơi thờ tự',
  'parking.cars': 'Bãi đỗ ô tô',
  'parking.motorcycle': 'Bãi gửi xe máy',
  'parking.bicycle': 'Bãi đỗ xe đạp',

  // 4. Các tên viết gọn phổ biến (mock hoặc viết tắt)
  university: 'Trường đại học',
  college: 'Trường cao đẳng',
  school: 'Trường học',
  kindergarten: 'Trường mầm non',
  library: 'Thư viện',
  cafe: 'Quán cà phê',
  restaurant: 'Nhà hàng',
  bakery: 'Tiệm bánh',
  bar: 'Quán bar',
  pub: 'Quán pub',
  fast_food: 'Đồ ăn nhanh',
  park: 'Công viên',
  garden: 'Vườn hoa',
  playground: 'Sân chơi',
  mall: 'Trung tâm thương mại',
  shopping_mall: 'Trung tâm thương mại',
  supermarket: 'Siêu thị',
  convenience: 'Cửa hàng tiện lợi',
  marketplace: 'Chợ',
  hospital: 'Bệnh viện',
  clinic: 'Phòng khám',
  pharmacy: 'Nhà thuốc',
  stadium: 'Sân vận động',
  gym: 'Phòng tập gym',
  fitness_centre: 'Trung tâm thể hình',
  lake: 'Hồ nước',
  landmark: 'Địa danh',
  attraction: 'Điểm tham quan',
  museum: 'Bảo tàng',
  cinema: 'Rạp chiếu phim',
  theatre: 'Nhà hát',
  hotel: 'Khách sạn',
  hostel: 'Nhà nghỉ / Hostel',
  apartment: 'Chung cư / Căn hộ',
  company: 'Công ty',
  coworking: 'Coworking space',
  bank: 'Ngân hàng',
  atm: 'Cây ATM',
  post_office: 'Bưu điện',
  transit: 'Bến xe / Ga tàu',
  bus_station: 'Bến xe buýt',
  train_station: 'Nhà ga',
  subway_station: 'Ga tàu điện',
  temple: 'Đền / Chùa',
  pagoda: 'Chùa',
  church: 'Nhà thờ',
  mosque: 'Nhà thờ Hồi giáo',
}

/**
 * Định dạng kiểu địa điểm (Geoapify result_type / category) thành nhãn tiếng Việt thân thiện.
 * Tự động chuẩn hoá chữ hoa/gạch ngang và fallback theo nhóm cha nếu là sub-category sâu.
 */
export function formatLocationType(type: string): string {
  const normalized = type.toLowerCase().trim().replace(/[\s-]+/g, '_')
  if (!normalized) return 'Địa điểm'

  if (LOCATION_TYPE_LABELS[normalized]) {
    return LOCATION_TYPE_LABELS[normalized]
  }

  // Fallback cho category phân cấp nhiều tầng của Geoapify (vd: catering.restaurant.vietnamese)
  if (normalized.includes('.')) {
    const parts = normalized.split('.')
    for (let len = parts.length - 1; len >= 1; len--) {
      const candidate = parts.slice(0, len).join('.')
      if (LOCATION_TYPE_LABELS[candidate]) {
        return LOCATION_TYPE_LABELS[candidate]
      }
    }
  }

  return type
}

export const STATS_WINDOW_LABELS: Record<StatsWindow, string> = {
  '1d': 'Hôm nay',
  '7d': '7 ngày',
  '30d': '30 ngày',
}

export const TIME_PRESET_LABELS: Record<TimePreset, string> = {
  '3h': '3 giờ qua',
  '1d': '1 ngày trước',
  '7d': '7 ngày qua',
  '30d': '30 ngày qua',
}
