export const Tips = () => {
  return (
    <div className='bg-gray-800 rounded-lg p-6'>
      <h2 className='text-xl font-semibold mb-4'>Game Tips</h2>

      <div className='space-y-6'>
        <div>
          <h3 className='text-lg font-medium text-blue-400 mb-2'>
            Getting Started
          </h3>
          <p className='text-gray-300'>
            Begin by purchasing affordable properties with good neighborhood
            ratings and rental potential. Focus on properties with positive cash
            flow first to build your capital base.
          </p>
        </div>

        <div>
          <h3 className='text-lg font-medium text-blue-400 mb-2'>
            Property Selection Tips
          </h3>
          <ul className='list-disc pl-5 text-gray-300 space-y-1'>
            <li>
              Properties with &quot;High&quot; renovation potential can be great
              investments
            </li>
            <li>
              Check the job growth percentage - higher growth areas often
              appreciate faster
            </li>
            <li>
              Look for special features that add value like swimming pools in
              luxury properties
            </li>
            <li>
              Consider the neighborhood quality - &quot;Excellent&quot; areas
              command premium rents
            </li>
          </ul>
        </div>

        <div>
          <h3 className='text-lg font-medium text-blue-400 mb-2'>
            Financial Strategy
          </h3>
          <p className='text-gray-300'>
            Use loans strategically to expand your portfolio, but be careful not
            to over-leverage. Try to maintain a debt ratio below 60% for safety.
            Remember to balance your portfolio between properties that generate
            rental income and those with high appreciation potential.
          </p>
        </div>

        <div>
          <h3 className='text-lg font-medium text-blue-400 mb-2'>
            Managing Properties
          </h3>
          <p className='text-gray-300'>
            Renovating properties increases both their value and the rent you
            can charge. However, it&apos;s usually not economical to renovate
            properties that you plan to sell immediately. Focus renovations on
            properties you intend to hold for longer periods.
          </p>
        </div>

        {/* New Tax Management Tips */}
        <div>
          <h3 className='text-lg font-medium text-blue-400 mb-2'>
            Tax Management
          </h3>
          <ul className='list-disc pl-5 text-gray-300 space-y-2'>
            <li>
              <strong>Property Tax Strategy:</strong> Different locations have
              different property tax rates. Downtown properties have the highest
              rates (1.8%), while country properties have the lowest (1.0%).
              Consider this ongoing cost when purchasing.
            </li>
            <li>
              <strong>Capital Gains Tax:</strong> Properties held for less than
              12 months are subject to higher short-term capital gains tax
              (25%). Hold properties for at least one year to qualify for the
              lower long-term rate (15%).
            </li>
            <li>
              <strong>Income Tax Planning:</strong> Rental income is taxed
              progressively. Consider spreading your investments to optimize
              your tax bracket position. Remember that 80% of your expenses can
              be deducted from your taxable rental income.
            </li>
            <li>
              <strong>Timing Sales:</strong> Strategic timing of property sales
              can help minimize tax liability. Avoid selling multiple properties
              in the same fiscal year if it would push you into a higher tax
              bracket.
            </li>
          </ul>
        </div>

        {/* New Financial Reports Tips */}
        <div>
          <h3 className='text-lg font-medium text-blue-400 mb-2'>
            Using Financial Reports
          </h3>
          <ul className='list-disc pl-5 text-gray-300 space-y-2'>
            <li>
              <strong>Portfolio Diversification:</strong> Aim to diversify your
              portfolio across different property types and locations. The
              diversification tab shows your current asset allocation with
              helpful visualizations.
            </li>
            <li>
              <strong>Key Financial Metrics:</strong>
              <ul className='list-circle pl-5 mt-1 space-y-1'>
                <li>
                  <span className='text-green-400'>
                    Capitalization Rate (Cap Rate)
                  </span>{" "}
                  - Measures your annual return on investment. Higher is better,
                  with 5-10% generally considered good for real estate.
                </li>
                <li>
                  <span className='text-green-400'>Cash on Cash Return</span> -
                  Measures the return on the actual cash invested. This can be
                  higher than cap rate if you&apos;re using leverage
                  effectively.
                </li>
                <li>
                  <span className='text-green-400'>
                    Debt Service Coverage Ratio (DSCR)
                  </span>{" "}
                  - Should be above 1.0, with 1.25+ considered healthy. This
                  indicates your rental income comfortably covers your debt
                  payments.
                </li>
              </ul>
            </li>
            <li>
              <strong>Cash Flow Analysis:</strong> Use the cash flow breakdown
              to identify properties that are draining your finances. Aim for
              positive cash flow on each property and across your entire
              portfolio.
            </li>
          </ul>
        </div>

        {/* Interest Rate Tips */}
        <div>
          <h3 className='text-lg font-medium text-blue-400 mb-2'>
            Interest Rate Strategy
          </h3>
          <p className='text-gray-300'>
            Interest rates change quarterly. Keep an eye on the trend - if rates
            are consistently rising, consider locking in loans before they
            increase further. Conversely, if rates are falling, you might want
            to wait before taking on new debt. Having a high credit score can
            help you qualify for better loan terms regardless of market
            conditions.
          </p>
        </div>

        {/* New Land Development Tips */}
        <div>
          <h3 className='text-lg font-medium text-blue-400 mb-2'>
            Land Properties
          </h3>
          <p className='text-gray-300'>
            Land properties cannot be rented but are valuable long-term
            investments. Land typically appreciates over time and can be sold
            for profit later. In future updates, you&apos;ll be able to develop
            land into new properties.
          </p>
        </div>

        {/* New Property Management Tips */}
        <div>
          <h3 className='text-lg font-medium text-blue-400 mb-2'>
            Property Management
          </h3>
          <ul className='list-disc pl-5 text-gray-300 space-y-2'>
            <li>
              <strong>Outsourcing Management:</strong> You can hire a property
              manager to handle your properties. This saves time but costs a
              monthly fee.
            </li>
            <li>
              <strong>Finding Tenants:</strong> Property managers can find
              tenants for vacant properties you&apos;ve outsourced, charging
              half a month&apos;s rent as a fee.
            </li>
            <li>
              <strong>Handling Issues:</strong> For outsourced properties,
              managers will automatically handle tenant complaints and
              maintenance issues.
            </li>
            <li>
              <strong>Efficiency Trade-off:</strong> Using a property manager is
              less profitable than managing personally, but allows you to scale
              your portfolio more easily.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
