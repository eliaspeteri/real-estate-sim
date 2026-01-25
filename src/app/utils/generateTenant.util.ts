import { LeaseApplication, ListingKeyword, Occupation, Tenant } from "../types";
import { v4 as uuidv4 } from "uuid";

// Generate a random name for a tenant
const generateRandomName = (): string => {
  const firstNames = [
    "James",
    "Robert",
    "John",
    "Michael",
    "David",
    "William",
    "Richard",
    "Joseph",
    "Thomas",
    "Charles",
    "Mary",
    "Patricia",
    "Jennifer",
    "Linda",
    "Elizabeth",
    "Barbara",
    "Susan",
    "Jessica",
    "Sarah",
    "Karen"
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Miller",
    "Davis",
    "Garcia",
    "Rodriguez",
    "Wilson",
    "Martinez",
    "Anderson",
    "Taylor",
    "Thomas",
    "Hernandez",
    "Moore",
    "Martin",
    "Jackson",
    "Thompson",
    "White"
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

// Calculate probability of various tenant events
export const calculateTenantEventProbability = (
  tenant: Tenant,
  eventType:
    | "RENT_PAID"
    | "RENT_LATE"
    | "RENT_MISSED"
    | "DAMAGE"
    | "LEASE_BREAK"
    | "COMPLAINT"
): number => {
  // Base probabilities
  const baseProbabilities = {
    RENT_PAID: tenant.paymentProbability,
    RENT_LATE: 0.1,
    RENT_MISSED: 0.05,
    DAMAGE: 0.03,
    LEASE_BREAK: 0.02,
    COMPLAINT: 0.04
  };

  // For rent payment reliability
  if (eventType === "RENT_PAID") {
    return baseProbabilities.RENT_PAID;
  }

  // For property damage risk
  if (eventType === "DAMAGE") {
    let damageProb = baseProbabilities.DAMAGE;

    // Adjust based on tenant factors
    if (tenant.pets) damageProb *= 1.5;
    if (tenant.familySize > 2) damageProb *= 1.2;
    if (tenant.propertyCareProbability < 0.7) damageProb *= 1.5;

    return Math.min(0.2, damageProb); // Cap at 20%
  }

  // For lease break probability
  if (eventType === "LEASE_BREAK") {
    let breakProb = baseProbabilities.LEASE_BREAK;

    // Adjust based on factors
    if (tenant.rentalHistory.timesMovedLastFiveYears > 3) {
      breakProb *= 1.5;
    }

    return Math.min(0.15, breakProb); // Cap at 15%
  }

  return baseProbabilities[eventType] || 0;
};

const LISTING_KEYWORD_IMPACTS: Record<
  ListingKeyword,
  { quality: number; count: number }
> = {
  luxury: { quality: 0.15, count: -0.05 },
  budget: { quality: -0.1, count: 0.2 },
  family: { quality: 0.02, count: 0.1 },
  pet_friendly: { quality: -0.02, count: 0.08 },
  quiet: { quality: 0.05, count: -0.05 },
  transit: { quality: 0.04, count: 0.08 },
  modern: { quality: 0.06, count: 0.02 },
  flexible_lease: { quality: -0.05, count: 0.12 }
};

export const calculateListingImpact = (
  listingKeywords: ListingKeyword[] = []
): { quality: number; count: number } => {
  return listingKeywords.reduce(
    (acc, keyword) => {
      const impact = LISTING_KEYWORD_IMPACTS[keyword];
      return {
        quality: acc.quality + impact.quality,
        count: acc.count + impact.count
      };
    },
    { quality: 0, count: 0 }
  );
};

export const extractListingKeywords = (
  listingCopy: string = ""
): ListingKeyword[] => {
  const copy = listingCopy.toLowerCase();
  const keywords: ListingKeyword[] = [];

  if (/(luxury|premium|high[- ]?end|exclusive)/.test(copy)) {
    keywords.push("luxury");
  }
  if (/(budget|affordable|low cost|cheap)/.test(copy)) {
    keywords.push("budget");
  }
  if (/(family|kids|schools|playground)/.test(copy)) {
    keywords.push("family");
  }
  if (/(pet|pets|pet-friendly|pet friendly)/.test(copy)) {
    keywords.push("pet_friendly");
  }
  if (/(quiet|peaceful|calm|no noise)/.test(copy)) {
    keywords.push("quiet");
  }
  if (/(transit|metro|subway|train|bus)/.test(copy)) {
    keywords.push("transit");
  }
  if (/(modern|new|renovated|updated)/.test(copy)) {
    keywords.push("modern");
  }
  if (/(flexible|short-term|short term|month-to-month)/.test(copy)) {
    keywords.push("flexible_lease");
  }

  return keywords;
};

const applyListingPreferences = (
  tenant: Tenant,
  listingKeywords: ListingKeyword[] = []
): Tenant => {
  if (listingKeywords.length === 0) return tenant;

  const keywordSet = new Set(listingKeywords);

  if (keywordSet.has("pet_friendly")) {
    tenant.pets = Math.random() < 0.85;
  }

  if (keywordSet.has("family")) {
    tenant.familySize = Math.max(
      tenant.familySize,
      3 + Math.floor(Math.random() * 3)
    );
  }

  if (keywordSet.has("quiet")) {
    tenant.smoker = Math.random() < 0.1;
    tenant.familySize = Math.min(tenant.familySize, 2);
  }

  return tenant;
};

// Generate a random tenant based on rental price
export const generateRandomTenant = (rentPrice: number): Tenant => {
  const occupations = Object.values(Occupation);
  const occupation =
    occupations[Math.floor(Math.random() * occupations.length)];

  // Base income multiplier based on occupation
  const incomeMultipliers: { [key in Occupation]?: number } = {
    [Occupation.DOCTOR]: 8,
    [Occupation.LAWYER]: 7,
    [Occupation.BUSINESS_OWNER]: 6,
    [Occupation.ENGINEER]: 5,
    [Occupation.MANAGER]: 4.5,
    [Occupation.TEACHER]: 3,
    [Occupation.OFFICE_WORKER]: 3,
    [Occupation.RETAIL_WORKER]: 2,
    [Occupation.SERVICE_WORKER]: 2,
    [Occupation.FREELANCER]: 3,
    [Occupation.STUDENT]: 1.5,
    [Occupation.RETIRED]: 2,
    [Occupation.UNEMPLOYED]: 1
  };

  const baseIncomeMultiplier = incomeMultipliers[occupation] || 3;

  // Income should be at least 2x the rent with some randomness
  const baseMonthlyIncome = rentPrice * 2;
  const monthlyIncome = Math.round(
    baseMonthlyIncome * (baseIncomeMultiplier * (0.8 + Math.random() * 0.4))
  );

  // Credit score related to income and occupation stability
  let baseCreditScore = 650;
  if (occupation === Occupation.DOCTOR || occupation === Occupation.LAWYER) {
    baseCreditScore += 100;
  } else if (
    occupation === Occupation.BUSINESS_OWNER ||
    occupation === Occupation.ENGINEER
  ) {
    baseCreditScore += 70;
  } else if (occupation === Occupation.UNEMPLOYED) {
    baseCreditScore -= 100;
  } else if (occupation === Occupation.STUDENT) {
    baseCreditScore -= 50;
  }

  // Add some randomness to credit score
  const creditScore = Math.min(
    850,
    Math.max(350, baseCreditScore + Math.floor(Math.random() * 100) - 50)
  );

  // Family size
  const familySize = Math.floor(Math.random() * 5) + 1;

  // Pets and smoking are random
  const pets = Math.random() > 0.7;
  const smoker = Math.random() > 0.8;

  // Generate rental history
  const rentalHistory = {
    evictions: Math.random() > 0.9 ? Math.floor(Math.random() * 2) + 1 : 0,
    previousLandlordReviews:
      Math.random() > 0.7
        ? Math.random() > 0.5
          ? "Excellent"
          : ("Good" as "Excellent" | "Good")
        : Math.random() > 0.5
          ? "Average"
          : ("Poor" as "Average" | "Poor"),
    yearsOfRentalHistory: Math.floor(Math.random() * 10) + 1,
    timesMovedLastFiveYears: Math.floor(Math.random() * 4) + 1
  };

  // References quality correlates with credit score
  let references: "Excellent" | "Good" | "Average" | "Poor" | "None";
  if (creditScore > 750) {
    references = Math.random() > 0.2 ? "Excellent" : "Good";
  } else if (creditScore > 650) {
    references = Math.random() > 0.5 ? "Good" : "Average";
  } else if (creditScore > 550) {
    references = Math.random() > 0.5 ? "Average" : "Poor";
  } else {
    references = Math.random() > 0.5 ? "Poor" : "None";
  }

  // Payment reliability correlates with credit score and income
  const paymentProbability = Math.min(
    0.98,
    0.5 + creditScore / 1000 + monthlyIncome / (rentPrice * 10)
  );

  // Property care probability
  const propertyCareProbability = Math.min(
    0.95,
    0.6 + (creditScore / 1000) * 0.5
  );

  // Generate a random ID
  const id = uuidv4();

  // Lease length baseline
  const leaseLength = [6, 12, 18, 24][Math.floor(Math.random() * 4)];

  // Actual planned stay duration (may be shorter or longer than lease)
  const plannedStayDurationFactor = Math.random();
  let plannedStayDuration: number;

  if (plannedStayDurationFactor < 0.2) {
    // Will leave early
    plannedStayDuration = Math.ceil(leaseLength * (0.5 + Math.random() * 0.3));
  } else if (plannedStayDurationFactor < 0.7) {
    // Will stay for lease duration
    plannedStayDuration = leaseLength;
  } else {
    // Will stay longer
    plannedStayDuration = leaseLength + Math.floor(Math.random() * 12);
  }

  return {
    id,
    name: generateRandomName(),
    occupation,
    monthlyIncome,
    creditScore,
    familySize,
    pets,
    smoker,
    rentalHistory,
    leaseLength,
    plannedStayDuration,
    hasNotifiedDeparture: false,
    rentAmount: rentPrice,
    isPaying: true,
    paymentProbability,
    propertyCareProbability,
    references
  };
};

// Generate lease applications for a property
export const generateLeaseApplications = (
  rentalPrice: number,
  count: number,
  tenantQualityModifier: number = 0,
  listingKeywords: ListingKeyword[] = []
): LeaseApplication[] => {
  if (!rentalPrice || rentalPrice <= 0) {
    console.error(
      "Invalid rent price provided to generateLeaseApplications:",
      rentalPrice
    );
    return [];
  }

  const applications: LeaseApplication[] = [];

  const generateCreditScore = (baseQuality: number): number => {
    // Adjust quality based on event impacts
    const adjustedQuality = Math.max(
      0,
      Math.min(1, baseQuality + tenantQualityModifier)
    );

    // Generate score based on adjusted quality
    if (adjustedQuality > 0.8) {
      return Math.round(700 + Math.random() * 150); // 700-850
    } else if (adjustedQuality > 0.5) {
      return Math.round(650 + Math.random() * 100); // 650-750
    } else if (adjustedQuality > 0.2) {
      return Math.round(550 + Math.random() * 150); // 550-700
    } else {
      return Math.round(500 + Math.random() * 100); // 500-600
    }
  };

  for (let i = 0; i < count; i++) {
    const tenant = generateRandomTenant(rentalPrice);

    // Use the generateCreditScore function to adjust the tenant's credit score based on quality modifier
    const baseQuality = Math.random(); // Random base quality between 0-1
    tenant.creditScore = generateCreditScore(baseQuality);
    applyListingPreferences(tenant, listingKeywords);

    // Generate desired lease length (might be different from tenant's lease length)
    // This allows for negotiation on lease term length
    const leaseOptions = listingKeywords.includes("flexible_lease")
      ? [6, 6, 12, 12, 18]
      : [6, 12, 12, 18, 24];
    const desiredLeaseLength =
      leaseOptions[Math.floor(Math.random() * leaseOptions.length)];

    // Application fee
    const applicationFee = 50;

    // Create the application
    applications.push({
      tenant,
      desiredLeaseLength,
      applicationDate: new Date(),
      applicationFee
    });
  }

  return applications;
};
