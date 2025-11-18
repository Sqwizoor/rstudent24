import {
  Wifi,
  Waves,
  Dumbbell,
  Car,
  PawPrint,
  Tv,
  Thermometer,
  Cigarette,
  Cable,
  Maximize,
  Bath,
  Phone,
  Sprout,
  Hammer,
  Bus,
  Mountain,
  VolumeX,
  Home,
  Warehouse,
  Building,
  Castle,
  Trees,
  Shield,
  Camera,
  Coffee,
  Gamepad2,
  Monitor,
  Library,
  Flame,
  Fan as FanIcon,
  CookingPot as StoveIcon,
  Fingerprint,
  BedDouble,
  Droplet,
  BatteryCharging,
  Refrigerator as RefrigeratorIcon,
  Moon,
  LucideIcon,
} from "lucide-react";

export enum AmenityEnum {
  WasherDryer = "WasherDryer",
  AirConditioning = "AirConditioning",
  Dishwasher = "Dishwasher",
  HighSpeedInternet = "HighSpeedInternet",
  HardwoodFloors = "HardwoodFloors",
  WalkInClosets = "WalkInClosets",
  Microwave = "Microwave",
  Refrigerator = "Refrigerator",
  Pool = "Pool",
  Gym = "Gym",
  Parking = "Parking",
  PetsAllowed = "PetsAllowed",
  WiFi = "WiFi",
  OnSiteSecurity = "OnSiteSecurity",
  TransportToCampus = "TransportToCampus",
  OutdoorChillArea = "OutdoorChillArea",
  SecurityCameras = "SecurityCameras",
  Cafe = "Cafe",
  LaundryFacilities = "LaundryFacilities",
  GamesRoom = "GamesRoom",
  TVRoom = "TVRoom",
  ComputerRoom = "ComputerRoom",
  StudyLabs = "StudyLabs",
  Heater = "Heater",
  Fan = "Fan",
  Stove = "Stove",
  Oven = "Oven",
  BiometricAccess = "BiometricAccess",
}

export const AmenityIcons: Record<AmenityEnum, LucideIcon> = {
  WasherDryer: Waves,
  AirConditioning: Thermometer,
  Dishwasher: Waves,
  HighSpeedInternet: Wifi,
  HardwoodFloors: Home,
  WalkInClosets: Maximize,
  Microwave: Tv,
  Refrigerator: Thermometer,
  Pool: Waves,
  Gym: Dumbbell,
  Parking: Car,
  PetsAllowed: PawPrint,
  WiFi: Wifi,
  OnSiteSecurity: Shield,
  TransportToCampus: Bus,
  OutdoorChillArea: Trees,
  SecurityCameras: Camera,
  Cafe: Coffee,
  LaundryFacilities: Waves,
  GamesRoom: Gamepad2,
  TVRoom: Tv,
  ComputerRoom: Monitor,
  StudyLabs: Library,
  Heater: Flame,
  Fan: FanIcon,
  Stove: StoveIcon,
  Oven: StoveIcon,
  BiometricAccess: Fingerprint,
};

export enum HighlightEnum {
  HighSpeedInternetAccess = "HighSpeedInternetAccess",
  WasherDryer = "WasherDryer",
  AirConditioning = "AirConditioning",
  Heating = "Heating",
  SmokeFree = "SmokeFree",
  CableReady = "CableReady",
  SatelliteTV = "SatelliteTV",
  DoubleVanities = "DoubleVanities",
  TubShower = "TubShower",
  Intercom = "Intercom",
  SprinklerSystem = "SprinklerSystem",
  RecentlyRenovated = "RecentlyRenovated",
  CloseToTransit = "CloseToTransit",
  GreatView = "GreatView",
  QuietNeighborhood = "QuietNeighborhood",
  BedroomCleaning = "BedroomCleaning",
  BackupWater = "BackupWater",
  BackupElectricity = "BackupElectricity",
  Refrigerator = "Refrigerator",
  SwimmingPool = "SwimmingPool",
  SleepoversAllowed = "SleepoversAllowed",
}

