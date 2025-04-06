"use client";

export const ADJECTIVES = [
  "Spacious",
  "Cozy",
  "Luxurious",
  "Modern",
  "Elegant",
  "Rustic",
  "Charming",
  "Inviting",
  "Quaint",
  "Expansive",
  "Stylish",
  "Sophisticated",
  "Contemporary",
  "Secluded",
  "Grand",
  "Minimalist",
  "Vintage",
  "Picturesque",
  "Idyllic",
  "Unique"
];

export enum Location {
  DOWNTOWN = "Downtown",
  URBAN = "Urban",
  SUBURBAN = "Suburban",
  COUNTRY = "Country"
}

export enum PropertyType {
  HOUSE = "House",
  APARTMENT = "Apartment",
  COMMERCIAL = "Commercial",
  INDUSTRIAL = "Industrial",
  LAND = "Land",
  MIXED_USE = "Mixed Use",
  VACATION = "Vacation",
  CONDO = "Condo",
  TOWNHOUSE = "Townhouse",
  VILLA = "Villa",
  BUNGALOW = "Bungalow",
  MANSION = "Mansion",
  COTTAGE = "Cottage",
  DUPLEX = "Duplex",
  FARMHOUSE = "Farmhouse",
  CHALET = "Chalet",
  CABIN = "Cabin",
  TINY_HOME = "Tiny Home",
  ROW_HOUSE = "Row House",
  MOBILE_HOME = "Mobile Home",
  COLONIAL_HOUSE = "Colonial House",
  RANCH_HOUSE = "Ranch House",
  SKYSCRAPER_CONDO = "Skyscraper Condo",
  HOUSEBOAT = "Houseboat"
}

export enum NeighborhoodQuality {
  EXCELLENT = "Excellent",
  GOOD = "Good",
  AVERAGE = "Average",
  BELOW_AVERAGE = "Below Average",
  POOR = "Poor"
}

export enum ViewQuality {
  SCENIC = "Scenic",
  WATER = "Water",
  CITY = "City",
  MOUNTAIN = "Mountain",
  GARDEN = "Garden",
  NONE = "None"
}

export interface Amenities {
  schools: number; // 0-5 rating
  parks: number; // 0-5 rating
  shopping: number; // 0-5 rating
  transportation: number; // 0-5 rating
  healthcare: number; // 0-5 rating
}

export interface SpecialFeatures {
  swimmingPool: boolean;
  garden: boolean;
  rooftopTerrace: boolean;
  balcony: boolean;
  fireplace: boolean;
  homeOffice: boolean;
  garage: boolean;
  outdoorSpaces: boolean;
  smartHome: boolean;
  securitySystem: boolean;
}

export interface EconomicIndicators {
  unemploymentRate: number; // percentage
  jobGrowth: number; // percentage
  population: number;
  medianIncome: number;
}

export enum RenovationPotential {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
  NONE = "None"
}

export interface MarketTrends {
  historicalAppreciation: number; // Percentage per year
  propertySupply: number; // Number of similar properties on market
  averageDaysOnMarket: number;
  seasonality: number; // Multiplier based on current season (0.9-1.1)
}

export enum Occupation {
  DOCTOR = "Doctor",
  LAWYER = "Lawyer",
  TEACHER = "Teacher",
  ENGINEER = "Engineer",
  RETAIL_WORKER = "Retail Worker",
  OFFICE_WORKER = "Office Worker",
  MANAGER = "Manager",
  BUSINESS_OWNER = "Business Owner",
  SERVICE_WORKER = "Service Worker",
  FREELANCER = "Freelancer",
  STUDENT = "Student",
  RETIRED = "Retired",
  UNEMPLOYED = "Unemployed"
}

export interface TenantHistory {
  evictions: number;
  previousLandlordReviews:
    | "Excellent"
    | "Good"
    | "Average"
    | "Poor"
    | "Unknown";
  yearsOfRentalHistory: number;
  timesMovedLastFiveYears: number;
}

