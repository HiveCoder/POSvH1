import { splitVatInclusive } from './tax';

export interface WebsiteMenuItem {
  item: string;
  item_name: string;
  item_image: string | null;
  rate: number;
  course: string;
  course_label?: string;
  description?: string;
  special_dish?: 1 | 0;
  promo_window?: 'breakfast' | 'lunch' | 'merienda' | 'dinner' | 'all_day';
}

export interface WebsiteRoom {
  name: string;
  branch: string;
}

export interface WebsiteTable {
  name: string;
  occupied: number;
  latest_invoice_time: string | null;
  is_take_away: number;
  restaurant_room: string;
  table_shape: 'Circle' | 'Square' | 'Rectangle';
  no_of_seats?: number;
  layout_x?: number;
  layout_y?: number;
  minimum_seating?: number;
}

type WebsiteTablesByRoom = Record<string, WebsiteTable[]>;

const DEMO_TABLES_KEY = 'pos_web_demo_tables';
const DEMO_ORDERS_KEY = 'pos_web_demo_orders';
const DEMO_CUSTOMERS_KEY = 'pos_web_demo_customers';
const MENU_ITEM_OVERRIDES_KEY = 'pos_web_menu_item_overrides';

const FOOD_PHOTOS: Record<string, string> = {
  tomato_soup: '/demo-images/tomato_soup.jpg',
  paneer_tikka: '/demo-images/paneer_tikka.jpg',
  margherita_pizza: '/demo-images/margherita_pizza.jpg',
  veg_biryani: '/demo-images/veg_biryani.jpg',
  cold_coffee: '/demo-images/cold_coffee.jpg',
  gulab_jamun: '/demo-images/gulab_jamun.jpg',
  hara_bhara_kabab: '/demo-images/hara_bhara_kabab.jpg',
  pasta_arrabbiata: '/demo-images/pasta_arrabbiata.jpg',
  mint_lime: '/demo-images/mint_lime.jpg',
  brownie_icecream: '/demo-images/brownie_icecream.jpg',
};

export const WEBSITE_MENU_COURSES = [
  { name: 'soups', label: 'Sabaw' },
  { name: 'starters', label: 'Pampagana' },
  { name: 'salads', label: 'Ensalada' },
  { name: 'breakfast', label: 'Almusal' },
  { name: 'mains', label: 'Ulam' },
  { name: 'lutong_bahay', label: 'Lutong Bahay' },
  { name: 'grills', label: 'Inihaw' },
  { name: 'rice_meals', label: 'Silog at Rice Meals' },
  { name: 'pasta_noodles', label: 'Noodles at Pancit' },
  { name: 'sandwiches', label: 'Meryenda Sandwiches' },
  { name: 'sides', label: 'Sides' },
  { name: 'beverages', label: 'Inumin' },
  { name: 'desserts', label: 'Panghimagas' },
  { name: 'fiesta_packages', label: 'Fiesta Packages' },
  { name: 'toys', label: 'Toys' },
  { name: 'bundles', label: 'Bundles' },
  { name: 'promos', label: 'Promos' },
];

