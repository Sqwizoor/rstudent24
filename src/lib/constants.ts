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


// --- BEGIN FILE: @/lib/constants.ts ---




// This is a duplicate HighlightEnum declaration - removing it to avoid conflicts

