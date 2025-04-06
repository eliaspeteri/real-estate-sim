import React, { useState } from "react";

interface RateProtectionPlan {
  active: boolean;
  capRate: number;
  monthlyCost: number;
}

interface BankProps {
  playerMoney: number;
  totalDebt: number;
  monthlyRepayment: number;
  currentInterestRate: number;
  bankCreditScore: number;
  maxLoanAmount: number;
  maxLoanToValueRatio: number;
  currentDebtRatio: number;
  paymentHistory: { date: Date; amount: number; adminFee: number }[];
  interestRateHistory: { date: Date; rate: number }[];
  consecutivePayments: number;
  nextRateChangeDate: Date;
  onTakeLoan: (amount: number) => void;
  onRepayLoan: (amount: number) => void;
  assetValue: number;
  adminFeeFixed: number;
  adminFeePercent: number;
  currentDate: Date;
  rateProtection?: RateProtectionPlan;
  onPurchaseRateProtection?: (capRate: number) => void;
  onCancelRateProtection?: () => void;
}

export const Bank: React.FC<BankProps> = ({
  playerMoney,
  totalDebt,
  monthlyRepayment,
  currentInterestRate,
  bankCreditScore,
  maxLoanAmount,
  maxLoanToValueRatio,
  currentDebtRatio,
  paymentHistory,
  interestRateHistory,
  consecutivePayments,
  nextRateChangeDate,
  onTakeLoan,
  onRepayLoan,
  assetValue,
  adminFeeFixed,
  adminFeePercent,
  rateProtection,
  onPurchaseRateProtection,
  onCancelRateProtection
}) => {
  const [loanAmount, setLoanAmount] = useState<number>(10000);
  const [showLoanForm, setShowLoanForm] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<
    "loans" | "rates" | "history" | "protection"
  >("loans");

  // Calculate remaining months until loan is fully paid
  const remainingMonths =
    totalDebt > 0 && monthlyRepayment > 0
      ? Math.ceil(totalDebt / monthlyRepayment)
      : 0;

  // Calculate loan approval probability
  const loanApprovalProbability = calculateLoanApproval(
    bankCreditScore,
    totalDebt,
    assetValue,
    maxLoanToValueRatio
  );

  // Calculate maximum loan available now
  const maxAvailableLoan = Math.min(
    maxLoanAmount,
    Math.max(0, assetValue * maxLoanToValueRatio - totalDebt)
  );

  // Admin fee for regular payment - should be 0 when no active loan
  const monthlyAdminFee =
    totalDebt > 0 ? adminFeeFixed + monthlyRepayment * adminFeePercent : 0;

  // Fee for early repayment (2% of remaining balance)
  const earlyRepaymentFee = Math.round(totalDebt * 0.02);

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    }).format(date);
  };

  // Calculate credit status label and color
  const getCreditStatus = () => {
    if (bankCreditScore >= 800)
      return { label: "Excellent", color: "text-green-400" };
    if (bankCreditScore >= 700)
      return { label: "Good", color: "text-green-300" };
    if (bankCreditScore >= 600)
      return { label: "Fair", color: "text-yellow-400" };
    if (bankCreditScore >= 500)
      return { label: "Poor", color: "text-orange-400" };
    return { label: "Very Poor", color: "text-red-500" };
  };

  const creditStatus = getCreditStatus();

  return (
    <div className='bg-gray-800 rounded-lg p-6'>
      <h2 className='text-xl font-semibold mb-4'>Banking Center</h2>

      {/* Bank tab navigation */}
      <div className='mb-4 border-b border-gray-700'>
        <nav className='flex -mb-px'>
          <button
            className={`px-4 py-2 mr-2 ${
              activeTab === "loans"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("loans")}
          >
            Loans & Credit
          </button>
          <button
            className={`px-4 py-2 mr-2 ${
              activeTab === "rates"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("rates")}
          >
            Interest Rates
          </button>
          <button
            className={`px-4 py-2 mr-2 ${
              activeTab === "history"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("history")}
          >
            Payment History
          </button>
          <button
            className={`px-4 py-2 ${
              activeTab === "protection"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("protection")}
          >
            Rate Protection
          </button>
        </nav>
      </div>

      {activeTab === "loans" && (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          {/* Current Loan Status */}
          <div className='space-y-6'>
            <div className='bg-gray-700 p-4 rounded'>
              <h3 className='text-lg font-medium mb-3'>Current Loan Status</h3>

              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Outstanding Balance:</span>
                  <span className='font-semibold'>
                    ${totalDebt.toLocaleString()}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span>Monthly Payment:</span>
                  <span>${monthlyRepayment.toLocaleString()}</span>
                </div>

                <div className='flex justify-between'>
                  <span>Admin Fee:</span>
                  <span>${monthlyAdminFee.toLocaleString()}</span>
                </div>

                <div className='flex justify-between'>
                  <span>Total Monthly Cost:</span>
                  <span>
                    ${(monthlyRepayment + monthlyAdminFee).toLocaleString()}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span>Current Interest Rate:</span>
                  <span>{(currentInterestRate * 100).toFixed(1)}%</span>
                </div>

                <div className='flex justify-between'>
                  <span>Remaining Payments:</span>
                  <span>{remainingMonths} months</span>
                </div>

                <div className='flex justify-between'>
                  <span>Next Rate Change:</span>
                  <span>{formatDate(nextRateChangeDate)}</span>
                </div>

                {totalDebt > 0 && (
                  <button
                    className='w-full mt-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50'
                    onClick={() => onRepayLoan(totalDebt)}
                    disabled={playerMoney < totalDebt + earlyRepaymentFee}
                  >
                    Pay Off Loan ($
                    {(totalDebt + earlyRepaymentFee).toLocaleString()})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Credit Status */}
          <div className='space-y-6'>
            <div className='bg-gray-700 p-4 rounded'>
              <h3 className='text-lg font-medium mb-3'>Credit Status</h3>

              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Credit Score:</span>
                  <span className={`font-semibold ${creditStatus.color}`}>
                    {bankCreditScore} - {creditStatus.label}
                  </span>
                </div>

                <div className='flex justify-between'>
                  <span>Consecutive Payments:</span>
                  <span>{consecutivePayments}</span>
                </div>

                <div className='flex justify-between'>
                  <span>Current Debt Ratio:</span>
                  <span>{(currentDebtRatio * 100).toFixed(1)}%</span>
                </div>

                <div className='flex justify-between'>
                  <span>Maximum Allowed Debt Ratio:</span>
                  <span>{(maxLoanToValueRatio * 100).toFixed(1)}%</span>
                </div>

                <div className='flex justify-between'>
                  <span>Maximum Loan Limit:</span>
                  <span>${maxLoanAmount.toLocaleString()}</span>
                </div>

                <div className='flex justify-between'>
                  <span>Loan Approval Rating:</span>
                  <span
                    className={
                      loanApprovalProbability > 80
                        ? "text-green-400"
                        : loanApprovalProbability > 50
                        ? "text-yellow-400"
                        : "text-red-400"
                    }
                  >
                    {loanApprovalProbability}%
                  </span>
                </div>
              </div>
            </div>

            {/* Loan Application */}
            <div className='bg-gray-700 p-4 rounded'>
              <h3 className='text-lg font-medium mb-3'>New Loan Application</h3>

              {!showLoanForm ? (
                <button
                  className='w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded'
                  onClick={() => setShowLoanForm(true)}
                >
                  Apply for a New Loan
                </button>
              ) : (
                <div className='space-y-3'>
                  <div>
                    <label className='block mb-1'>
                      Loan Amount: ${loanAmount.toLocaleString()}
                    </label>
                    <input
                      type='range'
                      min={10000}
                      max={maxAvailableLoan}
                      step={5000}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(parseInt(e.target.value))}
                      className='w-full'
                    />
                  </div>

                  <div className='flex justify-between text-sm'>
                    <span>Min: $10,000</span>
                    <span>Max: ${maxAvailableLoan.toLocaleString()}</span>
                  </div>

                  <div className='text-sm space-y-1'>
                    <div className='flex justify-between'>
                      <span>Estimated Monthly Payment:</span>
                      <span>
                        ${(loanAmount * (currentInterestRate / 12)).toFixed(2)}
                      </span>
                    </div>

                    <div className='flex justify-between'>
                      <span>Admin Fee:</span>
                      <span>
                        $
                        {(
                          adminFeeFixed +
                          loanAmount *
                            (currentInterestRate / 12) *
                            adminFeePercent
                        ).toFixed(2)}
                      </span>
                    </div>

                    <div className='flex justify-between'>
                      <span>Total Monthly Cost:</span>
                      <span>
                        $
                        {(
                          loanAmount * (currentInterestRate / 12) +
                          adminFeeFixed +
                          loanAmount *
                            (currentInterestRate / 12) *
                            adminFeePercent
                        ).toFixed(2)}
                      </span>
                    </div>

                    <div className='flex justify-between'>
                      <span>Current Interest Rate:</span>
                      <span>{(currentInterestRate * 100).toFixed(1)}%</span>
                    </div>

                    <div className='flex justify-between'>
                      <span>Approval Probability:</span>
                      <span
                        className={
                          loanApprovalProbability > 80
                            ? "text-green-400"
                            : loanApprovalProbability > 50
                            ? "text-yellow-400"
                            : "text-red-400"
                        }
                      >
                        {loanApprovalProbability}%
                      </span>
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <button
                      className='flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded'
                      onClick={() => {
                        onTakeLoan(loanAmount);
                        setShowLoanForm(false);
                      }}
                    >
                      Apply
                    </button>
                    <button
                      className='flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded'
                      onClick={() => setShowLoanForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "rates" && (
        <div className='bg-gray-700 p-4 rounded'>
          <h3 className='text-lg font-medium mb-4'>Interest Rate History</h3>

          <div className='mb-6 p-4 bg-gray-800 rounded'>
            <div className='flex justify-between items-center mb-2'>
              <span className='text-lg'>Current Rate:</span>
              <span className='text-2xl font-bold text-blue-400'>
                {(currentInterestRate * 100).toFixed(1)}%
              </span>
            </div>
            <p className='text-gray-400 text-sm'>
              Next rate change will occur on {formatDate(nextRateChangeDate)}.
              Interest rates are reviewed quarterly and can fluctuate based on
              market conditions.
            </p>
          </div>

          <div className='h-[300px] overflow-y-auto'>
            <table className='min-w-full'>
              <thead>
                <tr className='border-b border-gray-600'>
                  <th className='py-2 text-left'>Date</th>
                  <th className='py-2 text-right'>Rate</th>
                  <th className='py-2 text-right'>Change</th>
                </tr>
              </thead>
              <tbody>
                {interestRateHistory.map((entry, index) => {
                  const previousRate =
                    index < interestRateHistory.length - 1
                      ? interestRateHistory[index + 1].rate
                      : entry.rate;
                  const change = entry.rate - previousRate;
                  const changeFormatted =
                    change === 0
                      ? "—"
                      : change > 0
                      ? `+${(change * 100).toFixed(1)}%`
                      : `${(change * 100).toFixed(1)}%`;
                  const changeColor =
                    change === 0
                      ? ""
                      : change > 0
                      ? "text-red-400"
                      : "text-green-400";

                  return (
                    <tr key={index} className='border-b border-gray-700'>
                      <td className='py-2 text-left'>
                        {formatDate(entry.date)}
                      </td>
                      <td className='py-2 text-right'>
                        {(entry.rate * 100).toFixed(1)}%
                      </td>
                      <td className={`py-2 text-right ${changeColor}`}>
                        {changeFormatted}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className='mt-4 text-sm text-gray-400'>
            <p>
              *Interest rates affect all outstanding loans and future loan
              applications. Higher credit scores can help secure better interest
              rates in the future.
            </p>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className='bg-gray-700 p-4 rounded'>
          <h3 className='text-lg font-medium mb-3'>Payment History</h3>

          <div className='h-[400px] overflow-y-auto'>
            <table className='min-w-full'>
              <thead>
                <tr className='border-b border-gray-600'>
                  <th className='py-2 text-left'>Date</th>
                  <th className='py-2 text-right'>Payment</th>
                  <th className='py-2 text-right'>Admin Fee</th>
                  <th className='py-2 text-right'>Total</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.length > 0 ? (
                  paymentHistory.map((payment, index) => (
                    <tr key={index} className='border-b border-gray-700'>
                      <td className='py-2 text-left'>
                        {formatDate(payment.date)}
                      </td>
                      <td className='py-2 text-right text-green-400'>
                        ${payment.amount.toLocaleString()}
                      </td>
                      <td className='py-2 text-right text-red-400'>
                        ${payment.adminFee.toLocaleString()}
                      </td>
                      <td className='py-2 text-right'>
                        ${(payment.amount + payment.adminFee).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className='py-4 text-center text-gray-400'>
                      No payment history yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {paymentHistory.length > 0 && (
            <div className='mt-4 p-3 bg-gray-800 rounded'>
              <div className='flex justify-between text-sm'>
                <span className='font-medium'>Total Payments:</span>
                <span>
                  $
                  {paymentHistory
                    .reduce((sum, p) => sum + p.amount, 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='font-medium'>Total Fees Paid:</span>
                <span>
                  $
                  {paymentHistory
                    .reduce((sum, p) => sum + p.adminFee, 0)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "protection" && (
        <div className='bg-gray-700 p-4 rounded'>
          <h3 className='text-lg font-medium mb-4'>Interest Rate Protection</h3>

          <div className='mb-4 p-4 bg-gray-800 rounded'>
            <p className='mb-3'>
              Protect yourself from interest rate fluctuations by purchasing an
              interest rate cap. This ensures your loan interest rate will never
              exceed the selected cap rate, regardless of market conditions.
            </p>

            {rateProtection && rateProtection.active ? (
              <div className='bg-green-900/30 p-3 rounded mb-4'>
                <h4 className='font-medium mb-1'>
                  Your Current Protection Plan
                </h4>
                <div className='flex justify-between mb-1'>
                  <span>Interest Rate Cap:</span>
                  <span className='text-green-400'>
                    {(rateProtection.capRate * 100).toFixed(2)}%
                  </span>
                </div>
                <div className='flex justify-between mb-3'>
                  <span>Monthly Cost:</span>
                  <span>${rateProtection.monthlyCost.toLocaleString()}</span>
                </div>
                <button
                  className='w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded'
                  onClick={onCancelRateProtection}
                >
                  Cancel Protection Plan
                </button>
              </div>
            ) : (
              <>
                <div className='mb-4'>
                  <h4 className='font-medium mb-2'>
                    Available Protection Plans
                  </h4>

                  {totalDebt > 0 ? (
                    <div className='space-y-3'>
                      {[
                        {
                          cap: currentInterestRate + 0.01,
                          cost: Math.round(totalDebt * 0.0005)
                        },
                        {
                          cap: currentInterestRate + 0.02,
                          cost: Math.round(totalDebt * 0.0003)
                        },
                        {
                          cap: currentInterestRate + 0.03,
                          cost: Math.round(totalDebt * 0.0002)
                        }
                      ].map((plan, index) => (
                        <div
                          key={index}
                          className='bg-gray-700 p-3 rounded border border-gray-600'
                        >
                          <div className='flex justify-between mb-1'>
                            <span>Interest Rate Cap:</span>
                            <span>{(plan.cap * 100).toFixed(2)}%</span>
                          </div>
                          <div className='flex justify-between mb-2'>
                            <span>Monthly Cost:</span>
                            <span>${plan.cost.toLocaleString()}</span>
                          </div>
                          <button
                            className='w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded'
                            onClick={() => onPurchaseRateProtection?.(plan.cap)}
                            disabled={playerMoney < plan.cost}
                          >
                            Purchase Protection
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className='text-gray-400 italic'>
                      You need an active loan to purchase interest rate
                      protection.
                    </p>
                  )}
                </div>

                <div className='bg-blue-900/20 p-3 rounded'>
                  <h4 className='font-medium mb-1'>How It Works</h4>
                  <p className='text-sm text-gray-300'>
                    Rate protection plans provide a ceiling on your interest
                    rate regardless of market fluctuations. The monthly cost
                    depends on your current debt and how close you set the cap
                    to the current rate. A cap closer to the current rate is
                    more expensive but provides better protection.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate loan approval probability
export function calculateLoanApproval(
  creditScore: number,
  totalDebt: number,
  assetValue: number,
  maxLoanToValueRatio: number
): number {
  // Base probability from credit score (50-100%)
  const creditFactor = Math.min(100, 50 + creditScore / 20);

  // Debt factor (0-100%)
  let debtFactor = 100;
  if (assetValue > 0) {
    const currentRatio = totalDebt / assetValue;
    debtFactor = Math.max(0, 100 * (1 - currentRatio / maxLoanToValueRatio));
  }

  // Calculate final probability
  const probability = Math.min(100, (creditFactor + debtFactor) / 2);

  return Math.round(probability);
}