export const HighlightIcons: Record<HighlightEnum, LucideIcon> = {
  HighSpeedInternetAccess: Wifi,
  WasherDryer: Waves,
  AirConditioning: Thermometer,
  Heating: Thermometer,
  SmokeFree: Cigarette,
  CableReady: Cable,
  SatelliteTV: Tv,
  DoubleVanities: Bath,
  TubShower: Bath,
  Intercom: Phone,
  SprinklerSystem: Sprout,
  RecentlyRenovated: Hammer,
  CloseToTransit: Bus,
  GreatView: Mountain,
  QuietNeighborhood: VolumeX,
  BedroomCleaning: BedDouble,
  BackupWater: Droplet,
  BackupElectricity: BatteryCharging,
  Refrigerator: RefrigeratorIcon,
  SwimmingPool: Waves,
  SleepoversAllowed: Moon,
};


export enum PropertyTypeEnum {
  Rooms = "Rooms",
  Tinyhouse = "Tinyhouse",
  Apartment = "Apartment",
  Villa = "Villa",
  Townhouse = "Townhouse",
  Cottage = "Cottage",
}

export const PropertyTypeIcons: Record<PropertyTypeEnum, LucideIcon> = {
  Rooms: Home,
  Tinyhouse: Warehouse,
  Apartment: Building,
  Villa: Castle,
  Townhouse: Home,
  Cottage: Trees,
};

// Add this constant at the end of the file
export const NAVBAR_HEIGHT = 70; // in pixels

// Test users for development
export const testUsers = {
  tenant: {
    username: "Carol White",
    userId: "us-east-2:76543210-90ab-cdef-1234-567890abcdef",
    signInDetails: {
      loginId: "carol.white@example.com",
      authFlowType: "USER_SRP_AUTH",
    },
  },
  tenantRole: "tenant",
  manager: {
    username: "John Smith",
    userId: "us-east-2:12345678-90ab-cdef-1234-567890abcdef",
    signInDetails: {
      loginId: "john.smith@example.com",
      authFlowType: "USER_SRP_AUTH",
    },
  },
  managerRole: "manager",
};


// Add these to your lib/constants.ts file

// Room type enum
export enum RoomTypeEnum {
  PRIVATE = "PRIVATE",
  SHARED = "SHARED",
  ENTIRE_UNIT = "ENTIRE_UNIT",
}

// Redirect type enum for room applications
export enum RedirectTypeEnum {
  NONE = "NONE",
  WHATSAPP = "WHATSAPP",
  CUSTOM_LINK = "CUSTOM_LINK",
  BOTH = "BOTH",
}

// Room amenities enum
export enum RoomAmenityEnum {
  PRIVATE_BATHROOM = "PRIVATE_BATHROOM",
  PRIVATE_KITCHENETTE = "PRIVATE_KITCHENETTE", 
  TELEVISION = "TELEVISION",
  AIR_CONDITIONING = "AIR_CONDITIONING",
  HEATING = "HEATING",
  WARDROBE = "WARDROBE",
  DESK = "DESK",
  CHAIR = "CHAIR",
  SOFA = "SOFA",
  COFFEE_TABLE = "COFFEE_TABLE",
  MICROWAVE = "MICROWAVE",
  REFRIGERATOR = "REFRIGERATOR",
  BALCONY = "BALCONY",
  ETHERNET = "ETHERNET",
}

// Room features enum
export enum RoomFeatureEnum {
  ENSUITE = "ENSUITE",
  LARGE_WINDOWS = "LARGE_WINDOWS",
  CORNER_ROOM = "CORNER_ROOM",
  QUIET = "QUIET",
  SCENIC_VIEW = "SCENIC_VIEW",
  GROUND_FLOOR = "GROUND_FLOOR",
  TOP_FLOOR = "TOP_FLOOR",
  ACCESSIBLE = "ACCESSIBLE",
  NEWLY_RENOVATED = "NEWLY_RENOVATED",
  KING_BED = "KING_BED",
  QUEEN_BED = "QUEEN_BED",
  TWIN_BEDS = "TWIN_BEDS",
  WORKSPACE = "WORKSPACE",
  NATURAL_LIGHT = "NATURAL_LIGHT",
}

