import { Location, Property } from "../types";

// Property tax rates by location (percentage of property value annually)
export const PROPERTY_TAX_RATES = {
  [Location.DOWNTOWN]: 0.018, // 1.8% annually
  [Location.URBAN]: 0.016, // 1.6% annually
  [Location.SUBURBAN]: 0.014, // 1.4% annually
  [Location.COUNTRY]: 0.01 // 1.0% annually
};

// Income tax brackets for rental income (progressive tax system)
export const INCOME_TAX_BRACKETS = [
  { threshold: 0, rate: 0.1 }, // 10% for first bracket
  { threshold: 50000, rate: 0.15 }, // 15% for income above $50,000
  { threshold: 100000, rate: 0.25 }, // 25% for income above $100,000
  { threshold: 250000, rate: 0.35 } // 35% for income above $250,000
];

// Capital gains tax rates based on holding period
export const CAPITAL_GAINS_TAX_RATES = {
  SHORT_TERM: 0.25, // 25% for properties held < 12 months
  LONG_TERM: 0.15 // 15% for properties held >= 12 months
};

/**
 * Calculates monthly property tax for a single property
 */
export const calculatePropertyTax = (property: Property): number => {
  const annualRate = PROPERTY_TAX_RATES[property.location] || 0.015; // Default to 1.5% if location not found
  const annualTax = property.value * annualRate;
  return Math.round(annualTax / 12); // Convert to monthly payment
};

/**
 * Calculates property taxes for all owned properties
 */
export const calculateTotalPropertyTax = (properties: Property[]): number => {
  return properties.reduce(
    (total, property) =>
      property.owner === "Player"
        ? total + calculatePropertyTax(property)
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
  annualEstimate: boolean = false
): number => {
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

  for (let i = 0; i < INCOME_TAX_BRACKETS.length; i++) {
    const currentBracket = INCOME_TAX_BRACKETS[i];
    const nextBracket = INCOME_TAX_BRACKETS[i + 1];

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
  holdingPeriodMonths: number
): number => {
  // Calculate profit
  const profit = Math.max(0, salePrice - purchasePrice);

  // Determine tax rate based on holding period
  const taxRate =
    holdingPeriodMonths >= 12
      ? CAPITAL_GAINS_TAX_RATES.LONG_TERM
      : CAPITAL_GAINS_TAX_RATES.SHORT_TERM;

  return Math.round(profit * taxRate);
};