export const WEBSITE_MENU_ITEMS: WebsiteMenuItem[] = [
  {
    item: 'BULALO',
    item_name: 'Bulalo',
    item_image: FOOD_PHOTOS.tomato_soup,
    rate: 320,
    course: 'soups',
    course_label: 'Sabaw',
    description: 'Beef shank soup with corn and pechay.',
    special_dish: 1,
  },
  {
    item: 'SINIGANG_NA_BABOY',
    item_name: 'Sinigang na Baboy',
    item_image: FOOD_PHOTOS.tomato_soup,
    rate: 290,
    course: 'soups',
    course_label: 'Sabaw',
    description: 'Tamarind sour soup with pork and vegetables.',
    special_dish: 1,
  },
  {
    item: 'TINOLANG_MANOK',
    item_name: 'Tinolang Manok',
    item_image: FOOD_PHOTOS.tomato_soup,
    rate: 260,
    course: 'soups',
    course_label: 'Sabaw',
    description: 'Chicken ginger broth with papaya and malunggay.',
    special_dish: 0,
  },
  {
    course: 'starters',
    course_label: 'Pampagana',
    item: 'LUMPIANG_SHANGHAI',
    item_name: 'Lumpiang Shanghai',
    item_image: FOOD_PHOTOS.paneer_tikka,
    rate: 210,
    description: 'Crispy Filipino spring rolls with sweet chili dip.',
    special_dish: 1,
  },
  {
    course: 'starters',
    course_label: 'Pampagana',
    item: 'TOKWA_T_BABOY',
    item_name: 'Tokwa\'t Baboy',
    item_image: FOOD_PHOTOS.hara_bhara_kabab,
    rate: 240,
    description: 'Crispy tofu and pork with soy-vinegar dressing.',
    special_dish: 0,
  },
  {
    item: 'UKOY',
    item_name: 'Ukoy',
    item_image: FOOD_PHOTOS.hara_bhara_kabab,
    rate: 180,
    course: 'starters',
    course_label: 'Pampagana',
    description: 'Shrimp fritters served with spiced vinegar.',
    special_dish: 0,
  },
  {
    item: 'KINILAW_NA_ISDA',
    item_name: 'Kinilaw na Isda',
    item_image: FOOD_PHOTOS.paneer_tikka,
    rate: 320,
    course: 'starters',
    course_label: 'Pampagana',
    description: 'Filipino ceviche style fresh fish with calamansi.',
    special_dish: 1,
  },
  {
    item: 'ENSALADANG_TALONG',
    item_name: 'Ensaladang Talong',
    item_image: FOOD_PHOTOS.mint_lime,
    rate: 150,
    course: 'salads',
    course_label: 'Ensalada',
    description: 'Roasted eggplant salad with onion and tomato.',
    special_dish: 0,
  },
  {
    item: 'MANGGA_KAMATIS_SALAD',
    item_name: 'Mangga at Kamatis Salad',
    item_image: FOOD_PHOTOS.mint_lime,
    rate: 165,
    course: 'salads',
    course_label: 'Ensalada',
    description: 'Green mango and tomato salad with bagoong.',
    special_dish: 0,
  },
  {
    item: 'BANGSILOG',
    item_name: 'Bangsilog',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 245,
    course: 'breakfast',
    course_label: 'Almusal',
    description: 'Boneless bangus with garlic rice and egg.',
    special_dish: 0,
  },
  {
    item: 'TOSILOG',
    item_name: 'Tosilog',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 240,
    course: 'breakfast',
    course_label: 'Almusal',
    description: 'Sweet pork tocino with garlic rice and egg.',
    special_dish: 0,
  },
  {
    item: 'CHAMPORADO_TUYO',
    item_name: 'Champorado at Tuyo',
    item_image: FOOD_PHOTOS.brownie_icecream,
    rate: 165,
    course: 'breakfast',
    course_label: 'Almusal',
    description: 'Chocolate rice porridge with dried fish.',
    special_dish: 0,
  },
  {
    item: 'ADOBONG_MANOK',
    item_name: 'Adobong Manok',
    item_image: FOOD_PHOTOS.margherita_pizza,
    rate: 285,
    course: 'mains',
    course_label: 'Ulam',
    description: 'Classic chicken adobo with soy-vinegar glaze.',
    special_dish: 1,
  },
  {
    item: 'KARE_KARE',
    item_name: 'Kare-Kare',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 355,
    course: 'mains',
    course_label: 'Ulam',
    description: 'Peanut stew with oxtail and vegetables.',
    special_dish: 1,
  },
  {
    item: 'PORK_SISIG',
    item_name: 'Pork Sisig',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 295,
    course: 'mains',
    course_label: 'Ulam',
    description: 'Sizzling chopped pork with calamansi and chili.',
    special_dish: 1,
  },
  {
    item: 'BICOL_EXPRESS',
    item_name: 'Bicol Express',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 305,
    course: 'mains',
    course_label: 'Ulam',
    description: 'Pork and chilies cooked in coconut milk.',
    special_dish: 0,
  },
  {
    item: 'GINATAANG_KALABASA',
    item_name: 'Ginataang Kalabasa',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 240,
    course: 'lutong_bahay',
    course_label: 'Lutong Bahay',
    description: 'Squash and sitaw in coconut milk.',
    special_dish: 0,
  },
  {
    item: 'LAING',
    item_name: 'Laing',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 220,
    course: 'lutong_bahay',
    course_label: 'Lutong Bahay',
    description: 'Dried gabi leaves in creamy coconut milk.',
    special_dish: 0,
  },
  {
    item: 'DINUGUAN',
    item_name: 'Dinuguan',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 255,
    course: 'lutong_bahay',
    course_label: 'Lutong Bahay',
    description: 'Savory pork blood stew with chili and vinegar.',
    special_dish: 0,
  },
  {
    item: 'INIHAW_NA_LIEMPO',
    item_name: 'Inihaw na Liempo',
    item_image: FOOD_PHOTOS.paneer_tikka,
    rate: 320,
    course: 'grills',
    course_label: 'Inihaw',
    description: 'Chargrilled pork belly served with toyomansi.',
    special_dish: 1,
  },
  {
    item: 'INIHAW_NA_PUSIT',
    item_name: 'Inihaw na Pusit',
    item_image: FOOD_PHOTOS.paneer_tikka,
    rate: 360,
    course: 'grills',
    course_label: 'Inihaw',
    description: 'Stuffed squid grilled with savory glaze.',
    special_dish: 1,
  },
  {
    item: 'TAPSILOG',
    item_name: 'Tapsilog',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 255,
    course: 'rice_meals',
    course_label: 'Silog at Rice Meals',
    description: 'Beef tapa with garlic rice and sunny-side egg.',
    special_dish: 0,
  },
  {
    item: 'LONGSILOG',
    item_name: 'Longsilog',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 235,
    course: 'rice_meals',
    course_label: 'Silog at Rice Meals',
    description: 'Longganisa with garlic rice and egg.',
    special_dish: 0,
  },
  {
    item: 'SAGO_GULAMAN',
    item_name: 'Sago\'t Gulaman',
    item_image: FOOD_PHOTOS.cold_coffee,
    rate: 95,
    course: 'beverages',
    course_label: 'Inumin',
    description: 'Classic chilled sago and gulaman drink.',
    special_dish: 0,
  },
  {
    item: 'CALAMANSI_JUICE',
    item_name: 'Fresh Calamansi Juice',
    item_image: FOOD_PHOTOS.cold_coffee,
    rate: 110,
    course: 'beverages',
    course_label: 'Inumin',
    description: 'Freshly squeezed calamansi and honey.',
    special_dish: 0,
  },
  {
    item: 'BUKO_JUICE',
    item_name: 'Buko Juice',
    item_image: FOOD_PHOTOS.mint_lime,
    rate: 120,
    course: 'beverages',
    course_label: 'Inumin',
    description: 'Fresh coconut juice served cold.',
    special_dish: 0,
  },
  {
    item: 'KAPENG_BARAKO',
    item_name: 'Kapeng Barako',
    item_image: FOOD_PHOTOS.gulab_jamun,
    rate: 90,
    course: 'beverages',
    course_label: 'Inumin',
    description: 'Strong Batangas brewed coffee.',
    special_dish: 0,
  },
  {
    item: 'PANCIT_CANTON',
    item_name: 'Pancit Canton',
    item_image: FOOD_PHOTOS.pasta_arrabbiata,
    rate: 245,
    course: 'pasta_noodles',
    course_label: 'Noodles at Pancit',
    description: 'Stir-fried egg noodles with vegetables and meat.',
    special_dish: 0,
  },
  {
    item: 'PANCIT_BIHON',
    item_name: 'Pancit Bihon Guisado',
    item_image: FOOD_PHOTOS.pasta_arrabbiata,
    rate: 230,
    course: 'pasta_noodles',
    course_label: 'Noodles at Pancit',
    description: 'Classic rice noodle stir-fry for sharing.',
    special_dish: 0,
  },
  {
    item: 'PALABOK',
    item_name: 'Pancit Palabok',
    item_image: FOOD_PHOTOS.pasta_arrabbiata,
    rate: 260,
    course: 'pasta_noodles',
    course_label: 'Noodles at Pancit',
    description: 'Rice noodles with shrimp sauce and toppings.',
    special_dish: 1,
  },
  {
    item: 'PANDESAL_ASADO',
    item_name: 'Pandesal Chicken Asado',
    item_image: FOOD_PHOTOS.margherita_pizza,
    rate: 260,
    course: 'sandwiches',
    course_label: 'Meryenda Sandwiches',
    description: 'Soft pandesal filled with sweet-savory chicken asado.',
    special_dish: 0,
  },
  {
    item: 'TUNA_PANDESAL_MELT',
    item_name: 'Tuna Pandesal Melt',
    item_image: FOOD_PHOTOS.margherita_pizza,
    rate: 230,
    course: 'sandwiches',
    course_label: 'Meryenda Sandwiches',
    description: 'Toasted pandesal with tuna and melted cheese.',
    special_dish: 0,
  },
  {
    item: 'GARLIC_RICE',
    item_name: 'Garlic Rice',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 70,
    course: 'sides',
    course_label: 'Sides',
    description: 'Aromatic garlic fried rice.',
    special_dish: 0,
  },
  {
    item: 'ATCHARA',
    item_name: 'Atchara',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 65,
    course: 'sides',
    course_label: 'Sides',
    description: 'Pickled papaya side dish.',
    special_dish: 0,
  },
  {
    item: 'CHICHARON',
    item_name: 'Chicharon',
    item_image: FOOD_PHOTOS.hara_bhara_kabab,
    rate: 140,
    course: 'sides',
    course_label: 'Sides',
    description: 'Crispy pork crackling with spiced vinegar.',
    special_dish: 0,
  },
  {
    item: 'HALO_HALO',
    item_name: 'Halo-Halo Special',
    item_image: FOOD_PHOTOS.mint_lime,
    rate: 185,
    course: 'desserts',
    course_label: 'Panghimagas',
    description: 'Classic Filipino shaved ice dessert.',
    special_dish: 1,
  },
  {
    item: 'BROWNIE_ICECREAM',
    item_name: 'Turon Ala Mode',
    item_image: FOOD_PHOTOS.brownie_icecream,
    rate: 165,
    course: 'desserts',
    course_label: 'Panghimagas',
    description: 'Caramelized banana lumpia with ice cream.',
    special_dish: 1,
  },
  {
    item: 'LECHE_FLAN',
    item_name: 'Leche Flan',
    item_image: FOOD_PHOTOS.gulab_jamun,
    rate: 135,
    course: 'desserts',
    course_label: 'Panghimagas',
    description: 'Rich caramel custard flan.',
    special_dish: 0,
  },
  {
    item: 'UBE_HALAYA',
    item_name: 'Ube Halaya',
    item_image: FOOD_PHOTOS.gulab_jamun,
    rate: 145,
    course: 'desserts',
    course_label: 'Panghimagas',
    description: 'Sweet purple yam jam dessert.',
    special_dish: 0,
  },
  {
    item: 'FIESTA_TRAY_SMALL',
    item_name: 'Fiesta Tray Small',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 1499,
    course: 'fiesta_packages',
    course_label: 'Fiesta Packages',
    description: 'Good for 5-7 pax: 2 ulam + 1 pancit + rice.',
    special_dish: 1,
  },
  {
    item: 'FIESTA_TRAY_MEDIUM',
    item_name: 'Fiesta Tray Medium',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 2499,
    course: 'fiesta_packages',
    course_label: 'Fiesta Packages',
    description: 'Good for 10-12 pax: 3 ulam + 1 pancit + rice.',
    special_dish: 1,
  },
  {
    item: 'FIESTA_TRAY_LARGE',
    item_name: 'Fiesta Tray Large',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 3699,
    course: 'fiesta_packages',
    course_label: 'Fiesta Packages',
    description: 'Good for 15-20 pax: 4 ulam + 2 pancit + rice.',
    special_dish: 1,
  },
  {
    item: 'KID_TOY_CAR',
    item_name: 'Kids Toy Car',
    item_image: FOOD_PHOTOS.mint_lime,
    rate: 180,
    course: 'toys',
    course_label: 'Toys',
    description: 'Mini pull-back car toy for kids meal add-on.',
    special_dish: 0,
  },
  {
    item: 'PLUSH_BEAR_MINI',
    item_name: 'Mini Plush Bear',
    item_image: FOOD_PHOTOS.brownie_icecream,
    rate: 250,
    course: 'toys',
    course_label: 'Toys',
    description: 'Soft mini plush toy collectible.',
    special_dish: 0,
  },
  {
    item: 'PUZZLE_PACK',
    item_name: 'Puzzle Activity Pack',
    item_image: FOOD_PHOTOS.tomato_soup,
    rate: 120,
    course: 'toys',
    course_label: 'Toys',
    description: 'Coloring and puzzle booklet set for kids.',
    special_dish: 0,
  },
  {
    item: 'PAMILYA_FIESTA_BUNDLE',
    item_name: 'Pamilya Fiesta Bundle',
    item_image: FOOD_PHOTOS.margherita_pizza,
    rate: 1299,
    course: 'bundles',
    course_label: 'Bundles',
    description: '2 ulam, 1 pancit, 1 side, at 4 inumin.',
    special_dish: 1,
  },
  {
    item: 'BARKADA_INIHAW_BUNDLE',
    item_name: 'Barkada Inihaw Bundle',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 1699,
    course: 'bundles',
    course_label: 'Bundles',
    description: '2 inihaw, 2 ulam, 2 sides, at 6 inumin.',
    special_dish: 1,
  },
  {
    item: 'SULIT_COUPLE_SET',
    item_name: 'Sulit Couple Set',
    item_image: FOOD_PHOTOS.pasta_arrabbiata,
    rate: 799,
    course: 'bundles',
    course_label: 'Bundles',
    description: '2 ulam, 1 panghimagas, at 2 inumin.',
    special_dish: 0,
  },
  {
    item: 'ALMUSAL_SULIT_PROMO',
    item_name: 'Almusal Sulit Promo',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 189,
    course: 'promos',
    course_label: 'Promos',
    description: 'Available 6:00 AM - 10:30 AM only.',
    special_dish: 1,
    promo_window: 'breakfast',
  },
  {
    item: 'TANGHALI_SULIT_PROMO',
    item_name: 'Tanghali Sulit Promo',
    item_image: FOOD_PHOTOS.veg_biryani,
    rate: 299,
    course: 'promos',
    course_label: 'Promos',
    description: 'Silog meal + inumin sa sulit na tanghali presyo.',
    special_dish: 1,
    promo_window: 'lunch',
  },
  {
    item: 'MERIENDA_PINOY_PROMO',
    item_name: 'Merienda Pinoy Promo',
    item_image: FOOD_PHOTOS.cold_coffee,
    rate: 199,
    course: 'promos',
    course_label: 'Promos',
    description: 'Pandesal combo + inumin for afternoon snack.',
    special_dish: 1,
    promo_window: 'merienda',
  },
  {
    item: 'WEEKEND_HANDAAN_PROMO',
    item_name: 'Weekend Handaan Promo',
    item_image: FOOD_PHOTOS.brownie_icecream,
    rate: 459,
    course: 'promos',
    course_label: 'Promos',
    description: 'Ulam + panghimagas + inumin na may discount.',
    special_dish: 1,
    promo_window: 'dinner',
  },
];