// University enum for closest universities selection
export enum UniversityEnum {
  UCT = "University of Cape Town",
  WITS = "University of the Witwatersrand", 
  UJ = "University of Johannesburg",
  UKZN = "University of KwaZulu-Natal",
  UWC = "University of the Western Cape",
  UP = "University of Pretoria",
  SU = "Stellenbosch University",
  CPUT = "Cape Peninsula University of Technology",
  TUT = "Tshwane University of Technology",
  UNISA = "University of South Africa",
  NWU = "North-West University",
  UFS = "University of the Free State",
  UFH = "University of Fort Hare",
  RU = "Rhodes University",
  WSU = "Walter Sisulu University",
  UL = "University of Limpopo",
  UZ = "University of Zululand",
  CUT = "Central University of Technology",
  MUT = "Mangosuthu University of Technology",
  SPU = "Sol Plaatje University"
}

// Array of university options for easy use in forms
export const UNIVERSITY_OPTIONS = Object.entries(UniversityEnum).map(([key, value]) => ({
  value: key,
  label: value
}));


// Provinces of South Africa
export const PROVINCES = [
  "Western Cape",
  "Eastern Cape",
  "Northern Cape",
  "Free State",
  "KwaZulu-Natal",
  "North West",
  "Gauteng",
  "Limpopo",
  "Mpumalanga",
] as const;

// Map provinces to universities (by enum key) for filtering
export const PROVINCE_UNIVERSITY_KEYS: Record<(typeof PROVINCES)[number], Array<keyof typeof UniversityEnum>> = {
  "Western Cape": ["UCT", "SU", "UWC", "CPUT"],
  "Eastern Cape": ["UFH", "RU", "WSU"],
  "Northern Cape": ["SPU"],
  "Free State": ["UFS", "CUT"],
  "KwaZulu-Natal": ["UKZN", "UZ", "MUT"],
  "North West": ["NWU"],
  "Gauteng": ["WITS", "UJ", "UP", "UNISA", "TUT"],
  "Limpopo": ["UL"],
  "Mpumalanga": [], // No listed universities in current enum
};

export const getUniversityOptionsByProvince = (province?: string) => {
  const keys = province && province in PROVINCE_UNIVERSITY_KEYS
    ? PROVINCE_UNIVERSITY_KEYS[province as (typeof PROVINCES)[number]]
    : null;
  if (!keys) return UNIVERSITY_OPTIONS;
  return keys.map((k) => ({ value: k as string, label: UniversityEnum[k] }));
};


// --- BEGIN FILE: @/lib/constants.ts ---




// This is a duplicate HighlightEnum declaration - removing it to avoid conflicts

// Campus list derived from provided CSV attachment
export type Campus = {
  campusID: number;
  campusName: string;
  universityID: keyof typeof UniversityEnum | string;
  websiteLabel: string;
};

