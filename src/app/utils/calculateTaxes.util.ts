import { Location, Property } from "../types";

export type TaxRegion = "US" | "EU" | "NORDIC";

export type Currency = "USD" | "EUR" | "GBP" | "JPY";

type TaxBracket = { threshold: number; rate: number };

type TaxConfig = {
  propertyTaxRates: Record<Location, number>;
  defaultPropertyTaxRate: number;
  incomeTaxBrackets: TaxBracket[];
  capitalGainsRates: { SHORT_TERM: number; LONG_TERM: number };
};

export const TAX_CONFIGS: Record<TaxRegion, TaxConfig> = {
  US: {
    propertyTaxRates: {
      [Location.DOWNTOWN]: 0.018,
      [Location.URBAN]: 0.016,
      [Location.SUBURBAN]: 0.014,
      [Location.COUNTRY]: 0.01
    },
    defaultPropertyTaxRate: 0.015,
    incomeTaxBrackets: [
      { threshold: 0, rate: 0.1 },
      { threshold: 50000, rate: 0.15 },
      { threshold: 100000, rate: 0.25 },
      { threshold: 250000, rate: 0.35 }
    ],
    capitalGainsRates: {
      SHORT_TERM: 0.25,
      LONG_TERM: 0.15
    }
  },
  EU: {
    propertyTaxRates: {
      [Location.DOWNTOWN]: 0.014,
      [Location.URBAN]: 0.013,
      [Location.SUBURBAN]: 0.012,
      [Location.COUNTRY]: 0.009
    },
    defaultPropertyTaxRate: 0.012,
    incomeTaxBrackets: [
      { threshold: 0, rate: 0.12 },
      { threshold: 40000, rate: 0.2 },
      { threshold: 90000, rate: 0.3 },
      { threshold: 180000, rate: 0.38 }
    ],
    capitalGainsRates: {
      SHORT_TERM: 0.22,
      LONG_TERM: 0.12
    }
  },
  NORDIC: {
    propertyTaxRates: {
      [Location.DOWNTOWN]: 0.012,
      [Location.URBAN]: 0.011,
      [Location.SUBURBAN]: 0.01,
      [Location.COUNTRY]: 0.008
    },
    defaultPropertyTaxRate: 0.01,
    incomeTaxBrackets: [
      { threshold: 0, rate: 0.15 },
      { threshold: 50000, rate: 0.25 },
      { threshold: 120000, rate: 0.33 },
      { threshold: 220000, rate: 0.4 }
    ],
    capitalGainsRates: {
      SHORT_TERM: 0.28,
      LONG_TERM: 0.18
    }
  }
};

export const DEFAULT_TAX_REGION: TaxRegion = "US";

export const getTaxConfig = (taxRegion: TaxRegion = DEFAULT_TAX_REGION) => {
  return TAX_CONFIGS[taxRegion] || TAX_CONFIGS[DEFAULT_TAX_REGION];
};

// Backward-compatible exports for default tax config.
export const PROPERTY_TAX_RATES = TAX_CONFIGS.US.propertyTaxRates;
export const INCOME_TAX_BRACKETS = TAX_CONFIGS.US.incomeTaxBrackets;
export const CAPITAL_GAINS_TAX_RATES = TAX_CONFIGS.US.capitalGainsRates;

/**
 * Calculates monthly property tax for a single property
 */
export const calculatePropertyTax = (
  property: Property,
  taxRegion: TaxRegion = DEFAULT_TAX_REGION
): number => {
  const config = getTaxConfig(taxRegion);
  const annualRate =
    config.propertyTaxRates[property.location] || config.defaultPropertyTaxRate;
  const annualTax = property.value * annualRate;
  return Math.round(annualTax / 12); // Convert to monthly payment
};

/**
 * Calculates property taxes for all owned properties
 */
export const calculateTotalPropertyTax = (
  properties: Property[],
  taxRegion: TaxRegion = DEFAULT_TAX_REGION
): number => {
  return properties.reduce(
    (total, property) =>
      property.owner === "Player"
        ? total + calculatePropertyTax(property, taxRegion)
        : total,
    0
  );
};

/**
 * Calculates income tax on rental income, with deductions for expenses
 */
export const calculateRentalIncomeTax = (
  monthlyRentalIncome: number,
  monthlyExpenses: number,
  annualEstimate: boolean = false,
  taxRegion: TaxRegion = DEFAULT_TAX_REGION
): number => {
  const config = getTaxConfig(taxRegion);
  // Calculate taxable income (rent minus allowed deductions)
  const deductionRate = 0.8; // 80% of expenses can be deducted
  const taxableMonthlyIncome = Math.max(
    0,
    monthlyRentalIncome - monthlyExpenses * deductionRate
  );

  // Annualize for tax bracket calculation
  const annualizedIncome = taxableMonthlyIncome * 12;

  // Calculate tax using progressive brackets
  let remainingIncome = annualizedIncome;
  let totalTax = 0;

  for (let i = 0; i < config.incomeTaxBrackets.length; i++) {
    const currentBracket = config.incomeTaxBrackets[i];
    const nextBracket = config.incomeTaxBrackets[i + 1];

    if (!nextBracket) {
      // This is the highest bracket
      totalTax += remainingIncome * currentBracket.rate;
      break;
    }

    const bracketIncome = Math.min(
      remainingIncome,
      nextBracket.threshold - currentBracket.threshold
    );
    totalTax += bracketIncome * currentBracket.rate;
    remainingIncome -= bracketIncome;

    if (remainingIncome <= 0) break;
  }

  // Return monthly tax if not requesting annual estimate
  return annualEstimate ? Math.round(totalTax) : Math.round(totalTax / 12);
};

/**
 * Calculates capital gains tax when selling a property
 */
export const calculateCapitalGainsTax = (
  purchasePrice: number,
  salePrice: number,
  holdingPeriodMonths: number,
  taxRegion: TaxRegion = DEFAULT_TAX_REGION
): number => {
  const config = getTaxConfig(taxRegion);
  // Calculate profit
  const profit = Math.max(0, salePrice - purchasePrice);

  // Determine tax rate based on holding period
  const taxRate =
    holdingPeriodMonths >= 12
      ? config.capitalGainsRates.LONG_TERM
      : config.capitalGainsRates.SHORT_TERM;

  return Math.round(profit * taxRate);
};
