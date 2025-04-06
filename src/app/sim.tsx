"use client";
import React, { useState, useEffect, useCallback } from "react";
import { generateRandomProperties } from "./utils/generateRandomProperties.util";
import {
  LeaseApplication,
  Property,
  TenantEvent,
  PropertyType,
  GameEvent,
  EventImpactType,
  EventSeverity
} from "./types";
import { Tips } from "./components/tabs/tips.component";
import { Settings } from "./components/tabs/settings.component";
import { Reports } from "./components/tabs/reports.component";
import { Listings } from "./components/tabs/listings.component";
import { MyProperties } from "./components/tabs/my-properties.component";
import { Bank, calculateLoanApproval } from "./components/tabs/bank.component";
import { Taxes } from "./components/tabs/taxes.component";
import {
  calculateTotalPropertyTax,
  calculateRentalIncomeTax,
  calculateCapitalGainsTax
} from "./utils/calculateTaxes.util";
import {
  generateLeaseApplications,
  calculateTenantEventProbability
} from "./utils/generateTenant.util";
import LeaseApplicationModal from "./components/modals/lease-application-modal.component";
import {
  checkForNewEvents,
  updateActiveEvents,
  calculateEventImpact,
  selectEventChoice,
  checkForRelatedEvents
} from "./utils/events.util";
import EventsBanner from "./components/events/events-banner.component";
import EventDetailsModal from "./components/modals/event-details-modal.component";

// Define tab types
type TabType =
  | "listings"
  | "myProperties"
  | "reports"
  | "bank"
  | "taxes"
  | "settings"
  | "tips";

enum TIME_SPEED {
  SLOW = 1000,
  NORMAL = 500,
  FAST = 100
}

// Initial values for banking
const INITIAL_CREDIT_SCORE = 600;
const INITIAL_MAX_LOAN = 1000000;
const INITIAL_LOAN_TO_VALUE_RATIO = 0.7; // Maximum ratio of loan to asset value allowed by bank
const ADMIN_FEE_FIXED = 25; // Fixed admin fee per payment ($25)
const ADMIN_FEE_PERCENT = 0.005; // Percentage admin fee (0.5% of payment)

const initialProperties = generateRandomProperties(20); // Start with 20 properties