export const CAMPUSES: Campus[] = [
  { campusID: 1, campusName: 'APK Campus', universityID: 'UJ', websiteLabel: 'Close to UJ (APK Campus)' },
  { campusID: 2, campusName: 'APB Campus', universityID: 'UJ', websiteLabel: 'Close to UJ (APB Campus)' },
  { campusID: 3, campusName: 'Soweto Campus', universityID: 'UJ', websiteLabel: 'Close to UJ (Soweto Campus)' },
  { campusID: 4, campusName: 'Doornfontein Campus', universityID: 'UJ', websiteLabel: 'Close to UJ (Doornfontein Campus)' },
  { campusID: 5, campusName: 'Upper Campus', universityID: 'UCT', websiteLabel: 'Close to UCT (Upper Campus)' },
  { campusID: 6, campusName: 'Middle Campus', universityID: 'UCT', websiteLabel: 'Close to UCT (Middle Campus)' },
  { campusID: 7, campusName: 'Lower Campus', universityID: 'UCT', websiteLabel: 'Close to UCT (Lower Campus)' },
  { campusID: 8, campusName: 'Health Sciences Campus', universityID: 'UCT', websiteLabel: 'Close to UCT (Health Sciences Campus)' },
  { campusID: 9, campusName: 'Groote Schuur Campus', universityID: 'UCT', websiteLabel: 'Close to UCT (Groote Schuur Campus)' },
  { campusID: 10, campusName: 'Hiddingh Campus', universityID: 'UCT', websiteLabel: 'Close to UCT (Hiddingh Campus)' },
  { campusID: 11, campusName: 'Breakwater Campus', universityID: 'UCT', websiteLabel: 'Close to UCT (Breakwater Campus)' },
  { campusID: 12, campusName: 'Vanderbijlpark Campus', universityID: 'NWU', websiteLabel: 'Close to NWU (Vanderbijlpark Campus)' },
  { campusID: 13, campusName: 'Potchefstroom Campus', universityID: 'NWU', websiteLabel: 'Close to NWU (Potchefstroom Campus)' },
  { campusID: 14, campusName: 'Mahikeng Campus', universityID: 'NWU', websiteLabel: 'Close to NWU (Mahikeng Campus)' },
  { campusID: 15, campusName: 'Hatfield Campus', universityID: 'UP', websiteLabel: 'Close to UP (Hatfield Campus)' },
  { campusID: 16, campusName: 'Hillcrest Campus', universityID: 'UP', websiteLabel: 'Close to UP (Hillcrest Campus)' },
  { campusID: 17, campusName: 'Groenkloof Campus', universityID: 'UP', websiteLabel: 'Close to UP (Groenkloof Campus)' },
  { campusID: 18, campusName: 'Prinshof Campus', universityID: 'UP', websiteLabel: 'Close to UP (Prinshof Campus)' },
  { campusID: 19, campusName: 'Onderstepoort Campus', universityID: 'UP', websiteLabel: 'Close to UP (Onderstepoort Campus)' },
  { campusID: 20, campusName: 'Mamelodi Campus', universityID: 'UP', websiteLabel: 'Close to UP (Mamelodi Campus)' },
  { campusID: 21, campusName: 'Gordon Institute of Business Science', universityID: 'UP', websiteLabel: 'Close to UP (Gordon Institute of Business Science)' },
  { campusID: 22, campusName: 'Braamfontein Campus', universityID: 'WITS', websiteLabel: 'Close to WITS (Braamfontein Campus)' },
  { campusID: 23, campusName: 'Parktown Campus', universityID: 'WITS', websiteLabel: 'Close to WITS (Parktown Campus)' },
  { campusID: 26, campusName: 'South Campus', universityID: 'UFS', websiteLabel: 'Close to UFS (South Campus)' },
  { campusID: 27, campusName: 'Qwaqwa Campus', universityID: 'UFS', websiteLabel: 'Close to UFS (Qwaqwa Campus)' },
  { campusID: 28, campusName: 'Bloemfontein Campus', universityID: 'UFS', websiteLabel: 'Close to UFS (Bloemfontein Campus)' },
  { campusID: 29, campusName: 'Edgewood Campus', universityID: 'UKZN', websiteLabel: 'Close to UKZN (Edgewood Campus)' },
  { campusID: 30, campusName: 'Howard College', universityID: 'UKZN', websiteLabel: 'Close to UKZN (Howard College)' },
  { campusID: 31, campusName: 'Medical School', universityID: 'UKZN', websiteLabel: 'Close to UKZN (Medical School)' },
  { campusID: 32, campusName: 'PMB Campus', universityID: 'UKZN', websiteLabel: 'Close to UKZN (PMB Campus)' },
  { campusID: 33, campusName: 'Westville Campus', universityID: 'UKZN', websiteLabel: 'Close to UKZN (Westville Campus)' },
  { campusID: 34, campusName: 'Steve Biko Campus', universityID: 'DUT', websiteLabel: 'Close to DUT (Steve Biko Campus)' },
  { campusID: 35, campusName: 'Brickfield Campus', universityID: 'DUT', websiteLabel: 'Close to DUT (Brickfield Campus)' },
  { campusID: 36, campusName: 'Ritson Campus', universityID: 'DUT', websiteLabel: 'Close to DUT (Ritson Campus)' },
  { campusID: 37, campusName: 'City Campus', universityID: 'DUT', websiteLabel: 'Close to DUT (City Campus)' },
  { campusID: 38, campusName: 'Riverside Campus', universityID: 'DUT', websiteLabel: 'Close to DUT (Riverside Campus)' },
  { campusID: 39, campusName: 'Indumiso Campus', universityID: 'DUT', websiteLabel: 'Close to DUT (Indumiso Campus)' },
  { campusID: 40, campusName: 'Bellville Campus', universityID: 'CPUT', websiteLabel: 'Close to CPUT (Bellville Campus)' },
  { campusID: 41, campusName: 'District Six Campus', universityID: 'CPUT', websiteLabel: 'Close to CPUT (District Six Campus)' },
  { campusID: 42, campusName: 'Granger Bay Campus', universityID: 'CPUT', websiteLabel: 'Close to CPUT (Granger Bay Campus)' },
  { campusID: 43, campusName: 'Mowbray Campus', universityID: 'CPUT', websiteLabel: 'Close to CPUT (Mowbray Campus)' },
  { campusID: 44, campusName: 'Wellington Campus', universityID: 'CPUT', websiteLabel: 'Close to CPUT (Wellington Campus)' },
  { campusID: 45, campusName: 'Turfloop Campus', universityID: 'UL', websiteLabel: 'Close to UL (Turfloop Campus)' },
  { campusID: 46, campusName: 'Main Campus', universityID: 'UNIVEN', websiteLabel: 'Close to UNIVEN (Main Campus)' },
  { campusID: 47, campusName: 'Kwadlangezwa Campus', universityID: 'UNIZULU', websiteLabel: 'Close to UNIZULU (Kwadlangezwa Campus)' },
  { campusID: 48, campusName: 'Richards Bay Campus', universityID: 'UNIZULU', websiteLabel: 'Close to UNIZULU (Richards Bay Campus)' },
  { campusID: 49, campusName: 'Main Campus', universityID: 'SU', websiteLabel: 'Close to SU (Main Campus)' },
  { campusID: 50, campusName: 'Tygerberg Campus', universityID: 'SU', websiteLabel: 'Close to SU (Tygerberg Campus)' },
  { campusID: 51, campusName: 'Bellville Park Campus', universityID: 'SU', websiteLabel: 'Close to SU (Bellville Park Campus)' },
  { campusID: 72, campusName: 'Muckleneuk Campus', universityID: 'UNISA', websiteLabel: 'Close to UNISA (Muckleneuk Campus)' },
  { campusID: 73, campusName: 'Science Campus', universityID: 'UNISA', websiteLabel: 'Close to UNISA (Science Campus)' },
  { campusID: 74, campusName: 'Sunnyside Campus', universityID: 'UNISA', websiteLabel: 'Close to UNISA (Sunnyside Campus)' },
  { campusID: 75, campusName: 'Main Campus', universityID: 'UWC', websiteLabel: 'Close to UWC (Main Campus)' },
  { campusID: 76, campusName: 'CHS Bellville Campus', universityID: 'UWC', websiteLabel: 'Close to UWC (CHS Bellville Campus)' },
  { campusID: 78, campusName: 'Bird Street Campus', universityID: 'NMU', websiteLabel: 'Close to NMU (Bird Street Campus)' },
  { campusID: 79, campusName: 'George Campus', universityID: 'NMU', websiteLabel: 'Close to NMU (George Campus)' },
  { campusID: 80, campusName: 'North Campus', universityID: 'NMU', websiteLabel: 'Close to NMU (North Campus)' },
  { campusID: 81, campusName: 'South Campus', universityID: 'NMU', websiteLabel: 'Close to NMU (South Campus)' },
  { campusID: 82, campusName: '2nd Avenue Campus', universityID: 'NMU', websiteLabel: 'Close to NMU (2nd Avenue Campus)' },
  { campusID: 83, campusName: 'Missionvale Campus', universityID: 'NMU', websiteLabel: 'Close to NMU (Missionvale Campus)' },
  { campusID: 84, campusName: 'Ocean Sciences Campus', universityID: 'NMU', websiteLabel: 'Close to NMU (Ocean Sciences Campus)' },
  { campusID: 85, campusName: 'Mbombela Campus', universityID: 'UMP', websiteLabel: 'Close to UMP (Mbombela Campus)' },
  { campusID: 86, campusName: 'Siyabuswa Campus', universityID: 'UMP', websiteLabel: 'Close to UMP (Siyabuswa Campus)' },
  { campusID: 87, campusName: 'Arcadia Campus', universityID: 'TUT', websiteLabel: 'Close to TUT (Arcadia Campus)' },
  { campusID: 88, campusName: 'Arts Campus', universityID: 'TUT', websiteLabel: 'Close to TUT (Arts Campus)' },
  { campusID: 89, campusName: 'eMalahleni Campus', universityID: 'TUT', websiteLabel: 'Close to TUT (eMalahleni Campus)' },
  { campusID: 90, campusName: 'Ga-Rankuwa Campus', universityID: 'TUT', websiteLabel: 'Close to TUT (Ga-Rankuwa Campus)' },
  { campusID: 91, campusName: 'Mbombela Campus', universityID: 'TUT', websiteLabel: 'Close to TUT (Mbombela Campus)' },
  { campusID: 92, campusName: 'Soshanguve South Campus', universityID: 'TUT', websiteLabel: 'Close to TUT (Soshanguve South Campus)' },
  { campusID: 93, campusName: 'Soshanguve North Campus', universityID: 'TUT', websiteLabel: 'Close to TUT (Soshanguve North Campus)' },
  { campusID: 94, campusName: 'Polokwane Campus', universityID: 'TUT', websiteLabel: 'Close to TUT (Polokwane Campus)' },
  { campusID: 95, campusName: 'Pretoria Campus', universityID: 'TUT', websiteLabel: 'Close to TUT (Pretoria Campus)' },
  { campusID: 96, campusName: 'Main Campus', universityID: 'RU', websiteLabel: 'Close to RU (Main Campus)' },
  { campusID: 97, campusName: 'Secunda Campus', universityID: 'VUT', websiteLabel: 'Close to VUT (Secunda Campus)' },
  { campusID: 98, campusName: 'Upington Campus', universityID: 'VUT', websiteLabel: 'Close to VUT (Upington Campus)' },
  { campusID: 99, campusName: 'Ekurhuleni Campus', universityID: 'VUT', websiteLabel: 'Close to VUT (Ekurhuleni Campus)' },
  { campusID: 100, campusName: 'Main Campus', universityID: 'MUT', websiteLabel: 'Close to MUT (Main Campus)' },
  { campusID: 101, campusName: 'City Campus', universityID: 'MUT', websiteLabel: 'Close to MUT (City Campus)' },
  { campusID: 102, campusName: 'Butterworth Campus', universityID: 'WSU', websiteLabel: 'Close to WSU (Butterworth Campus)' },
  { campusID: 103, campusName: 'Komani Campus', universityID: 'WSU', websiteLabel: 'Close to WSU (Komani Campus)' },
  { campusID: 104, campusName: 'Mthatha Main Campus', universityID: 'WSU', websiteLabel: 'Close to WSU (Mthatha Main Campus)' },
  { campusID: 105, campusName: 'Buffalo City Campus', universityID: 'WSU', websiteLabel: 'Close to WSU (Buffalo City Campus)' },
  { campusID: 106, campusName: 'Bloemfontein Campus', universityID: 'CUT', websiteLabel: 'Close to CUT (Bloemfontein Campus)' },
  { campusID: 107, campusName: 'Welkom Campus', universityID: 'CUT', websiteLabel: 'Close to CUT (Welkom Campus)' },
  { campusID: 108, campusName: 'Alice Main Campus', universityID: 'UFH', websiteLabel: 'Close to UFH (Alice Main Campus)' },
  { campusID: 109, campusName: 'Bhisho Campus', universityID: 'UFH', websiteLabel: 'Close to UFH (Bhisho Campus)' },
  { campusID: 110, campusName: 'East London Campus', universityID: 'UFH', websiteLabel: 'Close to UFH (East London Campus)' },
  { campusID: 111, campusName: 'Main Campus', universityID: 'SMU', websiteLabel: 'Close to SMU (Main Campus)' },
  { campusID: 112, campusName: 'Central Campus', universityID: 'SPU', websiteLabel: 'Close to SPU (Central Campus)' },
  { campusID: 113, campusName: 'North Campus', universityID: 'SPU', websiteLabel: 'Close to SPU (North Campus)' },
  { campusID: 114, campusName: 'ML Sultan Campus', universityID: 'DUT', websiteLabel: 'Close to DUT (ML Sultan Campus)' },
];

