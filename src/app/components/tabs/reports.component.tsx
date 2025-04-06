import { Property, Location, PropertyType } from "../../types";
import React, { useState } from "react";
import {
  calculatePropertyTax,
  calculateRentalIncomeTax
} from "../../utils/calculateTaxes.util";

interface ReportsProps {
  ownedProperties: Property[];
  totalDebt?: number;
  monthlyRepayment?: number;
  currentInterestRate?: number;
  playerMoney?: number;
}

export const Reports = ({
  ownedProperties,
  totalDebt = 0,
  monthlyRepayment = 0,
  playerMoney = 0
}: ReportsProps) => {
  const [activeSection, setActiveSection] = useState<string>("summary");

  // Calculate total portfolio value
  const portfolioValue = ownedProperties.reduce((sum, p) => sum + p.value, 0);

  // Calculate monthly rental income
  const monthlyRentalIncome = ownedProperties
    .filter((p) => p.isRented)
    .reduce((sum, p) => sum + p.rentPrice, 0);

  // Calculate monthly expenses (maintenance costs)
  const monthlyExpenses = ownedProperties.reduce(
    (sum, p) => sum + p.maintenanceCosts,
    0
  );

  // Calculate monthly cash flow
  const monthlyCashFlow =
    monthlyRentalIncome - monthlyExpenses - monthlyRepayment;

  // Calculate net worth (assets - debt)
  const netWorth = portfolioValue + playerMoney - totalDebt;

  // Calculate capitalization rate (cap rate) - annual income / property value
  const capRate =
    portfolioValue > 0
      ? ((monthlyRentalIncome * 12) / portfolioValue) * 100
      : 0;

  // Calculate cash-on-cash return
  const cashOnCash =
    portfolioValue > 0
      ? ((monthlyCashFlow * 12) / (portfolioValue - totalDebt)) * 100
      : 0;

  // Calculate average ROI
  const averageROI =
    ownedProperties.length > 0
      ? (ownedProperties.reduce(
          (sum, p) => sum + (p.value - p.marketPrice) / p.marketPrice,
          0
        ) /
          ownedProperties.length) *
        100
      : 0;

  // Calculate portfolio distribution by property type
  const typeDistribution = ownedProperties.reduce((acc, property) => {
    acc[property.type] = (acc[property.type] || 0) + property.value;
    return acc;
  }, {} as Record<PropertyType, number>);

  // Calculate portfolio distribution by location
  const locationDistribution = ownedProperties.reduce((acc, property) => {
    acc[property.location] = (acc[property.location] || 0) + property.value;
    return acc;
  }, {} as Record<Location, number>);

  // Calculate occupancy rate
  const occupancyRate =
    ownedProperties.length > 0
      ? (ownedProperties.filter((p) => p.isRented).length /
          ownedProperties.length) *
        100
      : 0;

  // Calculate debt service coverage ratio
  const dscr =
    monthlyRepayment > 0 ? monthlyRentalIncome / monthlyRepayment : 0;

  // Format as dollar value
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  // Format as percentage
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const renderSummaryReport = () => (
    <div className='border border-gray-700 p-4 rounded'>
      <h3 className='text-lg font-semibold mb-2'>Portfolio Summary</h3>
      <div className='grid grid-cols-2 gap-2'>
        <div>Total Properties:</div>
        <div>{ownedProperties.length}</div>
        <div>Portfolio Value:</div>
        <div>{formatCurrency(portfolioValue)}</div>
        <div>Monthly Rental Income:</div>
        <div className='text-green-400'>
          {formatCurrency(monthlyRentalIncome)}
        </div>
        <div>Monthly Expenses:</div>
        <div className='text-red-400'>{formatCurrency(monthlyExpenses)}</div>
        <div>Monthly Mortgage Payment:</div>
        <div className='text-red-400'>{formatCurrency(monthlyRepayment)}</div>
        <div>Monthly Cash Flow:</div>
        <div
          className={monthlyCashFlow >= 0 ? "text-green-400" : "text-red-400"}
        >
          {formatCurrency(monthlyCashFlow)}
        </div>
        <div>Net Worth:</div>
        <div className={netWorth >= 0 ? "text-green-400" : "text-red-400"}>
          {formatCurrency(netWorth)}
        </div>
        <div>Debt-to-Asset Ratio:</div>
        <div>
          {portfolioValue > 0
            ? formatPercent((totalDebt / portfolioValue) * 100)
            : "0.00%"}
        </div>
        <div>Occupancy Rate:</div>
        <div>{formatPercent(occupancyRate)}</div>
      </div>
    </div>
  );

  const renderPerformanceReport = () => (
    <div className='border border-gray-700 p-4 rounded'>
      <h3 className='text-lg font-semibold mb-2'>Property Performance</h3>
      <div className='overflow-x-auto'>
        <table className='min-w-full divide-y divide-gray-700'>
          <thead>
            <tr>
              <th className='px-4 py-2 text-left'>Property</th>
              <th className='px-4 py-2 text-left'>Purchase Price</th>
              <th className='px-4 py-2 text-left'>Current Value</th>
              <th className='px-4 py-2 text-left'>ROI</th>
              <th className='px-4 py-2 text-left'>Monthly Income</th>
              <th className='px-4 py-2 text-left'>Monthly Expenses</th>
              <th className='px-4 py-2 text-left'>Cash Flow</th>
              <th className='px-4 py-2 text-left'>Cap Rate</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-700'>
            {ownedProperties.map((property) => {
              const roi = (
                ((property.value - property.marketPrice) /
                  property.marketPrice) *
                100
              ).toFixed(2);

              const monthlyIncome = property.isRented ? property.rentPrice : 0;
              const cashFlow = monthlyIncome - property.maintenanceCosts;
              const propCapRate = property.isRented
                ? ((property.rentPrice * 12) / property.value) * 100
                : 0;

              return (
                <tr key={property.id}>
                  <td className='px-4 py-2'>{property.address}</td>
                  <td className='px-4 py-2'>
                    {formatCurrency(property.marketPrice)}
                  </td>
                  <td className='px-4 py-2'>
                    {formatCurrency(property.value)}
                  </td>
                  <td
                    className={`px-4 py-2 ${
                      Number(roi) >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {roi}%
                  </td>
                  <td className='px-4 py-2 text-green-400'>
                    {formatCurrency(monthlyIncome)}
                  </td>
                  <td className='px-4 py-2 text-red-400'>
                    {formatCurrency(property.maintenanceCosts)}
                  </td>
                  <td
                    className={`px-4 py-2 ${
                      cashFlow >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(cashFlow)}
                  </td>
                  <td className='px-4 py-2'>{propCapRate.toFixed(2)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {ownedProperties.length === 0 && (
        <p className='text-gray-400 text-center py-4'>
          No properties in portfolio
        </p>
      )}
    </div>
  );

  const renderFinancialMetrics = () => (
    <div className='border border-gray-700 p-4 rounded'>
      <h3 className='text-lg font-semibold mb-3'>Investment Metrics</h3>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {/* Cap Rate Card */}
        <div className='bg-gray-700 rounded p-4'>
          <div className='text-gray-400 text-sm mb-1'>Capitalization Rate</div>
          <div className='text-2xl font-bold mb-1'>
            {formatPercent(capRate)}
          </div>
          <p className='text-xs text-gray-400'>
            Annual income / Property value
          </p>
        </div>

        {/* Cash on Cash Card */}
        <div className='bg-gray-700 rounded p-4'>
          <div className='text-gray-400 text-sm mb-1'>Cash on Cash Return</div>
          <div className='text-2xl font-bold mb-1'>
            {formatPercent(cashOnCash)}
          </div>
          <p className='text-xs text-gray-400'>
            Annual cash flow / Cash invested
          </p>
        </div>

        {/* Average ROI Card */}
        <div className='bg-gray-700 rounded p-4'>
          <div className='text-gray-400 text-sm mb-1'>Average ROI</div>
          <div className='text-2xl font-bold mb-1'>
            {formatPercent(averageROI)}
          </div>
          <p className='text-xs text-gray-400'>Return on initial investment</p>
        </div>

        {/* Debt Service Coverage Ratio */}
        <div className='bg-gray-700 rounded p-4'>
          <div className='text-gray-400 text-sm mb-1'>
            Debt Service Coverage Ratio
          </div>
          <div className='text-2xl font-bold mb-1'>{dscr.toFixed(2)}</div>
          <p className='text-xs text-gray-400'>
            Rental income / Debt payment ({">"}1 is good)
          </p>
        </div>

        {/* Occupancy Rate */}
        <div className='bg-gray-700 rounded p-4'>
          <div className='text-gray-400 text-sm mb-1'>Occupancy Rate</div>
          <div className='text-2xl font-bold mb-1'>
            {formatPercent(occupancyRate)}
          </div>
          <p className='text-xs text-gray-400'>
            Percentage of properties rented
          </p>
        </div>

        {/* Gross Rent Multiplier */}
        <div className='bg-gray-700 rounded p-4'>
          <div className='text-gray-400 text-sm mb-1'>
            Gross Rent Multiplier
          </div>
          <div className='text-2xl font-bold mb-1'>
            {monthlyRentalIncome > 0
              ? (portfolioValue / (monthlyRentalIncome * 12)).toFixed(2)
              : "N/A"}
          </div>
          <p className='text-xs text-gray-400'>
            Property value / Annual rental income
          </p>
        </div>
      </div>
    </div>
  );

  const renderPortfolioDiversification = () => {
    // Check if we have any data to display
    if (ownedProperties.length === 0) {
      return (
        <div className='border border-gray-700 p-4 rounded'>
          <h3 className='text-lg font-semibold mb-2'>
            Portfolio Diversification
          </h3>
          <p className='text-center text-gray-400 py-4'>
            No properties in portfolio
          </p>
        </div>
      );
    }

    // Calculate percentages for each type
    const typePercentages = Object.entries(typeDistribution).map(
      ([type, value]) => ({
        type,
        value,
        percentage: ((value / portfolioValue) * 100).toFixed(1)
      })
    );

    // Calculate percentages for each location
    const locationPercentages = Object.entries(locationDistribution).map(
      ([location, value]) => ({
        location,
        value,
        percentage: ((value / portfolioValue) * 100).toFixed(1)
      })
    );

    return (
      <div className='border border-gray-700 p-4 rounded'>
        <h3 className='text-lg font-semibold mb-4'>
          Portfolio Diversification
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Property Type Distribution */}
          <div>
            <h4 className='font-medium mb-2'>By Property Type</h4>
            <div className='space-y-2'>
              {typePercentages.map(({ type, percentage, value }) => (
                <div key={type} className='flex flex-col'>
                  <div className='flex justify-between'>
                    <span>{type}</span>
                    <span>
                      {percentage}% ({formatCurrency(value)})
                    </span>
                  </div>
                  <div className='h-2 w-full bg-gray-700 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-blue-500 rounded-full'
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location Distribution */}
          <div>
            <h4 className='font-medium mb-2'>By Location</h4>
            <div className='space-y-2'>
              {locationPercentages.map(({ location, percentage, value }) => (
                <div key={location} className='flex flex-col'>
                  <div className='flex justify-between'>
                    <span>{location}</span>
                    <span>
                      {percentage}% ({formatCurrency(value)})
                    </span>
                  </div>
                  <div className='h-2 w-full bg-gray-700 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-green-500 rounded-full'
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCashFlowAnalysis = () => (
    <div className='border border-gray-700 p-4 rounded'>
      <h3 className='text-lg font-semibold mb-3'>Cash Flow Analysis</h3>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-4'>
        <div className='bg-gray-700 p-4 rounded'>
          <h4 className='text-md font-medium mb-2'>Monthly Income</h4>
          <div className='space-y-1'>
            <div className='flex justify-between'>
              <span>Rental Income:</span>
              <span className='text-green-400'>
                {formatCurrency(monthlyRentalIncome)}
              </span>
            </div>
            <div className='pt-2 border-t border-gray-600 flex justify-between font-semibold'>
              <span>Total Income:</span>
              <span className='text-green-400'>
                {formatCurrency(monthlyRentalIncome)}
              </span>
            </div>
          </div>
        </div>

        <div className='bg-gray-700 p-4 rounded'>
          <h4 className='text-md font-medium mb-2'>Monthly Expenses</h4>
          <div className='space-y-1'>
            <div className='flex justify-between'>
              <span>Maintenance Costs:</span>
              <span className='text-red-400'>
                {formatCurrency(monthlyExpenses)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Mortgage Payment:</span>
              <span className='text-red-400'>
                {formatCurrency(monthlyRepayment)}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Property Taxes:</span>
              <span className='text-red-400'>
                {formatCurrency(
                  ownedProperties.reduce(
                    (sum, p) => sum + calculatePropertyTax(p),
                    0
                  )
                )}
              </span>
            </div>
            <div className='flex justify-between'>
              <span>Income Taxes:</span>
              <span className='text-red-400'>
                {formatCurrency(
                  calculateRentalIncomeTax(monthlyRentalIncome, monthlyExpenses)
                )}
              </span>
            </div>
            <div className='pt-2 border-t border-gray-600 flex justify-between font-semibold'>
              <span>Total Expenses:</span>
              <span className='text-red-400'>
                {formatCurrency(
                  monthlyExpenses +
                    monthlyRepayment +
                    ownedProperties.reduce(
                      (sum, p) => sum + calculatePropertyTax(p),
                      0
                    ) +
                    calculateRentalIncomeTax(
                      monthlyRentalIncome,
                      monthlyExpenses
                    )
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className='bg-gray-800 p-4 rounded'>
        <div className='flex justify-between items-center'>
          <span className='font-bold'>Net Monthly Cash Flow:</span>
          <span
            className={`text-xl font-bold ${
              monthlyCashFlow >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {formatCurrency(monthlyCashFlow)}
          </span>
        </div>
        <div className='flex justify-between items-center mt-2'>
          <span>Projected Annual Cash Flow:</span>
          <span
            className={`font-bold ${
              monthlyCashFlow * 12 >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {formatCurrency(monthlyCashFlow * 12)}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className='bg-gray-800 rounded-lg p-6'>
      <h2 className='text-xl font-semibold mb-4'>Financial Reports</h2>

      {/* Report Section Navigation */}
      <div className='mb-4 flex flex-wrap gap-2'>
        <button
          className={`px-3 py-1 rounded ${
            activeSection === "summary"
              ? "bg-blue-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setActiveSection("summary")}
        >
          Summary
        </button>
        <button
          className={`px-3 py-1 rounded ${
            activeSection === "performance"
              ? "bg-blue-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setActiveSection("performance")}
        >
          Property Performance
        </button>
        <button
          className={`px-3 py-1 rounded ${
            activeSection === "cashflow"
              ? "bg-blue-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setActiveSection("cashflow")}
        >
          Cash Flow
        </button>
        <button
          className={`px-3 py-1 rounded ${
            activeSection === "metrics"
              ? "bg-blue-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setActiveSection("metrics")}
        >
          Financial Metrics
        </button>
        <button
          className={`px-3 py-1 rounded ${
            activeSection === "diversification"
              ? "bg-blue-600"
              : "bg-gray-700 hover:bg-gray-600"
          }`}
          onClick={() => setActiveSection("diversification")}
        >
          Diversification
        </button>
      </div>

      <div className='mt-4 space-y-6'>
        {activeSection === "summary" && renderSummaryReport()}
        {activeSection === "performance" && renderPerformanceReport()}
        {activeSection === "cashflow" && renderCashFlowAnalysis()}
        {activeSection === "metrics" && renderFinancialMetrics()}
        {activeSection === "diversification" &&
          renderPortfolioDiversification()}
      </div>
    </div>
  );
};