const RealEstateSim: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [playerMoney, setPlayerMoney] = useState<number>(250000); // Start with more realistic $250k
  const [totalDebt, setTotalDebt] = useState<number>(0);
  const [monthlyRepayment, setMonthlyRepayment] = useState<number>(0);
  const [tickRate, setTickRate] = useState<number>(5000); // 1 second
  const [paused, setPaused] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("listings");

  // Banking state
  const [bankCreditScore, setBankCreditScore] =
    useState<number>(INITIAL_CREDIT_SCORE);
  const [maxLoanAmount, setMaxLoanAmount] = useState<number>(INITIAL_MAX_LOAN);
  const [maxLoanToValueRatio, setMaxLoanToValueRatio] = useState<number>(
    INITIAL_LOAN_TO_VALUE_RATIO
  );
  const [paymentHistory, setPaymentHistory] = useState<
    { date: Date; amount: number; adminFee: number }[]
  >([]);
  const [consecutivePayments, setConsecutivePayments] = useState<number>(0);
  const [missedPayments, setMissedPayments] = useState<number>(0);

  // Variable interest rate
  const [baseInterestRate, setBaseInterestRate] = useState<number>(0.05); // Starting at 5%
  const [interestRateHistory, setInterestRateHistory] = useState<
    { date: Date; rate: number }[]
  >([{ date: new Date(), rate: 0.05 }]);
  const [nextRateChangeDate, setNextRateChangeDate] = useState<Date>(() => {
    // Set first rate change 3 months from now
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date;
  });

  // Add tax-related state
  const [monthlyTaxesPaid, setMonthlyTaxesPaid] = useState<{
    propertyTax: number;
    incomeTax: number;
  }>({
    propertyTax: 0,
    incomeTax: 0
  });
  const [yearlyTaxesPaid, setYearlyTaxesPaid] = useState<number>(0);
  const [recentCapitalGains, setRecentCapitalGains] = useState<
    {
      property: string;
      purchasePrice: number;
      salePrice: number;
      holdingPeriodMonths: number;
      taxPaid: number;
    }[]
  >([]);

  const [propertyWithApplications, setPropertyWithApplications] =
    useState<Property | null>(null);
  const [showLeaseApplications, setShowLeaseApplications] =
    useState<boolean>(false);

  // Property management outsourcing state
  const [outsourcedProperties, setOutsourcedProperties] = useState<Set<number>>(
    new Set()
  );
  const [propertyManager, setPropertyManager] = useState<{
    hired: boolean;
    fee: number;
    efficiency: number;
  }>({
    hired: false,
    fee: 500, // Monthly fee
    efficiency: 0.85 // 85% efficiency
  });

  // Events state
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [activeEvents, setActiveEvents] = useState<GameEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<GameEvent | null>(null);
  const [showEventDetails, setShowEventDetails] = useState<boolean>(false);

  // Rate protection state
  const [rateProtection, setRateProtection] = useState<{
    active: boolean;
    capRate: number;
    monthlyCost: number;
  }>({
    active: false,
    capRate: 0,
    monthlyCost: 0
  });

  // Calculate total asset value
  const totalAssetValue = properties.reduce(
    (sum, prop) => sum + (prop.owner === "Player" ? prop.value : 0),
    0
  );

  // Calculate current debt ratio (different from the max loan-to-value ratio)
  const currentDebtRatio =
    totalAssetValue > 0 ? totalDebt / totalAssetValue : 0;

  // Calculate current admin fee for a payment
  const calculateAdminFee = useCallback((paymentAmount: number) => {
    if (paymentAmount <= 0) {
      return 0;
    }

    return ADMIN_FEE_FIXED + paymentAmount * ADMIN_FEE_PERCENT;
  }, []);

  const togglePause = () => {
    setPaused((prev) => !prev);
  };

  const togglePropertyManager = () => {
    setPropertyManager((prev) => ({
      ...prev,
      hired: !prev.hired
    }));

    if (!propertyManager.hired) {
      setToastMessage(
        "Property manager hired! They'll handle tenant issues and find new renters."
      );
    } else {
      setToastMessage("Property manager has been dismissed.");
    }
    setTimeout(() => setToastMessage(null), 5000);
  };

  const toggleOutsourceProperty = (propertyId: number) => {
    setOutsourcedProperties((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId);
      } else {
        newSet.add(propertyId);
      }
      return newSet;
    });
  };

  const handleEventClick = useCallback((event: GameEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  }, []);

  const handleEventChoice = useCallback(
    (eventId: string, choiceId: string) => {
      const result = selectEventChoice(events, eventId, choiceId, playerMoney);

      if (result.success) {
        setEvents(result.events);
        setPlayerMoney((prev) => prev + result.moneyChange);
        setToastMessage(result.message);
        setTimeout(() => setToastMessage(null), 5000);
      } else {
        setToastMessage(result.message);
        setTimeout(() => setToastMessage(null), 5000);
      }
    },
    [events, playerMoney]
  );

  const handlePurchaseRateProtection = useCallback(
    (capRate: number) => {
      const rateGap = capRate - baseInterestRate;
      let monthlyCost = 0;

      if (rateGap <= 0.01) {
        monthlyCost = Math.round(totalDebt * 0.0005);
      } else if (rateGap <= 0.02) {
        monthlyCost = Math.round(totalDebt * 0.0003);
      } else {
        monthlyCost = Math.round(totalDebt * 0.0002);
      }

      if (playerMoney < monthlyCost) {
        setToastMessage("You don't have enough money for the first payment");
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      setRateProtection({
        active: true,
        capRate,
        monthlyCost
      });

      setPlayerMoney((prev) => prev - monthlyCost);

      setToastMessage(
        `Interest rate protection purchased! Your rate will not exceed ${(
          capRate * 100
        ).toFixed(2)}%`
      );
      setTimeout(() => setToastMessage(null), 5000);
    },
    [baseInterestRate, totalDebt, playerMoney]
  );

  const handleCancelRateProtection = useCallback(() => {
    setRateProtection({
      active: false,
      capRate: 0,
      monthlyCost: 0
    });

    setToastMessage("Interest rate protection plan canceled.");
    setTimeout(() => setToastMessage(null), 5000);
  }, []);

  useEffect(() => {
    setActiveEvents(events.filter((event) => event.isActive));
  }, [events]);

  useEffect(() => {
    if (paused) return;

    const eventInterval = setInterval(() => {
      setEvents((prevEvents) => {
        const updatedEvents = updateActiveEvents(prevEvents, currentDate);
        const newEvents = checkForNewEvents(updatedEvents, currentDate);
        const relatedEvents = checkForRelatedEvents(
          [...updatedEvents, ...newEvents],
          currentDate
        );

        if (newEvents.length > 0 || relatedEvents.length > 0) {
          const newEventCount = newEvents.length + relatedEvents.length;
          const majorEvents = [...newEvents, ...relatedEvents].filter(
            (e) => e.severity === EventSeverity.MAJOR
          );

          if (majorEvents.length > 0) {
            setToastMessage(
              `Warning: ${majorEvents.length} major event${
                majorEvents.length > 1 ? "s" : ""
              } have occurred!`
            );
          } else {
            setToastMessage(
              `${newEventCount} new event${
                newEventCount > 1 ? "s" : ""
              } have occurred.`
            );
          }
          setTimeout(() => setToastMessage(null), 5000);
        }

        return [...updatedEvents, ...newEvents, ...relatedEvents];
      });
    }, tickRate * 10);

    return () => {
      clearInterval(eventInterval);
    };
  }, [paused, currentDate, tickRate]);

  // Process random tenant events like maintenance requests, etc.
  const processRandomTenantEvents = useCallback(() => {
    const rentedProperties = properties.filter(
      (p) => p.owner === "Player" && p.isRented && p.currentTenant
    );

    if (rentedProperties.length === 0) return;

    // Select a random property
    const randomProperty =
      rentedProperties[Math.floor(Math.random() * rentedProperties.length)];
    const tenant = randomProperty.currentTenant!;

    // Decide event type based on tenant probabilities
    const eventType = Math.random() < 0.7 ? "DAMAGE" : "COMPLAINT";

    if (
      eventType === "DAMAGE" &&
      Math.random() < calculateTenantEventProbability(tenant, "DAMAGE")
    ) {
      // Calculate damage cost based on property value
      const damageCost = Math.round(
        randomProperty.value * (0.001 + Math.random() * 0.005)
      );

      // Create tenant event
      const tenantEvent: TenantEvent = {
        type: "DAMAGE",
        date: new Date(currentDate),
        description: `Repairs needed: $${damageCost}`,
        financialImpact: 0
      };

      // Update property and deduct money if not outsourced
      setProperties((prev) =>
        prev.map((p) =>
          p.id === randomProperty.id
            ? { ...p, tenantEvents: [...p.tenantEvents, tenantEvent] }
            : p
        )
      );

      if (
        !outsourcedProperties.has(randomProperty.id) &&
        !propertyManager.hired
      ) {
        setPlayerMoney((prev) => prev - damageCost);
        setToastMessage(
          `Repairs needed at ${randomProperty.address}. Cost: $${damageCost}`
        );
        setTimeout(() => setToastMessage(null), 5000);
      }
    }
  }, [properties, currentDate, outsourcedProperties, propertyManager]);
  // Monthly rent collection and tenant update interval
  useEffect(() => {
    if (paused) return;

    const rentInterval = setInterval(() => {
      // Once a month, collect rent and update tenant situations
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);

      // On the first of the month
      if (newDate.getDate() === 1) {
        let totalRentalIncome = 0;
        let totalPropertyTax = 0;

        const updatedProperties = properties.map((property) => {
          if (property.owner !== "Player") return property;

          // Calculate property tax
          const monthlyPropertyTax = calculateTotalPropertyTax([property]) / 12;
          totalPropertyTax += monthlyPropertyTax;

          // Handle rental income for rented properties
          if (property.isRented && property.currentTenant) {
            const eventImpact = calculateEventImpact(
              events.filter((e) => e.isActive),
              EventImpactType.TENANT_QUALITY
            );

            const tenant = property.currentTenant;
            const willPay =
              Math.random() < tenant.paymentProbability + eventImpact;

            if (willPay) {
              totalRentalIncome += property.rentPrice;

              // Add tenant event for payment
              const tenantEvent: TenantEvent = {
                type: "RENT_PAID",
                date: new Date(newDate),
                description: "Rent paid on time",
                financialImpact: property.rentPrice
              };

              return {
                ...property,
                tenantEvents: [...property.tenantEvents, tenantEvent]
              };
            } else {
              // Add tenant event for missed payment
              const tenantEvent: TenantEvent = {
                type: "RENT_MISSED",
                date: new Date(newDate),
                description: "Rent payment missed",
                financialImpact: -property.rentPrice
              };

              return {
                ...property,
                tenantEvents: [...property.tenantEvents, tenantEvent]
              };
            }
          }

          return property;
        });

        setProperties(updatedProperties);

        // Calculate income tax on rental income
        const rentalIncomeTax = calculateRentalIncomeTax(
          totalRentalIncome,
          monthlyTaxesPaid.propertyTax
        );

        // Update player money with rental income minus taxes
        setPlayerMoney(
          (prev) =>
            prev + totalRentalIncome - totalPropertyTax - rentalIncomeTax
        );

        // Update monthly taxes paid
        setMonthlyTaxesPaid({
          propertyTax: totalPropertyTax,
          incomeTax: rentalIncomeTax
        });

        // Update yearly taxes for annual reporting
        setYearlyTaxesPaid((prev) => prev + totalPropertyTax + rentalIncomeTax);

        // Property manager fee if hired
        if (propertyManager.hired) {
          setPlayerMoney((prev) => prev - propertyManager.fee);
        }
      }

      // Process random tenant events (repairs, issues, etc.)
      if (Math.random() < 0.1) {
        // 10% chance each day of tenant event
        processRandomTenantEvents();
      }
    }, tickRate);

    return () => {
      clearInterval(rentInterval);
    };
  }, [
    paused,
    currentDate,
    events,
    properties,
    tickRate,
    propertyManager,
    monthlyTaxesPaid.propertyTax,
    processRandomTenantEvents
  ]);

  useEffect(() => {
    if (paused) return;

    const mortgageInterval = setInterval(() => {
      if (totalDebt > 0 && monthlyRepayment > 0) {
        const adminFee = calculateAdminFee(monthlyRepayment);
        const totalPaymentDue = monthlyRepayment + adminFee;

        if (playerMoney >= totalPaymentDue) {
          const newLoanAmount = totalDebt - monthlyRepayment;
          setTotalDebt(Math.max(newLoanAmount, 0));
          setPlayerMoney((prevMoney) => prevMoney - totalPaymentDue);

          setPaymentHistory((prev) => [
            { date: new Date(currentDate), amount: monthlyRepayment, adminFee },
            ...prev
          ]);

          setConsecutivePayments((prev) => prev + 1);
          setMissedPayments(0);

          if (consecutivePayments % 3 === 0) {
            setBankCreditScore((prev) => Math.min(850, prev + 5));
            setMaxLoanAmount((prev) => Math.min(5000000, prev * 1.05));
            setMaxLoanToValueRatio((prev) => Math.min(0.9, prev + 0.01));
          }
        } else {
          setConsecutivePayments(0);
          setMissedPayments((prev) => prev + 1);

          setBankCreditScore((prev) => Math.max(300, prev - 15));

          if (missedPayments >= 3) {
            setMaxLoanAmount((prev) =>
              Math.max(INITIAL_MAX_LOAN / 2, prev * 0.9)
            );
            setMaxLoanToValueRatio((prev) => Math.max(0.5, prev - 0.02));
          }

          setToastMessage(
            "You missed a loan payment! Your credit score has decreased."
          );
          setTimeout(() => setToastMessage(null), 5000);
        }
      }

      if (currentDate >= nextRateChangeDate) {
        const prevRate = baseInterestRate;
        const fluctuation = (Math.random() - 0.5) * 0.01;

        const eventImpact = calculateEventImpact(
          events.filter((e) => e.isActive),
          EventImpactType.INTEREST_RATE
        );

        let newRate = Math.max(
          0.02,
          Math.min(0.12, prevRate + fluctuation + eventImpact)
        );

        if (rateProtection.active && newRate > rateProtection.capRate) {
          newRate = rateProtection.capRate;
        }

        setBaseInterestRate(newRate);

        setInterestRateHistory((prev) => [
          { date: new Date(currentDate), rate: newRate },
          ...prev
        ]);

        const nextDate = new Date(currentDate);
        nextDate.setMonth(nextDate.getMonth() + 3);
        setNextRateChangeDate(nextDate);

        if (totalDebt > 0) {
          setMonthlyRepayment(totalDebt * (newRate / 12));

          const direction = newRate > prevRate ? "increased" : "decreased";
          setToastMessage(
            `Interest rates have ${direction} to ${(newRate * 100).toFixed(
              1
            )}%!`
          );
          setTimeout(() => setToastMessage(null), 5000);
        }
      }
    }, tickRate);

    return () => {
      clearInterval(mortgageInterval);
    };
  }, [
    paused,
    tickRate,
    currentDate,
    nextRateChangeDate,
    baseInterestRate,
    totalDebt,
    events,
    rateProtection,
    calculateAdminFee,
    consecutivePayments,
    missedPayments,
    playerMoney,
    monthlyRepayment
  ]);

  useEffect(() => {
    if (paused || !rateProtection.active) return;

    const protectionPaymentInterval = setInterval(() => {
      if (playerMoney >= rateProtection.monthlyCost) {
        setPlayerMoney((prev) => prev - rateProtection.monthlyCost);
      } else {
        setRateProtection({
          active: false,
          capRate: 0,
          monthlyCost: 0
        });

        setToastMessage(
          "Interest rate protection cancelled due to missed payment."
        );
        setTimeout(() => setToastMessage(null), 5000);
      }
    }, tickRate);

    return () => {
      clearInterval(protectionPaymentInterval);
    };
  }, [paused, rateProtection, playerMoney, tickRate]);

  function handleLoan(amount: number): void {
    if (amount <= 0) {
      setToastMessage("Loan amount must be greater than zero.");
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    if (amount > maxLoanAmount) {
      setToastMessage(
        `You cannot take a loan greater than your maximum loan amount of $${maxLoanAmount.toLocaleString()}.`
      );
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const newTotalDebt = totalDebt + amount;
    const newDebtRatio =
      totalAssetValue > 0 ? newTotalDebt / totalAssetValue : 1;

    if (newDebtRatio > maxLoanToValueRatio) {
      setToastMessage(
        `This loan would exceed your maximum allowed debt ratio of ${(
          maxLoanToValueRatio * 100
        ).toFixed(1)}%.`
      );
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const baseApprovalProbability = calculateLoanApproval(
      bankCreditScore,
      totalDebt,
      totalAssetValue,
      maxLoanToValueRatio
    );

    const eventImpact = calculateEventImpact(
      events.filter((e) => e.isActive),
      EventImpactType.LOAN_APPROVAL
    );

    const adjustedApprovalProbability =
      baseApprovalProbability + eventImpact * 100;

    if (Math.random() * 100 > adjustedApprovalProbability) {
      setToastMessage(
        `Loan application denied. Improve your credit score or reduce debt ratio.`
      );
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    setPlayerMoney((prevMoney) => prevMoney + amount);
    setTotalDebt((prevDebt) => prevDebt + amount);
    setMonthlyRepayment(
      (prevDebt) => (prevDebt + amount) * (baseInterestRate / 12)
    );

    setToastMessage(`You took a loan of $${amount.toLocaleString()}.`);
    setTimeout(() => setToastMessage(null), 5000);
  }

  function handleRent(propertyId: number) {
    const propertyIndex = properties.findIndex(
      (property) => property.id === propertyId
    );
    if (propertyIndex !== -1) {
      const property = properties[propertyIndex];

      if (property.type === PropertyType.LAND) {
        setToastMessage(
          "Land properties cannot be rented. Consider developing it in the future."
        );
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      if (property.isRented) {
        const updatedProperties = [...properties];
        updatedProperties[propertyIndex] = {
          ...property,
          isRented: false,
          rentee: null,
          currentTenant: undefined
        };
        setProperties(updatedProperties);
        return;
      }

      const tenantQualityImpact = calculateEventImpact(
        events.filter((e) => e.isActive),
        EventImpactType.TENANT_QUALITY,
        property.location,
        property.type
      );

      const baseApplicationCount = 3 + Math.floor(Math.random() * 3);
      const adjustedApplicationCount = Math.max(
        1,
        Math.round(baseApplicationCount * (1 + tenantQualityImpact))
      );

      const applications = generateLeaseApplications(
        property.rentPrice,
        adjustedApplicationCount,
        tenantQualityImpact
      );

      const updatedProperties = [...properties];
      updatedProperties[propertyIndex] = {
        ...property,
        leaseApplications: applications
      };

      setProperties(updatedProperties);
      setPropertyWithApplications(updatedProperties[propertyIndex]);
      setShowLeaseApplications(true);
    } else {
      console.error(`Property with ID ${propertyId} not found`);
    }
  }

  function handlePropertyAction(propertyId: number): void {
    const propertyIndex = properties.findIndex((p) => p.id === propertyId);
    if (propertyIndex === -1) return;

    const property = properties[propertyIndex];

    // If the player owns the property already, sell it
    if (property.owner === "Player") {
      const salePrice = property.value; // Selling at current value

      // Calculate capital gains tax
      const purchaseDate = property.purchaseDate || new Date();
      const holdingPeriodMonths = Math.round(
        (currentDate.getTime() - purchaseDate.getTime()) /
          (30 * 24 * 60 * 60 * 1000)
      );

      const taxPaid = calculateCapitalGainsTax(
        property.marketPrice,
        salePrice,
        holdingPeriodMonths
      );

      const netProceeds = salePrice - taxPaid;

      // Update capital gains history
      setRecentCapitalGains((prev) => [
        {
          property: property.address,
          purchasePrice: property.marketPrice,
          salePrice,
          holdingPeriodMonths,
          taxPaid
        },
        ...prev.slice(0, 9) // Keep only 10 most recent
      ]);

      // Update property and player state
      const updatedProperties = [...properties];
      updatedProperties[propertyIndex] = {
        ...property,
        owner: null,
        isRented: false,
        rentee: null,
        currentTenant: undefined,
        purchaseDate: undefined
      };

      setProperties(updatedProperties);
      setPlayerMoney((prev) => prev + netProceeds);

      setToastMessage(
        `Sold ${property.address} for $${salePrice.toLocaleString()}`
      );
      setTimeout(() => setToastMessage(null), 5000);
    }
    // Otherwise, buy the property
    else {
      if (playerMoney < property.marketPrice) {
        setToastMessage("You don't have enough money to buy this property.");
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      setPlayerMoney((prev) => prev - property.marketPrice);

      const updatedProperties = [...properties];
      updatedProperties[propertyIndex] = {
        ...property,
        owner: "Player",
        purchaseDate: new Date(currentDate)
      };

      setProperties(updatedProperties);

      setToastMessage(
        `Purchased ${
          property.address
        } for $${property.marketPrice.toLocaleString()}`
      );
      setTimeout(() => setToastMessage(null), 5000);
    }
  }

  function handleRenovate(propertyId: number): void {
    const propertyIndex = properties.findIndex((p) => p.id === propertyId);
    if (propertyIndex === -1) return;

    const property = properties[propertyIndex];
    const renovationCost = Math.round(property.value * 0.05);

    // Check if player has enough money
    if (playerMoney < renovationCost) {
      setToastMessage(
        `You need $${renovationCost.toLocaleString()} to renovate this property.`
      );
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    // Calculate renovation cost impact from events
    const renovationCostImpact = calculateEventImpact(
      events.filter((e) => e.isActive),
      EventImpactType.RENOVATION_COST
    );

    // Apply renovation cost impact
    const adjustedRenovationCost = Math.round(
      renovationCost * (1 + renovationCostImpact)
    );

    setPlayerMoney((prev) => prev - adjustedRenovationCost);

    const updatedProperties = [...properties];
    updatedProperties[propertyIndex] = {
      ...property,
      value: Math.round(property.value * 1.1), // 10% increase in value
      renovationBonusPercentage: Math.min(
        100,
        property.renovationBonusPercentage + 20
      ) // Add 20% to renovation bonus (max 100%)
    };

    setProperties(updatedProperties);

    setToastMessage(
      `Renovated ${
        property.address
      } for $${adjustedRenovationCost.toLocaleString()}`
    );
    setTimeout(() => setToastMessage(null), 5000);
  }

  function handleEvictTenant(propertyId: number): void {
    const propertyIndex = properties.findIndex((p) => p.id === propertyId);
    if (propertyIndex === -1) return;

    const property = properties[propertyIndex];

    // Check if property has a tenant
    if (!property.isRented || !property.currentTenant) {
      setToastMessage("This property doesn't have a tenant to evict.");
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const evictionCost = 1000; // Base cost for eviction

    // Check if player has enough money
    if (playerMoney < evictionCost) {
      setToastMessage(
        `You need $${evictionCost.toLocaleString()} to cover legal fees for eviction.`
      );
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    // Deduct cost from player money
    setPlayerMoney((prev) => prev - evictionCost);

    // Add eviction to tenant history and events
    const tenantEvent: TenantEvent = {
      type: "LEASE_BREAK",
      date: new Date(currentDate),
      description: "Tenant was evicted",
      financialImpact: 0
    };

    const updatedProperties = [...properties];
    updatedProperties[propertyIndex] = {
      ...property,
      isRented: false,
      rentee: null,
      currentTenant: undefined,
      tenantHistory: [...property.tenantHistory, property.currentTenant],
      tenantEvents: [...property.tenantEvents, tenantEvent]
    };

    setProperties(updatedProperties);
    setToastMessage(`Evicted tenant from ${property.address}`);
    setTimeout(() => setToastMessage(null), 5000);
  }

  function handleAcceptApplication(
    property: Property,
    application: LeaseApplication
  ): void {
    const propertyIndex = properties.findIndex((p) => p.id === property.id);
    if (propertyIndex === -1) return;

    // Update property with the new tenant
    const updatedProperties = [...properties];
    updatedProperties[propertyIndex] = {
      ...property,
      isRented: true,
      rentee: application.tenant.name,
      currentTenant: application.tenant,
      leaseStart: new Date(currentDate),
      leaseLength: application.desiredLeaseLength
    };

    setProperties(updatedProperties);
    setShowLeaseApplications(false);
    setPropertyWithApplications(null);

    // Credit application fee to player if not outsourced
    if (!outsourcedProperties.has(property.id)) {
      setPlayerMoney((prev) => prev + application.applicationFee);
    }

    setToastMessage(
      `Accepted tenant ${application.tenant.name} for ${property.address}`
    );
    setTimeout(() => setToastMessage(null), 5000);
  }

  function handleRepayLoan(amount: number): void {
    // Early repayment fee (2% of remaining balance)
    const earlyRepaymentFee = Math.round(amount * 0.02);
    const totalPayment = amount + earlyRepaymentFee;

    if (playerMoney < totalPayment) {
      setToastMessage(
        `You need $${totalPayment.toLocaleString()} to repay this loan with fees.`
      );
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    // Update player money and debt
    setPlayerMoney((prev) => prev - totalPayment);
    setTotalDebt((prev) => prev - amount);
    setMonthlyRepayment(() =>
      totalDebt - amount > 0
        ? (totalDebt - amount) * (baseInterestRate / 12)
        : 0
    );

    // Add to payment history
    setPaymentHistory((prev) => [
      {
        date: new Date(currentDate),
        amount,
        adminFee: earlyRepaymentFee
      },
      ...prev
    ]);

    setToastMessage(`Repaid $${amount.toLocaleString()} of your loan.`);
    setTimeout(() => setToastMessage(null), 5000);
  }

  // Time progression
  useEffect(() => {
    if (paused) return;

    const clockInterval = setInterval(() => {
      // Update date and handle time-based processes
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);
    }, tickRate);

    return () => {
      clearInterval(clockInterval);
    };
  }, [currentDate, paused, tickRate]);

  return (
    <div className='min-h-screen bg-gray-900 text-white p-4'>
      <h1 className='text-3xl font-bold mb-4'>Real Estate Simulator</h1>

      <div className='bg-gray-800 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4'>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Date</span>
          <span className='text-lg font-semibold'>
            {new Intl.DateTimeFormat("en-US").format(currentDate)}
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Cash</span>
          <span className='text-lg font-semibold text-green-400'>
            ${playerMoney.toLocaleString()}
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Debt</span>
          <span className='text-lg font-semibold text-red-400'>
            ${totalDebt.toLocaleString()}
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Current Debt Ratio</span>
          <span className='text-lg font-semibold'>
            {(currentDebtRatio * 100).toFixed(1)}%
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Monthly Payment</span>
          <span className='text-lg font-semibold'>
            $
            {(
              monthlyRepayment + calculateAdminFee(monthlyRepayment)
            ).toLocaleString()}
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Monthly Tax</span>
          <span className='text-lg font-semibold text-red-400'>
            $
            {(
              monthlyTaxesPaid.propertyTax + monthlyTaxesPaid.incomeTax
            ).toLocaleString()}
          </span>
        </div>
      </div>

      <div className='flex gap-2 my-4 flex-wrap'>
        <button
          className={`bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded ${
            paused ? "border-2 border-red-500" : ""
          }`}
          onClick={togglePause}
        >
          {paused ? "▶️ Resume" : "⏸️ Pause"}
        </button>
        <button
          className='bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded'
          onClick={() => {
            setPaused(false);
            setTickRate(TIME_SPEED.SLOW);
          }}
        >
          1x
        </button>
        <button
          className='bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded'
          onClick={() => {
            setPaused(false);
            setTickRate(TIME_SPEED.NORMAL);
          }}
        >
          5x
        </button>
        <button
          className='bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded'
          onClick={() => {
            setPaused(false);
            setTickRate(TIME_SPEED.FAST);
          }}
        >
          10x
        </button>
      </div>

      <div className='mb-4 border-b border-gray-700'>
        <nav className='flex flex-wrap -mb-px'>
          <button
            className={`px-4 py-2 font-medium text-sm mr-2 ${
              activeTab === "listings"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("listings")}
          >
            Market Listings ({properties.filter((p) => p.owner === null).length}
            )
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm mr-2 ${
              activeTab === "myProperties"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("myProperties")}
          >
            My Properties (
            {properties.filter((p) => p.owner === "Player").length})
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm mr-2 ${
              activeTab === "bank"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("bank")}
          >
            Banking
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm mr-2 ${
              activeTab === "reports"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("reports")}
          >
            Financial Reports
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm mr-2 ${
              activeTab === "taxes"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("taxes")}
          >
            Taxes
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm mr-2 ${
              activeTab === "settings"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            Settings
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "tips"
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("tips")}
          >
            Game Tips
          </button>
        </nav>
      </div>

      <EventsBanner
        activeEvents={activeEvents}
        onEventClick={handleEventClick}
      />

      {toastMessage && tickRate !== TIME_SPEED.FAST && (
        <div className='fixed top-4 right-4 bg-yellow-500 text-black p-4 rounded shadow-lg z-50 animate-pulse'>
          <span className='font-bold'>🏠 {toastMessage}</span>
        </div>
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          isOpen={showEventDetails}
          onClose={() => setShowEventDetails(false)}
          onMakeChoice={handleEventChoice}
          playerMoney={playerMoney}
        />
      )}

      {showLeaseApplications && propertyWithApplications && (
        <div className='fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-75'>
          <LeaseApplicationModal
            property={propertyWithApplications}
            applications={propertyWithApplications.leaseApplications || []}
            onClose={() => {
              setShowLeaseApplications(false);
              setPropertyWithApplications(null);
            }}
            onAcceptApplication={handleAcceptApplication}
          />
        </div>
      )}

      <div className='mt-4'>
        {activeTab === "listings" && (
          <Listings
            properties={properties}
            onBuyOrSell={handlePropertyAction}
            onRent={handleRent}
            onRenovate={handleRenovate}
            onEvictTenant={handleEvictTenant}
            playerMoney={playerMoney}
            handleAcceptApplication={handleAcceptApplication}
            setPaused={setPaused}
          />
        )}

        {activeTab === "myProperties" && (
          <MyProperties
            properties={properties}
            onBuyOrSell={handlePropertyAction}
            onRent={handleRent}
            onRenovate={handleRenovate}
            onEvictTenant={handleEvictTenant}
            playerMoney={playerMoney}
            outsourcedProperties={outsourcedProperties}
            onToggleOutsource={toggleOutsourceProperty}
            handleAcceptApplication={handleAcceptApplication}
            setPaused={setPaused}
          />
        )}

        {activeTab === "bank" && (
          <Bank
            playerMoney={playerMoney}
            totalDebt={totalDebt}
            monthlyRepayment={monthlyRepayment}
            currentInterestRate={baseInterestRate}
            bankCreditScore={bankCreditScore}
            maxLoanAmount={maxLoanAmount}
            maxLoanToValueRatio={maxLoanToValueRatio}
            currentDebtRatio={currentDebtRatio}
            paymentHistory={paymentHistory}
            interestRateHistory={interestRateHistory}
            consecutivePayments={consecutivePayments}
            nextRateChangeDate={nextRateChangeDate}
            onTakeLoan={handleLoan}
            onRepayLoan={handleRepayLoan}
            assetValue={totalAssetValue}
            adminFeeFixed={ADMIN_FEE_FIXED}
            adminFeePercent={ADMIN_FEE_PERCENT}
            currentDate={currentDate}
            rateProtection={rateProtection}
            onPurchaseRateProtection={handlePurchaseRateProtection}
            onCancelRateProtection={handleCancelRateProtection}
          />
        )}

        {activeTab === "reports" && (
          <Reports
            ownedProperties={properties.filter((p) => p.owner === "Player")}
            totalDebt={totalDebt}
            monthlyRepayment={monthlyRepayment}
            currentInterestRate={baseInterestRate}
            playerMoney={playerMoney}
          />
        )}

        {activeTab === "taxes" && (
          <Taxes
            properties={properties}
            monthlyRentalIncome={properties
              .filter((p) => p.owner === "Player" && p.isRented)
              .reduce((sum, p) => sum + p.rentPrice, 0)}
            monthlyExpenses={properties
              .filter((p) => p.owner === "Player")
              .reduce((sum, p) => sum + p.maintenanceCosts, 0)}
            recentCapitalGains={recentCapitalGains}
            fiscalYear={currentDate.getFullYear().toString()}
            totalTaxesPaidYTD={yearlyTaxesPaid}
          />
        )}

        {activeTab === "settings" && (
          <Settings
            tickRate={tickRate}
            setTickRate={setTickRate}
            paused={paused}
            setPaused={setPaused}
            propertyManager={propertyManager}
            togglePropertyManager={togglePropertyManager}
            outsourcedProperties={outsourcedProperties}
            ownedProperties={properties.filter((p) => p.owner === "Player")}
            toggleOutsourceProperty={toggleOutsourceProperty}
          />
        )}

        {activeTab === "tips" && <Tips />}
      </div>
    </div>
  );
};

export default RealEstateSim;