export const CAMPUS_OPTIONS = CAMPUSES.map(c => ({ value: String(c.campusID), label: c.websiteLabel }));

export const getCampusOptionsByUniversity = (universityKey?: keyof typeof UniversityEnum | string) => {
  if (!universityKey) return CAMPUS_OPTIONS;
  return CAMPUSES.filter(c => c.universityID === universityKey).map(c => ({ value: String(c.campusID), label: c.websiteLabel }));
};

// Expanded province -> university keys used for campus filtering.
// Includes universities present in CAMPUSES even if not listed in UniversityEnum.
export const PROVINCE_UNIVERSITY_KEYS_EXPANDED: Record<(typeof PROVINCES)[number], string[]> = {
  "Western Cape": ["UCT", "SU", "UWC", "CPUT"],
  "Eastern Cape": ["UFH", "RU", "WSU", "NMU"],
  "Northern Cape": ["SPU", "VUT"],
  "Free State": ["UFS", "CUT"],
  "KwaZulu-Natal": ["UKZN", "UZ", "UNIZULU", "DUT", "MUT"],
  "North West": ["NWU"],
  "Gauteng": ["WITS", "UJ", "UP", "UNISA", "TUT", "VUT", "SMU"],
  "Limpopo": ["UL", "UNIVEN"],
  "Mpumalanga": ["UMP", "VUT"],
};

// Helper: get campus options by selected province, using expanded mapping
export const getCampusOptionsByProvince = (province?: (typeof PROVINCES)[number]) => {
  if (!province) return CAMPUS_OPTIONS;
  const uniKeys = PROVINCE_UNIVERSITY_KEYS_EXPANDED[province] || [];
  return CAMPUSES
    .filter(c => uniKeys.includes(String(c.universityID)))
    .map(c => ({ value: String(c.campusID), label: c.websiteLabel }));
};

// Helper: convert campus ID to readable campus name
export const getCampusLabelById = (campusId: string | number): string => {
  const campus = CAMPUSES.find(c => c.campusID === Number(campusId));
  return campus ? campus.websiteLabel : `Campus ${campusId}`;
};

// Helper: convert array of campus IDs to readable campus names
export const getCampusLabelsByIds = (campusIds: (string | number)[]): string[] => {
  return campusIds.map(id => getCampusLabelById(id));
};