type WebsiteMenuItemOverride = Partial<
  Pick<WebsiteMenuItem, 'item_name' | 'item_image' | 'rate' | 'course' | 'course_label' | 'description' | 'special_dish'>
>;

function getWebsiteMenuItemOverrides(): Record<string, WebsiteMenuItemOverride> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = localStorage.getItem(MENU_ITEM_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function updateWebsiteMenuItemOverride(itemCode: string, override: WebsiteMenuItemOverride) {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedCode = itemCode.toLowerCase();
  const currentOverrides = getWebsiteMenuItemOverrides();
  currentOverrides[normalizedCode] = {
    ...(currentOverrides[normalizedCode] || {}),
    ...override,
  };

  localStorage.setItem(MENU_ITEM_OVERRIDES_KEY, JSON.stringify(currentOverrides));
}

const REAL_FOOD_IMAGE_OVERRIDES: Record<string, string> = {
  adobong_manok: 'https://commons.wikimedia.org/wiki/Special:FilePath/Chicken_Adobo_over_rice.jpg',
  sinigang_na_baboy: 'https://commons.wikimedia.org/wiki/Special:FilePath/Fish_sinigang.jpg',
  pork_sisig: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mushroom_sisig.jpg',
  kare_kare: 'https://commons.wikimedia.org/wiki/Special:FilePath/Kare-karejf.JPG',
  pancit_bihon: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pancit_Bihon_Guisado_Recipe.jpg',
  pancit_canton: 'https://commons.wikimedia.org/wiki/Special:FilePath/Pancit_Canton.jpg',
  palabok: 'https://commons.wikimedia.org/wiki/Special:FilePath/03368jfNagwaling_Diwa_National_Roads_Welcome_Pilar_Bataanfvf_26.JPG',
  lumpiang_shanghai: 'https://commons.wikimedia.org/wiki/Special:FilePath/JfBuffetsinthe9016BaliuagPhilippinesfvf_03.JPG',
  dinuguan: 'https://commons.wikimedia.org/wiki/Special:FilePath/Dinuguan_with_puto.jpg',
  ukoy: 'https://commons.wikimedia.org/wiki/Special:FilePath/Mac_MG_5988.jpg',
  leche_flan: 'https://commons.wikimedia.org/wiki/Special:FilePath/Leche_flan_Filipinas.jpg',
  buko_juice: 'https://commons.wikimedia.org/wiki/Special:FilePath/Young_Coconut_Drink.jpg',
  calamansi_juice: 'https://commons.wikimedia.org/wiki/Special:FilePath/Calamansi_juice_(Filipino_lemonade).jpg',
  pandesal_asado: 'https://commons.wikimedia.org/wiki/Special:FilePath/Fresh_baked_Pandesal.jpg',
  tapsilog: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tapsilog_in_saudi_arabia.jpg',
  longsilog: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tapsilog_in_saudi_arabia.jpg',
  tosilog: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tapsilog_in_saudi_arabia.jpg',
  bangsilog: 'https://commons.wikimedia.org/wiki/Special:FilePath/Tapsilog_in_saudi_arabia.jpg',
  laing: 'https://commons.wikimedia.org/wiki/Special:FilePath/Laing_Tinulmok.jpg',
};

const getLocalItemImage = (itemCode: string) => {
  const normalizedItemCode = itemCode.toLowerCase();
  return REAL_FOOD_IMAGE_OVERRIDES[normalizedItemCode] ?? `/demo-images/filipino/${normalizedItemCode}.jpg`;
};

function isPromoWindowActive(window: WebsiteMenuItem['promo_window'], hour: number) {
  if (!window || window === 'all_day') return true;
  if (window === 'breakfast') return hour >= 6 && hour < 11;
  if (window === 'lunch') return hour >= 11 && hour < 15;
  if (window === 'merienda') return hour >= 15 && hour < 18;
  if (window === 'dinner') return hour >= 18 && hour < 23;
  return true;
}

export function getWebsiteMenuItems(): WebsiteMenuItem[] {
  const hourNow = new Date().getHours();
  const itemOverrides = getWebsiteMenuItemOverrides();

  return WEBSITE_MENU_ITEMS
    .filter((item) => (item.course !== 'promos' ? true : isPromoWindowActive(item.promo_window, hourNow)))
    .map((item) => {
      const override = itemOverrides[item.item.toLowerCase()] || {};
      const overriddenImage = typeof override.item_image === 'string' ? override.item_image.trim() : '';

      return {
        ...item,
        ...override,
        item_image: overriddenImage || getLocalItemImage(item.item),
      };
    });
}

export const WEBSITE_PAYMENT_MODES = ['Cash', 'Card', 'UPI'];
export const WEBSITE_AGGREGATORS = [
  { customer: 'Zomato' },
  { customer: 'Swiggy' },
  { customer: 'Uber Eats' },
];

export function getWebsiteRooms(branch: string): WebsiteRoom[] {
  return [
    { name: 'Main Hall', branch },
    { name: 'Family Room', branch },
  ];
}

function defaultTables(room: string): WebsiteTable[] {
  return Array.from({ length: 12 }).map((_, index) => ({
    name: `T${index + 1}`,
    occupied: 0,
    latest_invoice_time: null,
    is_take_away: 0,
    restaurant_room: room,
    table_shape: index % 3 === 0 ? 'Circle' : index % 3 === 1 ? 'Square' : 'Rectangle',
    no_of_seats: 2 + (index % 4),
    layout_x: 100 + (index % 4) * 160,
    layout_y: 100 + Math.floor(index / 4) * 140,
    minimum_seating: 1,
  }));
}

function getAllWebsiteTables(): WebsiteTablesByRoom {
  const raw = localStorage.getItem(DEMO_TABLES_KEY);
  return raw ? (JSON.parse(raw) as WebsiteTablesByRoom) : {};
}

function setAllWebsiteTables(allTables: WebsiteTablesByRoom) {
  localStorage.setItem(DEMO_TABLES_KEY, JSON.stringify(allTables));
}

export function getWebsiteTables(room: string): WebsiteTable[] {
  const all = getAllWebsiteTables();

  if (!all[room]) {
    all[room] = defaultTables(room);
    setAllWebsiteTables(all);
  }

  return all[room];
}

export function updateWebsiteTable(room: string, tableName: string, changes: Partial<WebsiteTable>) {
  const all = getAllWebsiteTables();
  const tables = all[room] || defaultTables(room);

  const updated = tables.map((table) =>
    table.name === tableName ? { ...table, ...changes } : table
  );

  all[room] = updated;
  setAllWebsiteTables(all);
}

export function addWebsiteTable(room: string, payload: { name: string; no_of_seats?: number; table_shape?: WebsiteTable['table_shape'] }) {
  const trimmedName = payload.name.trim();
  if (!trimmedName) {
    throw new Error('Table name is required');
  }

  const all = getAllWebsiteTables();
  const tables = all[room] || defaultTables(room);
  const exists = tables.some((table) => table.name.toLowerCase() === trimmedName.toLowerCase());

  if (exists) {
    throw new Error('A table with this name already exists');
  }

  const created: WebsiteTable = {
    name: trimmedName,
    occupied: 0,
    latest_invoice_time: null,
    is_take_away: 0,
    restaurant_room: room,
    table_shape: payload.table_shape || 'Rectangle',
    no_of_seats: payload.no_of_seats || 4,
    minimum_seating: 1,
    layout_x: 120,
    layout_y: 120,
  };

  all[room] = [...tables, created];
  setAllWebsiteTables(all);
  return created;
}

export function renameWebsiteTable(room: string, oldName: string, newName: string) {
  const trimmedNewName = newName.trim();
  if (!trimmedNewName) {
    throw new Error('New table name is required');
  }

  const all = getAllWebsiteTables();
  const tables = all[room] || defaultTables(room);
  const hasConflict = tables.some(
    (table) => table.name.toLowerCase() === trimmedNewName.toLowerCase() && table.name !== oldName
  );

  if (hasConflict) {
    throw new Error('A table with this name already exists');
  }

  const target = tables.find((table) => table.name === oldName);
  if (!target) {
    throw new Error('Table not found');
  }

  all[room] = tables.map((table) =>
    table.name === oldName ? { ...table, name: trimmedNewName } : table
  );
  setAllWebsiteTables(all);

  const orders = getWebsiteOrders();
  const updatedOrders = orders.map((order) => {
    if (order.restaurant_table === oldName && order.custom_restaurant_room === room) {
      return { ...order, restaurant_table: trimmedNewName };
    }
    return order;
  });
  localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(updatedOrders));
}