export interface Tenant {
  id: string;
  name: string;
  occupation: Occupation;
  monthlyIncome: number;
  creditScore: number;
  familySize: number;
  pets: boolean;
  smoker: boolean;
  rentalHistory: TenantHistory;
  leaseStart?: Date;
  leaseLength: number; // Display/initial lease term in months
  plannedStayDuration: number; // Actual planned duration in months
  hasNotifiedDeparture: boolean; // Whether they've given notice
  rentAmount: number;
  isPaying: boolean;
  paymentProbability: number; // Internal value to determine rent payment reliability
  propertyCareProbability: number; // Internal value to determine how well they maintain the property
  references: "Excellent" | "Good" | "Average" | "Poor" | "None";
}

export interface LeaseApplication {
  tenant: Tenant;
  desiredLeaseLength: number;
  applicationDate: Date;
  applicationFee: number;
}

export interface TenantEvent {
  type:
    | "RENT_PAID"
    | "RENT_LATE"
    | "RENT_MISSED"
    | "DAMAGE"
    | "LEASE_BREAK"
    | "COMPLAINT"
    | "RENEWAL";
  date: Date;
  description: string;
  financialImpact: number; // Positive for rent, negative for repairs
  propertyImpact?: number; // Negative for property damage (renovation percentage)
}

export interface Property {
  id: number;
  address: string;
  value: number;
  type: PropertyType;
  description: string;
  adjective: string;
  buildingDate: Date;
  maintenance: string;
  marketPrice: number;
  renovationBonusPercentage: number; // 0-100 %
  size: number; // in square meters
  rooms: number | null; // null for properties like land that don't have rooms
  location: Location;
  owner: string | null; // Currently Player or not
  timeOnMarket: number; // in days
  maintenanceCosts: number; // monthly, by size
  intendedPurpose: "Housing" | "Business";
  rentPrice: number; // monthly
  isRented: boolean;
  rentee: string | null; // null if not rented
  neighborhoodQuality: NeighborhoodQuality;
  amenities: Amenities;
  specialFeatures: SpecialFeatures;
  viewQuality: ViewQuality;
  lotSize?: number; // For houses, in square meters
  renovationPotential: RenovationPotential;
  marketTrends: MarketTrends;
  economicIndicators: EconomicIndicators;
  listedDate: Date; // When the property was listed on the market
  isNew: boolean; // Flag to highlight new properties
  purchaseDate?: Date; // Added to track when player bought the property
  currentTenant?: Tenant;
  tenantHistory: Tenant[];
  tenantEvents: TenantEvent[];
  leaseApplications: LeaseApplication[];
  leaseStart?: Date; // When the lease started
  leaseLength?: number; // Display/initial lease term in months
  propertyTax: number; // Monthly property tax
}

export enum EventSeverity {
  MINOR = "Minor",
  MAJOR = "Major"
}

export enum EventCategory {
  ECONOMIC = "Economic",
  SOCIAL = "Social",
  POLITICAL = "Political",
  ENVIRONMENTAL = "Environmental",
  TECHNOLOGICAL = "Technological"
}

export enum EventImpactType {
  INTEREST_RATE = "Interest Rate",
  LOAN_APPROVAL = "Loan Approval",
  MAX_LOAN_AMOUNT = "Max Loan Amount",
  TENANT_QUALITY = "Tenant Quality",
  PROPERTY_VALUE = "Property Value",
  AREA_QUALITY = "Area Quality",
  RENOVATION_COST = "Renovation Cost",
  MAINTENANCE_COST = "Maintenance Cost",
  PROPERTY_TAX = "Property Tax"
}

export interface EventImpact {
  type: EventImpactType;
  value: number; // Multiplier or direct change value
  affectedAreas?: Location[]; // Optional - can target specific areas
  affectedPropertyTypes?: PropertyType[]; // Optional - can target specific property types
}

export interface EventChoice {
  id: string;
  description: string;
  impacts: EventImpact[];
  requiredMoney?: number; // Optional - if choice requires money
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  detailedDescription?: string;
  severity: EventSeverity;
  category: EventCategory;
  duration: number; // In months
  probability: number; // 0-1, chance of occurring in a given check
  impacts: EventImpact[];
  choices?: EventChoice[]; // Optional - only for events with choices
  relatedEvents?: string[]; // IDs of events that might trigger as a result
  imageUrl?: string; // Optional image to show in the event modal
  startDate?: Date; // When the event started
  endDate?: Date; // When the event will end
  isActive?: boolean; // Whether the event is currently active
  selectedChoice?: string; // ID of the selected choice if any
}
