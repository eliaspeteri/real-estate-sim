import React, { useState } from "react";
import { Property } from "../../types";
import {
  calculateTotalPropertyTax,
  calculateRentalIncomeTax,
  PROPERTY_TAX_RATES,
  INCOME_TAX_BRACKETS,
  CAPITAL_GAINS_TAX_RATES
} from "../../utils/calculateTaxes.util";

interface TaxesProps {
  properties: Property[];
  monthlyRentalIncome: number;
  monthlyExpenses: number;
  recentCapitalGains: {
    property: string;
    purchasePrice: number;
    salePrice: number;
    holdingPeriodMonths: number;
    taxPaid: number;
  }[];
  fiscalYear: string; // e.g., "2023"
  totalTaxesPaidYTD: number;
}

export const Taxes: React.FC<TaxesProps> = ({
  properties,
  monthlyRentalIncome,
  monthlyExpenses,
  recentCapitalGains = [],
  fiscalYear,
  totalTaxesPaidYTD
}) => {
  const [simulateSaleProperty, setSimulateSaleProperty] = useState<
    number | null
  >(null);

  const monthlyPropertyTax = calculateTotalPropertyTax(properties);
  const monthlyIncomeTax = calculateRentalIncomeTax(
    monthlyRentalIncome,
    monthlyExpenses
  );

  const annualPropertyTax = monthlyPropertyTax * 12;
  const annualIncomeTax = monthlyIncomeTax * 12;
  const capitalGainsTaxPaid = recentCapitalGains.reduce(
    (total, gain) => total + gain.taxPaid,
    0
  );
  const totalAnnualTaxEstimate =
    annualPropertyTax + annualIncomeTax + capitalGainsTaxPaid;

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  return (
    <div className='bg-gray-800 rounded-lg p-6'>
      <h2 className='text-xl font-semibold mb-4'>Tax Management</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6'>
        {/* Tax Summary Card */}
        <div className='bg-gray-700 p-4 rounded'>
          <h3 className='text-lg font-medium mb-3'>
            Tax Summary ({fiscalYear})
          </h3>

          <div className='mb-4'>
            <div className='flex justify-between text-sm mb-1'>
              <span className='text-gray-300'>Property Tax (Monthly)</span>
              <span>{formatCurrency(monthlyPropertyTax)}</span>
            </div>
            <div className='w-full bg-gray-600 h-2 rounded-full'>
              <div
                className='bg-blue-500 h-2 rounded-full'
                style={{
                  width: `${Math.min(
                    100,
                    (monthlyPropertyTax /
                      (monthlyPropertyTax + monthlyIncomeTax)) *
                      100
                  )}%`
                }}
              ></div>
            </div>
          </div>

          <div className='mb-4'>
            <div className='flex justify-between text-sm mb-1'>
              <span className='text-gray-300'>Rental Income Tax (Monthly)</span>
              <span>{formatCurrency(monthlyIncomeTax)}</span>
            </div>
            <div className='w-full bg-gray-600 h-2 rounded-full'>
              <div
                className='bg-green-500 h-2 rounded-full'
                style={{
                  width: `${Math.min(
                    100,
                    (monthlyIncomeTax /
                      (monthlyPropertyTax + monthlyIncomeTax)) *
                      100
                  )}%`
                }}
              ></div>
            </div>
          </div>

          <div className='border-t border-gray-600 pt-3 mt-3'>
            <div className='flex justify-between'>
              <span>Estimated Annual Tax Burden:</span>
              <span className='font-semibold text-red-400'>
                {formatCurrency(totalAnnualTaxEstimate)}
              </span>
            </div>
            <div className='flex justify-between mt-1'>
              <span>Taxes Paid Year-to-Date:</span>
              <span className='font-semibold'>
                {formatCurrency(totalTaxesPaidYTD)}
              </span>
            </div>
          </div>
        </div>

        {/* Property Breakdown */}
        <div className='bg-gray-700 p-4 rounded'>
          <h3 className='text-lg font-medium mb-3'>Property Tax Breakdown</h3>

          <div className='max-h-[200px] overflow-y-auto mb-3'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left border-b border-gray-600'>
                  <th className='pb-2'>Property</th>
                  <th className='pb-2'>Value</th>
                  <th className='pb-2'>Monthly Tax</th>
                </tr>
              </thead>
              <tbody>
                {properties
                  .filter((p) => p.owner === "Player")
                  .map((property) => (
                    <tr key={property.id} className='border-b border-gray-700'>
                      <td className='py-2'>
                        {property.address.split(", ")[0]}
                      </td>
                      <td>{formatCurrency(property.value)}</td>
                      <td className='text-red-300'>
                        {formatCurrency(
                          Math.round(
                            (property.value *
                              PROPERTY_TAX_RATES[property.location]) /
                              12
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                {properties.filter((p) => p.owner === "Player").length ===
                  0 && (
                  <tr>
                    <td colSpan={3} className='py-3 text-center text-gray-400'>
                      No properties owned
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tax Rates Information */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
        <div className='bg-gray-700 p-4 rounded'>
          <h3 className='text-lg font-medium mb-3'>Property Tax Rates</h3>
          <table className='w-full text-sm'>
            <tbody>
              {Object.entries(PROPERTY_TAX_RATES).map(([location, rate]) => (
                <tr key={location} className='border-b border-gray-600'>
                  <td className='py-1'>{location}</td>
                  <td className='text-right'>{(rate * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='bg-gray-700 p-4 rounded'>
          <h3 className='text-lg font-medium mb-3'>Income Tax Brackets</h3>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left border-b border-gray-600'>
                <th className='pb-1'>Income</th>
                <th className='pb-1 text-right'>Rate</th>
              </tr>
            </thead>
            <tbody>
              {INCOME_TAX_BRACKETS.map((bracket, index) => {
                const nextBracket = INCOME_TAX_BRACKETS[index + 1];
                const incomeRange = nextBracket
                  ? `$${bracket.threshold.toLocaleString()} - $${(
                      nextBracket.threshold - 1
                    ).toLocaleString()}`
                  : `$${bracket.threshold.toLocaleString()}+`;

                return (
                  <tr key={index} className='border-b border-gray-600'>
                    <td className='py-1'>{incomeRange}</td>
                    <td className='text-right'>
                      {(bracket.rate * 100).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className='bg-gray-700 p-4 rounded'>
          <h3 className='text-lg font-medium mb-3'>Capital Gains Rates</h3>
          <table className='w-full text-sm'>
            <tbody>
              <tr className='border-b border-gray-600'>
                <td className='py-1'>Short-term ({"<"} 1 year)</td>
                <td className='text-right'>
                  {(CAPITAL_GAINS_TAX_RATES.SHORT_TERM * 100).toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className='py-1'>Long-term ({"≥"} 1 year)</td>
                <td className='text-right'>
                  {(CAPITAL_GAINS_TAX_RATES.LONG_TERM * 100).toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Capital Gains */}
      <div className='bg-gray-700 p-4 rounded mb-6'>
        <h3 className='text-lg font-medium mb-3'>Recent Capital Gains</h3>

        {recentCapitalGains.length > 0 ? (
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-left border-b border-gray-600'>
                <th className='pb-2'>Property</th>
                <th className='pb-2'>Purchase Price</th>
                <th className='pb-2'>Sale Price</th>
                <th className='pb-2'>Profit</th>
                <th className='pb-2'>Holding Period</th>
                <th className='pb-2'>Tax Paid</th>
              </tr>
            </thead>
            <tbody>
              {recentCapitalGains.map((gain, index) => (
                <tr key={index} className='border-b border-gray-600'>
                  <td className='py-2'>{gain.property}</td>
                  <td>{formatCurrency(gain.purchasePrice)}</td>
                  <td>{formatCurrency(gain.salePrice)}</td>
                  <td
                    className={
                      gain.salePrice > gain.purchasePrice
                        ? "text-green-400"
                        : "text-red-400"
                    }
                  >
                    {formatCurrency(gain.salePrice - gain.purchasePrice)}
                  </td>
                  <td>{gain.holdingPeriodMonths} months</td>
                  <td className='text-red-300'>
                    {formatCurrency(gain.taxPaid)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className='text-gray-400 py-2 text-center'>
            No capital gains transactions this year
          </p>
        )}
      </div>

      {/* Tax Planning Tools */}
      <div className='bg-gray-700 p-4 rounded'>
        <h3 className='text-lg font-medium mb-4'>Tax Planning</h3>

        <div className='mb-4'>
          <p className='text-sm text-gray-300 mb-2'>
            Use the tools below to simulate different tax scenarios and plan
            your investment strategy.
          </p>
        </div>

        <div className='space-y-4'>
          <div>
            <h4 className='font-medium mb-2'>Capital Gains Tax Simulator</h4>
            <div className='flex flex-col sm:flex-row sm:items-center gap-2'>
              <select
                className='bg-gray-800 border border-gray-600 rounded px-2 py-1'
                value={simulateSaleProperty || ""}
                onChange={(e) =>
                  setSimulateSaleProperty(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
              >
                <option value=''>Select a property to simulate sale</option>
                {properties
                  .filter((p) => p.owner === "Player")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.address.split(", ")[0]} (Value: $
                      {p.value.toLocaleString()})
                    </option>
                  ))}
              </select>
              <button className='bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded text-sm'>
                Calculate Tax Impact
              </button>
            </div>

            {simulateSaleProperty && (
              <div className='mt-3 p-3 bg-gray-800 rounded'>
                <p className='text-sm text-gray-300'>
                  Simulation results will appear here...
                </p>
              </div>
            )}
          </div>

          <div>
            <h4 className='font-medium mb-2'>Tax Deduction Strategies</h4>
            <ul className='list-disc pl-5 text-sm text-gray-300'>
              <li>
                Consider renovating properties to increase depreciation
                deductions
              </li>
              <li>
                Hold properties longer than 12 months to qualify for lower
                long-term capital gains rates
              </li>
              <li>
                Time your property sales strategically to spread capital gains
                across tax years
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