export function deleteWebsiteTable(room: string, tableName: string) {
  const all = getAllWebsiteTables();
  const tables = all[room] || defaultTables(room);
  const existing = tables.find((table) => table.name === tableName);

  if (!existing) {
    throw new Error('Table not found');
  }

  if (existing.occupied === 1) {
    throw new Error('Cannot delete an occupied table');
  }

  all[room] = tables.filter((table) => table.name !== tableName);
  setAllWebsiteTables(all);
}

export function saveWebsiteOrder(order: any) {
  const raw = localStorage.getItem(DEMO_ORDERS_KEY);
  const orders = raw ? (JSON.parse(raw) as any[]) : [];
  orders.unshift(order);
  localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
}

export function updateWebsiteOrder(orderId: string, updates: Record<string, unknown>) {
  const raw = localStorage.getItem(DEMO_ORDERS_KEY);
  const orders = raw ? (JSON.parse(raw) as any[]) : [];
  const updated = orders.map((order) => (order.name === orderId ? { ...order, ...updates } : order));
  localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(updated));
  return updated.find((order) => order.name === orderId);
}

export function resetWebsiteOrders() {
  localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify([]));
}

export function getWebsiteOrder(orderId: string) {
  const orders = getWebsiteOrders();
  return orders.find((order) => order.name === orderId) || null;
}

function normalizeWebsiteOrderTax(order: any) {
  const gross = Number(order?.grand_total ?? order?.rounded_total ?? 0) || 0;
  const hasTax = typeof order?.total_taxes_and_charges === 'number' && order.total_taxes_and_charges > 0;
  const hasNet = typeof order?.net_total === 'number' && order.net_total > 0;

  if (hasTax && hasNet) {
    return order;
  }

  const split = splitVatInclusive(gross);
  return {
    ...order,
    net_total: split.vatableSales,
    total_taxes_and_charges: split.vatAmount,
    custom_vat_rate: split.vatRate,
  };
}

export function getWebsiteOrders(): any[] {
  const raw = localStorage.getItem(DEMO_ORDERS_KEY);
  if (raw) {
    const parsed = JSON.parse(raw) as any[];
    const normalized = parsed.map(normalizeWebsiteOrderTax);
    localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(normalized));
    return normalized;
  }

  const now = new Date();
  const toDate = (minsAgo: number) => new Date(now.getTime() - minsAgo * 60000);
  const mkOrder = (
    id: string,
    status: 'Draft' | 'Unbilled' | 'Recently Paid' | 'Paid' | 'Consolidated' | 'Return',
    customer: string,
    table: string | null,
    items: Array<{ code: string; qty: number }>,
    minsAgo: number
  ) => {
    const posting = toDate(minsAgo);
    const lines = items.map((line, idx) => {
      const menu = WEBSITE_MENU_ITEMS.find((m) => m.item === line.code)!;
      return {
        name: `${id}-ITEM-${idx + 1}`,
        item_code: menu.item,
        item_name: menu.item_name,
        description: menu.description || '',
        item_group: menu.course,
        image: menu.item_image || '',
        qty: line.qty,
        comment: '',
        rate: menu.rate,
        amount: menu.rate * line.qty,
        discount_percentage: 0,
        discount_amount: 0,
      };
    });

    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    const split = splitVatInclusive(total);
    return {
      name: id,
      invoice_printed: status === 'Draft' ? 0 : 1,
      grand_total: total,
      rounded_total: Math.round(total),
      restaurant_table: table,
      cashier: 'Website Cashier',
      waiter: 'Web Waiter',
      net_total: split.vatableSales,
      total_taxes_and_charges: split.vatAmount,
      custom_vat_rate: split.vatRate,
      customer,
      mobile_number: '',
      status,
      posting_date: posting.toISOString().slice(0, 10),
      posting_time: posting.toTimeString().slice(0, 8),
      order_type: table ? 'Dine In' : 'Take Away',
      items: lines,
      payment_breakup:
        status === 'Paid' || status === 'Recently Paid'
          ? [{ mode_of_payment: 'Cash', amount: Math.round(total) }]
          : [],
      cancel_reason: status === 'Return' ? 'Customer changed mind' : null,
    };
  };

  const seed = [
    mkOrder('WEB-INV-1004', 'Paid', 'Aarav Sharma', 'T3', [
      { code: 'PORK_SISIG', qty: 1 },
      { code: 'CALAMANSI_JUICE', qty: 2 },
    ], 50),
    mkOrder('WEB-INV-1003', 'Return', 'Walk-in Customer', null, [
      { code: 'PALABOK', qty: 1 },
    ], 90),
    mkOrder('WEB-INV-1002', 'Recently Paid', 'Sara Ali', 'T7', [
      { code: 'BICOL_EXPRESS', qty: 2 },
      { code: 'LECHE_FLAN', qty: 1 },
    ], 140),
    mkOrder('WEB-INV-1001', 'Draft', 'Walk-in Customer', null, [
      { code: 'SINIGANG_NA_BABOY', qty: 1 },
      { code: 'SAGO_GULAMAN', qty: 1 },
    ], 210),
  ];

  localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(seed));
  return seed;
}

export function getWebsiteCustomers() {
  const raw = localStorage.getItem(DEMO_CUSTOMERS_KEY);
  if (raw) {
    return JSON.parse(raw) as Array<{ name: string; customer_name: string; mobile_number: string }>;
  }

  const seed = [
    { name: 'CUST-1001', customer_name: 'Walk-in Customer', mobile_number: '09170000001' },
    { name: 'CUST-1002', customer_name: 'Aarav Sharma', mobile_number: '09170000002' },
    { name: 'CUST-1003', customer_name: 'Sara Ali', mobile_number: '09170000003' },
    { name: 'CUST-1004', customer_name: 'Miguel Santos', mobile_number: '09170000004' },
  ];
  localStorage.setItem(DEMO_CUSTOMERS_KEY, JSON.stringify(seed));
  return seed;
}

export function addWebsiteCustomer(customer: { customer_name: string; mobile_number: string }) {
  const existing = getWebsiteCustomers();
  const created = {
    name: `CUST-${Date.now()}`,
    customer_name: customer.customer_name,
    mobile_number: customer.mobile_number,
  };
  existing.unshift(created);
  localStorage.setItem(DEMO_CUSTOMERS_KEY, JSON.stringify(existing));
  return created;
}
