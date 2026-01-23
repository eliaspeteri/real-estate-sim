"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  generateRandomProperties,
  generateRandomProperty
} from "./utils/generateRandomProperties.util";
import {
  LeaseApplication,
  Property,
  TenantEvent,
  Tenant,
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
  calculateTenantEventProbability,
  calculateListingImpact,
  extractListingKeywords
} from "./utils/generateTenant.util";
import { calculateRent } from "./utils/calculateRent.util";
import { calculateRenovationCost } from "./utils/calculateRenovationCost.util";
import { calculateBulldozeCost } from "./utils/bulldoze.util";
import { calculateValue } from "./utils/calculateValue.util";
import { calculateMaintenanceCost } from "./utils/calculateMaintenanceCost.util";
import {
  calculateEvictionCost,
  calculateEvictionDurationDays
} from "./utils/eviction.util";
import {
  PERMIT_DURATION_DAYS,
  CONSTRUCTION_DURATION_DAYS,
  calculatePermitCost,
  calculateConstructionCost
} from "./utils/development.util";
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
import { useSettings } from "./context/settings.context";

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

const INITIAL_AI_PLAYERS = [
  { id: "AI-1", name: "Cedar Capital", cash: 350000 },
  { id: "AI-2", name: "Northwind Realty", cash: 500000 }
];

const initialProperties = generateRandomProperties(20); // Start with 20 properties
const MARKET_TARGET_LISTINGS = 20;
const MARKET_MAX_DAYS = 90;
const NEW_LISTING_DAYS = 7;
const STATE_STORAGE_KEY = "real-estate-sim.state";
const NOTIFICATION_LIMIT = 50;

const reviveTenant = (tenant?: Tenant | null): Tenant | undefined => {
  if (!tenant) return undefined;
  return {
    ...tenant,
    leaseStart: tenant.leaseStart ? new Date(tenant.leaseStart) : undefined
  };
};

const deriveUnitCount = (property: Property): number => {
  if (property.units && property.units > 0) {
    return property.units;
  }

  if (
    [PropertyType.APARTMENT, PropertyType.SKYSCRAPER_CONDO].includes(
      property.type
    )
  ) {
    const unitSize = property.type === PropertyType.SKYSCRAPER_CONDO ? 35 : 45;
    return Math.min(50, Math.max(2, Math.floor(property.size / unitSize)));
  }

  if (property.type === PropertyType.MIXED_USE) {
    return Math.min(20, Math.max(2, Math.floor(property.size / 60)));
  }

  return 1;
};

const getUnitTenants = (property: Property): Tenant[] => {
  if (property.unitTenants && property.unitTenants.length > 0) {
    return property.unitTenants;
  }
  return property.currentTenant ? [property.currentTenant] : [];
};

const getMonthsElapsed = (startDate: Date, endDate: Date): number => {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  const total = years * 12 + months;
  if (endDate.getDate() < startDate.getDate()) {
    return Math.max(0, total - 1);
  }
  return Math.max(0, total);
};

const applyUnitState = (property: Property, unitTenants: Tenant[]) => {
  const units = deriveUnitCount(property);
  const occupiedUnits = Math.min(units, unitTenants.length);
  return {
    ...property,
    units,
    unitTenants,
    occupiedUnits,
    isRented: occupiedUnits > 0,
    currentTenant: unitTenants[0],
    rentee: unitTenants[0]?.name ?? null
  };
};

const reviveProperty = (property: Property): Property => {
  const revived = {
    ...property,
    buildingDate: property.buildingDate
      ? new Date(property.buildingDate)
      : new Date(),
    listedDate: property.listedDate
      ? new Date(property.listedDate)
      : new Date(),
    purchaseDate: property.purchaseDate
      ? new Date(property.purchaseDate)
      : undefined,
    purchasePrice:
      property.purchasePrice !== undefined
        ? property.purchasePrice
        : property.purchaseDate
          ? property.marketPrice
          : undefined,
    saleListedDate: property.saleListedDate
      ? new Date(property.saleListedDate)
      : undefined,
    leaseStart: property.leaseStart ? new Date(property.leaseStart) : undefined,
    currentTenant: reviveTenant(property.currentTenant),
    tenantHistory: (property.tenantHistory || []).map(
      (tenant) => reviveTenant(tenant) || tenant
    ),
    tenantEvents: (property.tenantEvents || []).map((event) => ({
      ...event,
      date: new Date(event.date)
    })),
    leaseApplications: (property.leaseApplications || []).map(
      (application) => ({
        ...application,
        applicationDate: application.applicationDate
          ? new Date(application.applicationDate)
          : new Date(),
        tenant: reviveTenant(application.tenant) || application.tenant
      })
    ),
    saleOffers: (property.saleOffers || []).map((offer) => ({
      ...offer,
      date: offer.date ? new Date(offer.date) : new Date()
    })),
    pendingEvictions: (property.pendingEvictions || []).map((eviction) => ({
      ...eviction,
      startDate: eviction.startDate ? new Date(eviction.startDate) : new Date()
    }))
  };

  const baseTenants = getUnitTenants(revived).map(
    (tenant) => reviveTenant(tenant) || tenant
  );

  return applyUnitState(
    {
      ...revived,
      unitTenants: baseTenants
    },
    baseTenants
  );
};

const reviveEvents = (events: GameEvent[]): GameEvent[] => {
  return events.map((event) => ({
    ...event,
    startDate: event.startDate ? new Date(event.startDate) : undefined,
    endDate: event.endDate ? new Date(event.endDate) : undefined
  }));
};

const RealEstateSim: React.FC = () => {
  const { formatCurrency, formatDate, taxRegion } = useSettings();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [playerMoney, setPlayerMoney] = useState<number>(250000); // Start with more realistic $250k
  const [totalDebt, setTotalDebt] = useState<number>(0);
  const [monthlyRepayment, setMonthlyRepayment] = useState<number>(0);
  const [tickRate, setTickRate] = useState<number>(5000); // 1 second
  const [paused, setPaused] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<
    { message: string; date: Date }[]
  >([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("listings");
  const [hasLoadedState, setHasLoadedState] = useState<boolean>(false);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const [aiPlayers, setAiPlayers] =
    useState<{ id: string; name: string; cash: number }[]>(INITIAL_AI_PLAYERS);
  const [realEstateAgent, setRealEstateAgent] = useState<{
    hired: boolean;
    commissionRate: number;
    negotiationRate: number;
  }>({
    hired: false,
    commissionRate: 0.01,
    negotiationRate: 0.02
  });

  // Events state
  const [events, setEvents] = useState<GameEvent[]>([]);
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

  const isNewBorrower = paymentHistory.length === 0 && totalDebt === 0;
  const newBorrowerLoanCapMultiplier = isNewBorrower ? 0.6 : 1;

  const activeEventsList = events.filter((event) => event.isActive);
  const loanApprovalEventImpact = calculateEventImpact(
    activeEventsList,
    EventImpactType.LOAN_APPROVAL
  );
  const eventAdjustedMaxLoanAmount = Math.max(
    0,
    Math.round(
      maxLoanAmount *
        (1 +
          calculateEventImpact(
            activeEventsList,
            EventImpactType.MAX_LOAN_AMOUNT
          )) *
        newBorrowerLoanCapMultiplier
    )
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

  const handleToggleNotifications = () => {
    setShowNotifications((prev) => {
      const next = !prev;
      if (next && notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
        notificationTimerRef.current = null;
      }
      return next;
    });
  };

  useEffect(() => {
    if (!toastMessage) return;
    setNotifications((prev) =>
      [{ message: toastMessage, date: new Date(currentDate) }, ...prev].slice(
        0,
        NOTIFICATION_LIMIT
      )
    );
  }, [toastMessage, currentDate]);

  useEffect(() => {
    if (!toastMessage) return;
    setShowNotifications(true);
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
    }
    notificationTimerRef.current = setTimeout(() => {
      setShowNotifications(false);
    }, 6000);
  }, [toastMessage, currentDate]);

  useEffect(() => {
    let cancelled = false;

    const applyLoadedState = (parsed: {
      properties?: Property[];
      currentDate?: string;
      playerMoney?: number;
      totalDebt?: number;
      monthlyRepayment?: number;
      tickRate?: number;
      paused?: boolean;
      activeTab?: TabType;
      bankCreditScore?: number;
      maxLoanAmount?: number;
      maxLoanToValueRatio?: number;
      paymentHistory?: { date: string; amount: number; adminFee: number }[];
      consecutivePayments?: number;
      missedPayments?: number;
      baseInterestRate?: number;
      interestRateHistory?: { date: string; rate: number }[];
      nextRateChangeDate?: string;
      monthlyTaxesPaid?: { propertyTax: number; incomeTax: number };
      yearlyTaxesPaid?: number;
      recentCapitalGains?: {
        property: string;
        purchasePrice: number;
        salePrice: number;
        holdingPeriodMonths: number;
        taxPaid: number;
      }[];
      outsourcedProperties?: number[];
      propertyManager?: { hired: boolean; fee: number; efficiency: number };
      realEstateAgent?: {
        hired: boolean;
        commissionRate: number;
        negotiationRate: number;
      };
      aiPlayers?: { id: string; name: string; cash: number }[];
      events?: GameEvent[];
      rateProtection?: {
        active: boolean;
        capRate: number;
        monthlyCost: number;
      };
      notifications?: { message: string; date: string }[];
    }) => {
      if (parsed.properties) {
        setProperties(
          parsed.properties.map((property) => reviveProperty(property))
        );
      }
      if (parsed.currentDate) setCurrentDate(new Date(parsed.currentDate));
      if (parsed.playerMoney !== undefined) setPlayerMoney(parsed.playerMoney);
      if (parsed.totalDebt !== undefined) setTotalDebt(parsed.totalDebt);
      if (parsed.monthlyRepayment !== undefined)
        setMonthlyRepayment(parsed.monthlyRepayment);
      if (parsed.tickRate !== undefined) setTickRate(parsed.tickRate);
      if (parsed.paused !== undefined) setPaused(parsed.paused);
      if (parsed.activeTab) setActiveTab(parsed.activeTab);
      if (parsed.bankCreditScore !== undefined)
        setBankCreditScore(parsed.bankCreditScore);
      if (parsed.maxLoanAmount !== undefined)
        setMaxLoanAmount(parsed.maxLoanAmount);
      if (parsed.maxLoanToValueRatio !== undefined)
        setMaxLoanToValueRatio(parsed.maxLoanToValueRatio);
      if (parsed.paymentHistory) {
        setPaymentHistory(
          parsed.paymentHistory.map((payment) => ({
            ...payment,
            date: new Date(payment.date)
          }))
        );
      }
      if (parsed.consecutivePayments !== undefined)
        setConsecutivePayments(parsed.consecutivePayments);
      if (parsed.missedPayments !== undefined)
        setMissedPayments(parsed.missedPayments);
      if (parsed.baseInterestRate !== undefined)
        setBaseInterestRate(parsed.baseInterestRate);
      if (parsed.interestRateHistory) {
        setInterestRateHistory(
          parsed.interestRateHistory.map((entry) => ({
            ...entry,
            date: new Date(entry.date)
          }))
        );
      }
      if (parsed.nextRateChangeDate)
        setNextRateChangeDate(new Date(parsed.nextRateChangeDate));
      if (parsed.monthlyTaxesPaid) setMonthlyTaxesPaid(parsed.monthlyTaxesPaid);
      if (parsed.yearlyTaxesPaid !== undefined)
        setYearlyTaxesPaid(parsed.yearlyTaxesPaid);
      if (parsed.recentCapitalGains)
        setRecentCapitalGains(parsed.recentCapitalGains);
      if (parsed.outsourcedProperties) {
        setOutsourcedProperties(new Set(parsed.outsourcedProperties));
      }
      if (parsed.propertyManager) setPropertyManager(parsed.propertyManager);
      if (parsed.realEstateAgent) setRealEstateAgent(parsed.realEstateAgent);
      if (parsed.aiPlayers) setAiPlayers(parsed.aiPlayers);
      if (parsed.events) setEvents(reviveEvents(parsed.events));
      if (parsed.rateProtection) setRateProtection(parsed.rateProtection);
      if (parsed.notifications) {
        setNotifications(
          parsed.notifications.map((note) => ({
            ...note,
            date: new Date(note.date)
          }))
        );
      }
    };

    const loadState = async () => {
      let loaded = false;

      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data) {
            applyLoadedState(data);
            loaded = true;
          }
        }
      } catch {
        // Ignore backend load errors and fall back to local storage.
      }

      if (!loaded) {
        const stored = window.localStorage.getItem(STATE_STORAGE_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            applyLoadedState(parsed);
          } catch {
            // Ignore malformed stored state.
          }
        }
      }

      if (!cancelled) {
        setHasLoadedState(true);
      }
    };

    loadState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasLoadedState) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const payload = {
        properties,
        currentDate: currentDate.toISOString(),
        playerMoney,
        totalDebt,
        monthlyRepayment,
        tickRate,
        paused,
        activeTab,
        bankCreditScore,
        maxLoanAmount,
        maxLoanToValueRatio,
        paymentHistory: paymentHistory.map((payment) => ({
          ...payment,
          date: payment.date.toISOString()
        })),
        consecutivePayments,
        missedPayments,
        baseInterestRate,
        interestRateHistory: interestRateHistory.map((entry) => ({
          ...entry,
          date: entry.date.toISOString()
        })),
        nextRateChangeDate: nextRateChangeDate.toISOString(),
        monthlyTaxesPaid,
        yearlyTaxesPaid,
        recentCapitalGains,
        outsourcedProperties: Array.from(outsourcedProperties),
        propertyManager,
        realEstateAgent,
        aiPlayers,
        events,
        rateProtection,
        notifications: notifications.map((note) => ({
          ...note,
          date: note.date.toISOString()
        }))
      };
      window.localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(payload));
      fetch("/api/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Ignore backend persistence errors; local storage is the fallback.
      });
    }, 500);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [
    hasLoadedState,
    properties,
    currentDate,
    playerMoney,
    totalDebt,
    monthlyRepayment,
    tickRate,
    paused,
    activeTab,
    bankCreditScore,
    maxLoanAmount,
    maxLoanToValueRatio,
    paymentHistory,
    consecutivePayments,
    missedPayments,
    baseInterestRate,
    interestRateHistory,
    nextRateChangeDate,
    monthlyTaxesPaid,
    yearlyTaxesPaid,
    recentCapitalGains,
    outsourcedProperties,
    propertyManager,
    realEstateAgent,
    aiPlayers,
    events,
    rateProtection,
    notifications
  ]);

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

  const toggleRealEstateAgent = () => {
    setRealEstateAgent((prev) => ({
      ...prev,
      hired: !prev.hired
    }));

    if (!realEstateAgent.hired) {
      setToastMessage(
        "Real estate agent hired. They'll negotiate better buy/sell terms."
      );
    } else {
      setToastMessage("Real estate agent has been dismissed.");
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

  const selectBestApplication = useCallback(
    (applications: LeaseApplication[], rentPrice: number) => {
      if (applications.length === 0) return null;

      return applications.reduce((best, current) => {
        const bestScore =
          best.tenant.creditScore +
          (rentPrice > 0 ? (best.tenant.monthlyIncome / rentPrice) * 100 : 0);
        const currentScore =
          current.tenant.creditScore +
          (rentPrice > 0
            ? (current.tenant.monthlyIncome / rentPrice) * 100
            : 0);

        return currentScore > bestScore ? current : best;
      }, applications[0]);
    },
    []
  );

  const getListingKeywordsForProperty = useCallback((property: Property) => {
    const copyKeywords = extractListingKeywords(property.listingCopy || "");
    return Array.from(
      new Set([...(property.listingKeywords || []), ...copyKeywords])
    );
  }, []);

  const calculateRentPriceImpact = useCallback((property: Property) => {
    const unitCount = deriveUnitCount(property);
    const marketRent = calculateRent(
      property.location,
      unitCount > 0 ? property.size / unitCount : property.size,
      property.renovationBonusPercentage / 100
    );
    if (!marketRent || marketRent <= 0) {
      return { count: 0, quality: 0, marketRent: 0 };
    }

    const ratio = property.rentPrice / marketRent;
    if (ratio <= 0.5) return { count: 1.0, quality: -0.12, marketRent };
    if (ratio <= 0.7) return { count: 0.6, quality: -0.07, marketRent };
    if (ratio <= 0.9) return { count: 0.25, quality: -0.03, marketRent };
    if (ratio <= 1.1) return { count: 0, quality: 0, marketRent };
    if (ratio <= 1.25) return { count: -0.2, quality: 0.02, marketRent };
    if (ratio <= 1.75) return { count: -0.5, quality: 0.05, marketRent };
    return { count: -0.8, quality: 0.08, marketRent };
  }, []);

  const getRandomBuyerName = useCallback(() => {
    const first = [
      "Redwood",
      "Summit",
      "Harbor",
      "Atlas",
      "Sterling",
      "Keystone",
      "Brighton",
      "Aspen"
    ];
    const last = ["Capital", "Holdings", "Partners", "Realty", "Group"];
    return `${first[Math.floor(Math.random() * first.length)]} ${
      last[Math.floor(Math.random() * last.length)]
    }`;
  }, []);

  const generateSaleOffers = useCallback(
    (currentProperties: Property[], date: Date) => {
      return currentProperties.map((property) => {
        if (property.owner !== "Player" || !property.forSale) return property;

        const listingKeywords = getListingKeywordsForProperty(property);
        const listingImpact = calculateListingImpact(listingKeywords);
        const baseChance = 0.18;
        const agentBoost = realEstateAgent.hired ? 0.1 : 0;
        const offerChance = Math.min(
          0.6,
          Math.max(0.05, baseChance + listingImpact.count + agentBoost)
        );

        const existingOffers = (property.saleOffers || []).filter((offer) => {
          const ageDays = Math.round(
            (date.getTime() - new Date(offer.date).getTime()) /
              (24 * 60 * 60 * 1000)
          );
          return ageDays <= 90;
        });

        if (Math.random() >= offerChance) {
          return { ...property, saleOffers: existingOffers };
        }

        const anchorPrice =
          property.salePrice || property.marketPrice || property.value;
        const daysOnMarket = property.saleListedDate
          ? Math.round(
              (date.getTime() - new Date(property.saleListedDate).getTime()) /
                (24 * 60 * 60 * 1000)
            )
          : 0;
        const timePenalty = daysOnMarket > 90 ? 0.05 : 0;
        const qualityBoost =
          listingImpact.quality + (realEstateAgent.hired ? 0.03 : 0);
        const offerMultiplier = Math.min(
          1.08,
          Math.max(
            0.82,
            0.9 + Math.random() * 0.15 + qualityBoost - timePenalty
          )
        );
        const offerAmount = Math.round(anchorPrice * offerMultiplier);
        const newOffer = {
          id: `offer-${Date.now()}-${Math.round(Math.random() * 100000)}`,
          buyerName: getRandomBuyerName(),
          amount: offerAmount,
          date: new Date(date)
        };

        return {
          ...property,
          saleOffers: [newOffer, ...existingOffers].slice(0, 5)
        };
      });
    },
    [getListingKeywordsForProperty, getRandomBuyerName, realEstateAgent]
  );

  const applyMarketAdjustments = useCallback(
    (currentProperties: Property[]) => {
      const activeEvents = events.filter((event) => event.isActive);

      return currentProperties.map((property) => {
        const annualRate = property.marketTrends.historicalAppreciation / 100;
        const monthlyTrend = annualRate / 12;

        const eventImpact = calculateEventImpact(
          activeEvents,
          EventImpactType.PROPERTY_VALUE,
          property.location,
          property.type
        );
        const areaImpact = calculateEventImpact(
          activeEvents,
          EventImpactType.AREA_QUALITY,
          property.location,
          property.type
        );

        const seasonalMultiplier = property.marketTrends.seasonality || 1;
        const totalRate = monthlyTrend + eventImpact + areaImpact * 0.2;
        const newValue = Math.max(
          0,
          Math.round(property.value * (1 + totalRate) * seasonalMultiplier)
        );

        const marketRatio =
          property.value > 0 ? property.marketPrice / property.value : 1;
        let newMarketPrice = Math.round(newValue * marketRatio);

        if (property.owner === null && property.timeOnMarket > 30) {
          const discount = Math.min(0.1, (property.timeOnMarket - 30) * 0.002);
          newMarketPrice = Math.round(newMarketPrice * (1 - discount));
        }

        return {
          ...property,
          value: newValue,
          marketPrice: Math.max(0, newMarketPrice)
        };
      });
    },
    [events]
  );

  const simulateAIActions = useCallback(
    (currentProperties: Property[]) => {
      const updatedPlayers = aiPlayers.map((player) => ({ ...player }));
      let updatedProperties = [...currentProperties];

      updatedPlayers.forEach((player) => {
        if (Math.random() < 0.35) {
          const availableListings = updatedProperties.filter(
            (property) => property.owner === null
          );
          const affordableListings = availableListings.filter(
            (property) => property.marketPrice <= player.cash * 0.9
          );

          if (affordableListings.length > 0) {
            const target =
              affordableListings[
                Math.floor(Math.random() * affordableListings.length)
              ];
            player.cash -= target.marketPrice;

            updatedProperties = updatedProperties.map((property) =>
              property.id === target.id
                ? {
                    ...property,
                    owner: player.id,
                    purchasePrice: target.marketPrice,
                    purchaseDate: new Date(currentDate),
                    isRented: false,
                    rentee: null,
                    currentTenant: undefined,
                    unitTenants: [],
                    occupiedUnits: 0
                  }
                : property
            );
          }
        }

        if (Math.random() < 0.2) {
          const ownedListings = updatedProperties.filter(
            (property) => property.owner === player.id
          );
          if (ownedListings.length > 0) {
            const target =
              ownedListings[Math.floor(Math.random() * ownedListings.length)];
            player.cash += target.value;

            updatedProperties = updatedProperties.map((property) =>
              property.id === target.id
                ? {
                    ...property,
                    owner: null,
                    isRented: false,
                    rentee: null,
                    currentTenant: undefined,
                    unitTenants: [],
                    occupiedUnits: 0,
                    purchaseDate: undefined,
                    purchasePrice: undefined,
                    timeOnMarket: 0,
                    listedDate: new Date(currentDate),
                    isNew: true,
                    marketPrice: target.value
                  }
                : property
            );
          }
        }
      });

      return { updatedProperties, updatedPlayers };
    },
    [aiPlayers, currentDate]
  );

  const completeDevelopment = useCallback(
    (landProperty: Property, existingProperties: Property[]) => {
      const maxAttempts = 20;
      let developedProperty: Property | null = null;

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const candidate = generateRandomProperty(
          landProperty.id,
          existingProperties
        );

        if (
          candidate.location === landProperty.location &&
          candidate.type !== PropertyType.LAND
        ) {
          developedProperty = candidate;
          break;
        }
      }

      if (!developedProperty) {
        developedProperty = generateRandomProperty(
          landProperty.id,
          existingProperties
        );
      }

      return {
        ...developedProperty,
        id: landProperty.id,
        address: landProperty.address,
        location: landProperty.location,
        owner: landProperty.owner,
        purchaseDate: landProperty.purchaseDate,
        isRented: false,
        rentee: null,
        currentTenant: undefined,
        unitTenants: [],
        occupiedUnits: 0,
        leaseApplications: [],
        tenantEvents: [],
        tenantHistory: landProperty.tenantHistory || [],
        listingKeywords: landProperty.listingKeywords || [],
        listingCopy: landProperty.listingCopy || "",
        timeOnMarket: 0,
        listedDate: new Date(currentDate),
        isNew: false,
        development: undefined,
        developmentFunding: landProperty.developmentFunding || 0
      };
    },
    [currentDate]
  );

  const advanceDevelopmentProjects = useCallback(
    (currentProperties: Property[]) => {
      const completedAddresses: string[] = [];

      const updated = currentProperties.map((property) => {
        if (!property.development) return property;

        if (property.development.phase === "permitted") {
          return property;
        }

        const daysRemaining = property.development.daysRemaining - 1;

        if (daysRemaining > 0) {
          return {
            ...property,
            development: {
              ...property.development,
              daysRemaining
            }
          };
        }

        if (property.development.phase === "permitting") {
          return {
            ...property,
            development: { phase: "permitted", daysRemaining: 0 } as const
          };
        }

        if (property.development.phase === "construction") {
          const developed = completeDevelopment(property, currentProperties);
          completedAddresses.push(developed.address);
          return developed;
        }

        return property;
      });

      return { updated, completedAddresses };
    },
    [completeDevelopment]
  );

  const advanceEvictions = useCallback(
    (currentProperties: Property[], date: Date) => {
      const completedAddresses: string[] = [];

      const updated = currentProperties.map((property) => {
        if (
          !property.pendingEvictions ||
          property.pendingEvictions.length === 0
        ) {
          return property;
        }

        const updatedEvictions = property.pendingEvictions.map((eviction) => ({
          ...eviction,
          daysRemaining: eviction.daysRemaining - 1
        }));
        const completed = updatedEvictions.filter(
          (eviction) => eviction.daysRemaining <= 0
        );
        const remaining = updatedEvictions.filter(
          (eviction) => eviction.daysRemaining > 0
        );

        if (completed.length === 0) {
          return { ...property, pendingEvictions: remaining };
        }

        const completedIds = new Set(
          completed.map((eviction) => eviction.tenantId)
        );
        const allTenants = getUnitTenants(property);
        const remainingTenants = allTenants.filter(
          (tenant) => !completedIds.has(tenant.id)
        );
        const removedTenants = allTenants.filter((tenant) =>
          completedIds.has(tenant.id)
        );
        const evictionEvents = removedTenants.map((tenant) => ({
          type: "LEASE_BREAK" as const,
          date: new Date(date),
          description: `Tenant ${tenant.name} evicted`,
          financialImpact: 0
        }));

        completedAddresses.push(property.address);

        return {
          ...property,
          pendingEvictions: remaining,
          unitTenants: remainingTenants,
          occupiedUnits: remainingTenants.length,
          isRented: remainingTenants.length > 0,
          currentTenant: remainingTenants[0],
          rentee: remainingTenants[0]?.name ?? null,
          tenantHistory: [...property.tenantHistory, ...removedTenants],
          tenantEvents: [...property.tenantEvents, ...evictionEvents]
        };
      });

      return { updated, completedAddresses };
    },
    []
  );

  // Process random tenant events like maintenance requests, etc.
  const processRandomTenantEvents = useCallback(() => {
    const rentedProperties = properties.filter((p) => {
      if (p.owner !== "Player" || !p.isRented) return false;
      return getUnitTenants(p).length > 0;
    });

    if (rentedProperties.length === 0) return;

    // Select a random property
    const randomProperty =
      rentedProperties[Math.floor(Math.random() * rentedProperties.length)];
    const tenants = getUnitTenants(randomProperty);
    const tenant = tenants[Math.floor(Math.random() * tenants.length)];

    // Decide event type based on tenant probabilities
    const eventType = Math.random() < 0.7 ? "DAMAGE" : "COMPLAINT";

    if (
      eventType === "DAMAGE" &&
      randomProperty.renovationBonusPercentage < 100 &&
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
        description: `Repairs needed: ${formatCurrency(damageCost)}`,
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
          `Repairs needed at ${randomProperty.address}. Cost: ${formatCurrency(
            damageCost
          )}`
        );
        setTimeout(() => setToastMessage(null), 5000);
      }
    }
  }, [
    properties,
    currentDate,
    outsourcedProperties,
    propertyManager,
    formatCurrency
  ]);
  // Monthly rent collection and tenant update interval
  useEffect(() => {
    if (paused) return;

    const rentInterval = setInterval(() => {
      // Once a month, collect rent and update tenant situations
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + 1);
      setCurrentDate(newDate);

      const developmentUpdate = advanceDevelopmentProjects(properties);
      const evictionUpdate = advanceEvictions(
        developmentUpdate.updated,
        newDate
      );
      let updatedProperties = evictionUpdate.updated;

      if (developmentUpdate.completedAddresses.length > 0) {
        const message = `Construction completed: ${developmentUpdate.completedAddresses.join(
          ", "
        )}`;
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 5000);
      }

      if (evictionUpdate.completedAddresses.length > 0) {
        const message = `Evictions completed: ${evictionUpdate.completedAddresses.join(
          ", "
        )}`;
        setToastMessage(message);
        setTimeout(() => setToastMessage(null), 5000);
      }

      // On the first of the month
      if (newDate.getDate() === 1) {
        let totalRentalIncome = 0;
        let totalPropertyTax = 0;
        let totalMaintenanceCosts = 0;
        let managerTenantFees = 0;
        let managerTenantsFound = 0;
        let leaseDepartures = 0;

        updatedProperties = updatedProperties.map((property) => {
          if (property.owner !== "Player") return property;

          const existingTenants = getUnitTenants(property);
          const updatedTenantEvents = [...property.tenantEvents];
          const remainingTenants: Tenant[] = [];
          const pendingEvictionIds = new Set(
            (property.pendingEvictions || []).map(
              (eviction) => eviction.tenantId
            )
          );

          existingTenants.forEach((tenant) => {
            const leaseStart = tenant.leaseStart
              ? new Date(tenant.leaseStart)
              : property.leaseStart
                ? new Date(property.leaseStart)
                : newDate;
            const plannedDuration =
              tenant.plannedStayDuration || tenant.leaseLength || 12;
            const monthsElapsed = getMonthsElapsed(leaseStart, newDate);

            if (
              !pendingEvictionIds.has(tenant.id) &&
              monthsElapsed >= plannedDuration
            ) {
              leaseDepartures += 1;
              updatedTenantEvents.push({
                type: "LEASE_BREAK",
                date: new Date(newDate),
                description: "Tenant moved out after lease end",
                financialImpact: 0
              });
            } else {
              remainingTenants.push({
                ...tenant,
                leaseStart
              });
            }
          });

          // Calculate property tax
          const propertyTaxImpact = calculateEventImpact(
            events.filter((e) => e.isActive),
            EventImpactType.PROPERTY_TAX,
            property.location,
            property.type
          );
          const monthlyPropertyTax = Math.round(
            (calculateTotalPropertyTax([property], taxRegion) / 12) *
              (1 + propertyTaxImpact)
          );
          totalPropertyTax += monthlyPropertyTax;

          const maintenanceCostImpact = calculateEventImpact(
            events.filter((e) => e.isActive),
            EventImpactType.MAINTENANCE_COST,
            property.location,
            property.type
          );
          const adjustedMaintenanceCost = Math.max(
            0,
            Math.round(property.maintenanceCosts * (1 + maintenanceCostImpact))
          );
          totalMaintenanceCosts += adjustedMaintenanceCost;

          const updatedPropertyBase = {
            ...property,
            tenantEvents: updatedTenantEvents,
            unitTenants: remainingTenants,
            occupiedUnits: remainingTenants.length,
            isRented: remainingTenants.length > 0,
            currentTenant: remainingTenants[0],
            rentee: remainingTenants[0]?.name ?? null
          };

          // Handle rental income for rented properties
          if (updatedPropertyBase.isRented) {
            const unitTenants = remainingTenants;
            if (unitTenants.length === 0) {
              return {
                ...updatedPropertyBase,
                propertyTax: monthlyPropertyTax,
                occupiedUnits: 0,
                unitTenants: [],
                isRented: false,
                currentTenant: undefined,
                rentee: null
              };
            }

            const eventImpact = calculateEventImpact(
              events.filter((e) => e.isActive),
              EventImpactType.TENANT_QUALITY
            );
            const areaImpact = calculateEventImpact(
              events.filter((e) => e.isActive),
              EventImpactType.AREA_QUALITY,
              property.location,
              property.type
            );

            const tenantEvents = [...updatedTenantEvents];
            let payingUnits = 0;

            unitTenants.forEach((tenant) => {
              if (pendingEvictionIds.has(tenant.id)) {
                tenantEvents.push({
                  type: "RENT_MISSED",
                  date: new Date(newDate),
                  description: "Eviction in progress - rent unpaid",
                  financialImpact: -property.rentPrice
                });
                return;
              }

              const willPay =
                Math.random() <
                tenant.paymentProbability + eventImpact + areaImpact;

              if (willPay) {
                payingUnits += 1;
                tenantEvents.push({
                  type: "RENT_PAID",
                  date: new Date(newDate),
                  description: "Rent paid on time",
                  financialImpact: property.rentPrice
                });
              } else {
                tenantEvents.push({
                  type: "RENT_MISSED",
                  date: new Date(newDate),
                  description: "Rent payment missed",
                  financialImpact: -property.rentPrice
                });
              }
            });

            totalRentalIncome += payingUnits * property.rentPrice;

            return {
              ...updatedPropertyBase,
              tenantEvents,
              propertyTax: monthlyPropertyTax,
              occupiedUnits: unitTenants.length,
              unitTenants,
              isRented: unitTenants.length > 0,
              currentTenant: unitTenants[0],
              rentee: unitTenants[0]?.name ?? null
            };
          }

          const unitCount = deriveUnitCount(property);
          const unitTenants = remainingTenants;
          const occupiedUnits = unitTenants.length;
          const vacancies = Math.max(0, unitCount - occupiedUnits);

          if (
            vacancies > 0 &&
            propertyManager.hired &&
            outsourcedProperties.has(property.id) &&
            property.type !== PropertyType.LAND
          ) {
            const tenantQualityImpact = calculateEventImpact(
              events.filter((e) => e.isActive),
              EventImpactType.TENANT_QUALITY,
              property.location,
              property.type
            );
            const areaImpact = calculateEventImpact(
              events.filter((e) => e.isActive),
              EventImpactType.AREA_QUALITY,
              property.location,
              property.type
            );
            const listingKeywords = getListingKeywordsForProperty(property);
            const listingImpact = calculateListingImpact(listingKeywords);
            const rentPriceImpact = calculateRentPriceImpact(property);

            const baseApplicationCount =
              (4 + Math.floor(Math.random() * 5)) * Math.max(1, vacancies);
            const adjustedApplicationCount = Math.max(
              1,
              Math.round(
                baseApplicationCount *
                  (1 +
                    tenantQualityImpact +
                    areaImpact +
                    listingImpact.count +
                    rentPriceImpact.count)
              )
            );

            const applications = generateLeaseApplications(
              property.rentPrice,
              adjustedApplicationCount,
              tenantQualityImpact +
                areaImpact +
                listingImpact.quality +
                rentPriceImpact.quality,
              listingKeywords
            );
            const bestApplication = selectBestApplication(
              applications,
              property.rentPrice
            );

            if (!bestApplication) {
              return {
                ...updatedPropertyBase,
                propertyTax: monthlyPropertyTax
              };
            }

            managerTenantFees += Math.round(property.rentPrice * 0.5);
            managerTenantsFound += 1;

            const acceptedTenant = {
              ...bestApplication.tenant,
              leaseStart: new Date(newDate)
            };
            const updatedTenants = [...unitTenants, acceptedTenant].slice(
              0,
              unitCount
            );

            return {
              ...updatedPropertyBase,
              unitTenants: updatedTenants,
              occupiedUnits: updatedTenants.length,
              isRented: updatedTenants.length > 0,
              rentee: updatedTenants[0]?.name ?? null,
              currentTenant: updatedTenants[0],
              leaseStart: new Date(newDate),
              leaseLength: bestApplication.desiredLeaseLength,
              leaseApplications: [],
              propertyTax: monthlyPropertyTax
            };
          }

          return { ...updatedPropertyBase, propertyTax: monthlyPropertyTax };
        });

        // Calculate income tax on rental income
        const rentalIncomeTax = calculateRentalIncomeTax(
          totalRentalIncome,
          totalPropertyTax + totalMaintenanceCosts,
          false,
          taxRegion
        );

        // Update player money with rental income minus taxes
        setPlayerMoney(
          (prev) =>
            prev +
            totalRentalIncome -
            totalPropertyTax -
            rentalIncomeTax -
            totalMaintenanceCosts -
            managerTenantFees
        );

        // Update monthly taxes paid
        setMonthlyTaxesPaid({
          propertyTax: totalPropertyTax,
          incomeTax: rentalIncomeTax
        });

        // Update yearly taxes for annual reporting
        setYearlyTaxesPaid((prev) => prev + totalPropertyTax + rentalIncomeTax);

        if (managerTenantsFound > 0) {
          const plural = managerTenantsFound > 1 ? "s" : "";
          setToastMessage(
            `Property manager found tenant${plural} for ${managerTenantsFound} property${plural}.`
          );
          setTimeout(() => setToastMessage(null), 5000);
        }

        if (leaseDepartures > 0) {
          const plural = leaseDepartures > 1 ? "s" : "";
          setToastMessage(`${leaseDepartures} tenant${plural} moved out.`);
          setTimeout(() => setToastMessage(null), 5000);
        }

        // Property manager fee if hired
        if (propertyManager.hired) {
          setPlayerMoney((prev) => prev - propertyManager.fee);
        }

        updatedProperties = applyMarketAdjustments(updatedProperties);
        updatedProperties = generateSaleOffers(updatedProperties, newDate);

        const aiResult = simulateAIActions(updatedProperties);
        updatedProperties = aiResult.updatedProperties;
        setAiPlayers(aiResult.updatedPlayers);
      }

      const refreshedProperties = (() => {
        let next = updatedProperties.map((property) => {
          if (property.owner !== null) return property;

          const timeOnMarket = (property.timeOnMarket || 0) + 1;

          return {
            ...property,
            timeOnMarket,
            isNew: timeOnMarket <= NEW_LISTING_DAYS
          };
        });

        next = next.filter(
          (property) =>
            property.owner !== null || property.timeOnMarket <= MARKET_MAX_DAYS
        );

        let listingCount = next.filter(
          (property) => property.owner === null
        ).length;
        let nextId =
          next.reduce((maxId, property) => Math.max(maxId, property.id), 0) + 1;

        while (listingCount < MARKET_TARGET_LISTINGS) {
          const newProperty = generateRandomProperty(nextId, next);
          next.push(newProperty);
          nextId += 1;
          listingCount += 1;
        }

        return next;
      })();

      setProperties(refreshedProperties);

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
    outsourcedProperties,
    taxRegion,
    monthlyTaxesPaid.propertyTax,
    advanceDevelopmentProjects,
    advanceEvictions,
    applyMarketAdjustments,
    generateSaleOffers,
    processRandomTenantEvents,
    selectBestApplication,
    getListingKeywordsForProperty,
    calculateRentPriceImpact,
    simulateAIActions
  ]);

  useEffect(() => {
    if (paused) return;

    const mortgageInterval = setInterval(() => {
      if (
        totalDebt > 0 &&
        monthlyRepayment > 0 &&
        currentDate.getDate() === 1
      ) {
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

    const maxLoanImpact = calculateEventImpact(
      events.filter((e) => e.isActive),
      EventImpactType.MAX_LOAN_AMOUNT
    );
    const effectiveMaxLoanAmount = Math.max(
      0,
      Math.round(
        maxLoanAmount * (1 + maxLoanImpact) * newBorrowerLoanCapMultiplier
      )
    );

    if (amount > effectiveMaxLoanAmount) {
      setToastMessage(
        `You cannot take a loan greater than your maximum loan amount of ${formatCurrency(
          effectiveMaxLoanAmount
        )}.`
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
      maxLoanToValueRatio,
      paymentHistory.length > 0
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

    setToastMessage(`You took a loan of ${formatCurrency(amount)}.`);
    setTimeout(() => setToastMessage(null), 5000);
  }

  function handleRent(propertyId: number, options?: { showModal?: boolean }) {
    const showModal = options?.showModal !== false;
    const propertyIndex = properties.findIndex(
      (property) => property.id === propertyId
    );
    if (propertyIndex !== -1) {
      const property = properties[propertyIndex];
      const unitCount = deriveUnitCount(property);
      const unitTenants = getUnitTenants(property);
      const occupiedUnits = unitTenants.length;
      const vacancies = Math.max(0, unitCount - occupiedUnits);

      if (property.type === PropertyType.LAND) {
        setToastMessage(
          "Land properties cannot be rented. Consider developing it in the future."
        );
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      if (property.isRented && vacancies === 0) {
        const updatedProperties = [...properties];
        updatedProperties[propertyIndex] = {
          ...property,
          isRented: false,
          rentee: null,
          currentTenant: undefined,
          unitTenants: [],
          occupiedUnits: 0
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
      const areaImpact = calculateEventImpact(
        events.filter((e) => e.isActive),
        EventImpactType.AREA_QUALITY,
        property.location,
        property.type
      );
      const listingKeywords = getListingKeywordsForProperty(property);
      const listingImpact = calculateListingImpact(listingKeywords);
      const rentPriceImpact = calculateRentPriceImpact(property);

      const baseApplicationCount =
        (4 + Math.floor(Math.random() * 5)) * Math.max(1, vacancies || 1);
      const adjustedApplicationCount = Math.max(
        1,
        Math.round(
          baseApplicationCount *
            (1 +
              tenantQualityImpact +
              areaImpact +
              listingImpact.count +
              rentPriceImpact.count)
        )
      );

      const applications = generateLeaseApplications(
        property.rentPrice,
        adjustedApplicationCount,
        tenantQualityImpact +
          areaImpact +
          listingImpact.quality +
          rentPriceImpact.quality,
        listingKeywords
      );

      const updatedProperties = [...properties];
      updatedProperties[propertyIndex] = {
        ...property,
        leaseApplications: applications
      };

      setProperties(updatedProperties);
      if (showModal) {
        setPropertyWithApplications(updatedProperties[propertyIndex]);
        setShowLeaseApplications(true);
      }
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
      if (property.development) {
        setToastMessage(
          "You cannot sell a property while development is underway."
        );
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      if (property.forSale) {
        const updatedProperties = [...properties];
        updatedProperties[propertyIndex] = {
          ...property,
          forSale: false,
          salePrice: undefined,
          saleListedDate: undefined,
          saleOffers: []
        };
        setProperties(updatedProperties);
        setToastMessage(`Cancelled listing for ${property.address}.`);
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      const salePrice = Math.round(
        property.value *
          (realEstateAgent.hired ? 1 + realEstateAgent.negotiationRate : 1)
      );

      const updatedProperties = [...properties];
      updatedProperties[propertyIndex] = {
        ...property,
        forSale: true,
        salePrice,
        saleListedDate: new Date(currentDate),
        saleOffers: []
      };

      setProperties(updatedProperties);
      setToastMessage(
        `Listed ${property.address} for ${formatCurrency(salePrice)}.`
      );
      setTimeout(() => setToastMessage(null), 5000);
    }
    // Otherwise, buy the property
    else {
      const negotiatedPrice = Math.round(
        property.marketPrice *
          (realEstateAgent.hired ? 1 - realEstateAgent.negotiationRate : 1)
      );
      const agentFee = realEstateAgent.hired
        ? Math.round(property.marketPrice * realEstateAgent.commissionRate)
        : 0;
      const totalCost = negotiatedPrice + agentFee;

      if (playerMoney < totalCost) {
        setToastMessage("You don't have enough money to buy this property.");
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      setPlayerMoney((prev) => prev - totalCost);

      const updatedProperties = [...properties];
      updatedProperties[propertyIndex] = {
        ...property,
        owner: "Player",
        purchaseDate: new Date(currentDate),
        purchasePrice: negotiatedPrice,
        marketPrice: negotiatedPrice,
        forSale: false,
        saleListedDate: undefined,
        saleOffers: [],
        salePrice: undefined
      };

      setProperties(updatedProperties);

      setToastMessage(
        `Purchased ${property.address} for ${formatCurrency(
          negotiatedPrice
        )}${agentFee > 0 ? ` (Agent fee ${formatCurrency(agentFee)})` : ""}`
      );
      setTimeout(() => setToastMessage(null), 5000);
    }
  }

  const handleAcceptOffer = useCallback(
    (propertyId: number, offerId: string) => {
      const propertyIndex = properties.findIndex((p) => p.id === propertyId);
      if (propertyIndex === -1) return;

      const property = properties[propertyIndex];
      const offers = property.saleOffers || [];
      const offer = offers.find((item) => item.id === offerId);
      if (!offer) return;

      const salePrice = offer.amount;
      const agentFee = realEstateAgent.hired
        ? Math.round(salePrice * realEstateAgent.commissionRate)
        : 0;

      const purchaseDate = property.purchaseDate || new Date();
      const purchasePrice =
        property.purchasePrice !== undefined
          ? property.purchasePrice
          : property.marketPrice;
      const holdingPeriodMonths = Math.round(
        (currentDate.getTime() - purchaseDate.getTime()) /
          (30 * 24 * 60 * 60 * 1000)
      );

      const taxPaid = calculateCapitalGainsTax(
        purchasePrice,
        salePrice,
        holdingPeriodMonths,
        taxRegion
      );

      const netProceeds = salePrice - taxPaid - agentFee;

      setRecentCapitalGains((prev) => [
        {
          property: property.address,
          purchasePrice,
          salePrice,
          holdingPeriodMonths,
          taxPaid
        },
        ...prev.slice(0, 9)
      ]);

      const updatedProperties = [...properties];
      updatedProperties[propertyIndex] = {
        ...property,
        owner: offer.buyerName,
        purchaseDate: new Date(currentDate),
        purchasePrice: salePrice,
        forSale: false,
        salePrice: undefined,
        saleListedDate: undefined,
        saleOffers: []
      };

      setProperties(updatedProperties);
      setPlayerMoney((prev) => prev + netProceeds);

      setToastMessage(
        `Accepted offer from ${offer.buyerName} for ${formatCurrency(
          salePrice
        )}${agentFee > 0 ? ` (Agent fee ${formatCurrency(agentFee)})` : ""}`
      );
      setTimeout(() => setToastMessage(null), 5000);
    },
    [properties, currentDate, realEstateAgent, formatCurrency, taxRegion]
  );

  const handleBulldozeProperty = useCallback(
    (propertyId: number) => {
      const propertyIndex = properties.findIndex((p) => p.id === propertyId);
      if (propertyIndex === -1) return;

      const property = properties[propertyIndex];
      if (property.owner !== "Player") return;

      if (property.type === PropertyType.LAND) {
        setToastMessage("This property is already land.");
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      if (property.isProtected) {
        setToastMessage("This property is protected and cannot be bulldozed.");
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      const unitTenants = getUnitTenants(property);
      if (
        unitTenants.length > 0 ||
        (property.pendingEvictions || []).length > 0
      ) {
        setToastMessage(
          "You must remove all tenants before bulldozing this property."
        );
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      const bulldozeCost = calculateBulldozeCost(property);
      if (playerMoney < bulldozeCost) {
        setToastMessage(
          `You need ${formatCurrency(bulldozeCost)} to bulldoze this property.`
        );
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      const landValue = Math.max(
        0,
        Math.round(
          calculateValue(
            property.size,
            PropertyType.LAND,
            property.location,
            0,
            100,
            undefined,
            property
          )
        )
      );
      const landMarketPrice = Math.round(
        landValue * (0.9 + Math.random() * 0.2)
      );
      const landMaintenance = calculateMaintenanceCost(
        property.location,
        property.size,
        landValue,
        PropertyType.LAND
      );

      const updatedProperties = [...properties];
      updatedProperties[propertyIndex] = {
        ...property,
        type: PropertyType.LAND,
        rooms: null,
        units: 0,
        occupiedUnits: 0,
        unitTenants: [],
        isRented: false,
        rentee: null,
        currentTenant: undefined,
        rentPrice: 0,
        intendedPurpose: "Housing",
        renovationBonusPercentage: 0,
        maintenance: "Cleared lot",
        value: landValue,
        marketPrice: landMarketPrice,
        maintenanceCosts: landMaintenance,
        development: undefined,
        developmentFunding: 0,
        forSale: false,
        salePrice: undefined,
        saleListedDate: undefined,
        saleOffers: [],
        pendingEvictions: []
      };

      setProperties(updatedProperties);
      setPlayerMoney((prev) => prev - bulldozeCost);
      setToastMessage(
        `Bulldozed ${property.address} for ${formatCurrency(bulldozeCost)}.`
      );
      setTimeout(() => setToastMessage(null), 5000);
    },
    [properties, playerMoney, formatCurrency]
  );

  function handleRenovate(propertyId: number): void {
    const propertyIndex = properties.findIndex((p) => p.id === propertyId);
    if (propertyIndex === -1) return;

    const property = properties[propertyIndex];
    const renovationCost = calculateRenovationCost(property);

    // Check if player has enough money
    if (playerMoney < renovationCost) {
      setToastMessage(
        `You need ${formatCurrency(renovationCost)} to renovate this property.`
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
      ), // Add 20% to renovation bonus (max 100%)
      maintenance: "Recently renovated"
    };

    setProperties(updatedProperties);

    setToastMessage(
      `Renovated ${property.address} for ${formatCurrency(
        adjustedRenovationCost
      )}`
    );
    setTimeout(() => setToastMessage(null), 5000);
  }

  function handleEvictTenant(propertyId: number, tenantId?: string): void {
    const propertyIndex = properties.findIndex((p) => p.id === propertyId);
    if (propertyIndex === -1) return;

    const property = properties[propertyIndex];

    // Check if property has a tenant
    const unitTenants = getUnitTenants(property);
    if (!property.isRented || unitTenants.length === 0) {
      setToastMessage("This property doesn't have a tenant to evict.");
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }
    const targetTenant =
      unitTenants.find((tenant) => tenant.id === tenantId) || unitTenants[0];
    const pendingEvictions = property.pendingEvictions || [];

    if (
      pendingEvictions.some((eviction) => eviction.tenantId === targetTenant.id)
    ) {
      setToastMessage("An eviction is already in progress for this tenant.");
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    const evictionCost = calculateEvictionCost(property);
    const evictionDuration = calculateEvictionDurationDays(property);

    // Check if player has enough money
    if (playerMoney < evictionCost) {
      setToastMessage(
        `You need ${formatCurrency(
          evictionCost
        )} to cover legal fees for eviction.`
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
      description: `Eviction filed against ${targetTenant.name}`,
      financialImpact: 0
    };

    const updatedProperties = [...properties];
    updatedProperties[propertyIndex] = {
      ...property,
      pendingEvictions: [
        ...pendingEvictions,
        {
          tenantId: targetTenant.id,
          startDate: new Date(currentDate),
          daysRemaining: evictionDuration
        }
      ],
      tenantEvents: [...property.tenantEvents, tenantEvent]
    };

    setProperties(updatedProperties);
    setToastMessage(
      `Eviction started at ${property.address} (${evictionDuration} days)`
    );
    setTimeout(() => setToastMessage(null), 5000);
  }

  function handleAcceptApplication(
    property: Property,
    application: LeaseApplication
  ): void {
    const propertyIndex = properties.findIndex((p) => p.id === property.id);
    if (propertyIndex === -1) return;

    const unitCount = deriveUnitCount(property);
    const unitTenants = getUnitTenants(property);
    const acceptedTenant = {
      ...application.tenant,
      leaseStart: new Date(currentDate)
    };
    const updatedTenants = [...unitTenants, acceptedTenant].slice(0, unitCount);

    // Update property with the new tenant
    const updatedProperties = [...properties];
    updatedProperties[propertyIndex] = {
      ...property,
      unitTenants: updatedTenants,
      occupiedUnits: updatedTenants.length,
      isRented: updatedTenants.length > 0,
      rentee: updatedTenants[0]?.name ?? null,
      currentTenant: updatedTenants[0],
      leaseStart: new Date(currentDate),
      leaseLength: application.desiredLeaseLength,
      leaseApplications: (property.leaseApplications || []).filter(
        (item) => item.tenant.id !== application.tenant.id
      )
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

  const handleUpdateListingKeywords = useCallback(
    (propertyId: number, listingKeywords: Property["listingKeywords"]) => {
      setProperties((prev) =>
        prev.map((property) =>
          property.id === propertyId
            ? { ...property, listingKeywords }
            : property
        )
      );
    },
    []
  );

  const handleUpdateListingCopy = useCallback(
    (propertyId: number, listingCopy: string) => {
      setProperties((prev) =>
        prev.map((property) =>
          property.id === propertyId ? { ...property, listingCopy } : property
        )
      );
    },
    []
  );

  const handleUpdateRentPrice = useCallback(
    (propertyId: number, rentPrice: number) => {
      setProperties((prev) =>
        prev.map((property) =>
          property.id === propertyId ? { ...property, rentPrice } : property
        )
      );
    },
    []
  );

  const handleApplyPermit = useCallback(
    (propertyId: number) => {
      const property = properties.find((p) => p.id === propertyId);
      if (!property) return;

      if (property.owner !== "Player" || property.type !== PropertyType.LAND) {
        setToastMessage("Only owned land properties can be developed.");
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      if (property.development) {
        setToastMessage("This property already has a development underway.");
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      const permitCost = calculatePermitCost(property);
      if (playerMoney < permitCost) {
        setToastMessage(
          `You need ${formatCurrency(permitCost)} to apply for a permit.`
        );
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      setPlayerMoney((prev) => prev - permitCost);
      setProperties((prev) =>
        prev.map((item) =>
          item.id === propertyId
            ? {
                ...item,
                development: {
                  phase: "permitting",
                  daysRemaining: PERMIT_DURATION_DAYS
                }
              }
            : item
        )
      );

      setToastMessage(`Permit application submitted for ${property.address}.`);
      setTimeout(() => setToastMessage(null), 5000);
    },
    [properties, playerMoney, formatCurrency]
  );

  const handleStartConstruction = useCallback(
    (propertyId: number) => {
      const property = properties.find((p) => p.id === propertyId);
      if (!property) return;

      if (property.owner !== "Player" || property.type !== PropertyType.LAND) {
        setToastMessage("Only owned land properties can be developed.");
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      if (property.development?.phase !== "permitted") {
        setToastMessage("A valid permit is required before construction.");
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      const constructionCost = calculateConstructionCost(property);
      if (playerMoney < constructionCost) {
        setToastMessage(
          `You need ${formatCurrency(constructionCost)} to start construction.`
        );
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      setPlayerMoney((prev) => prev - constructionCost);
      setProperties((prev) =>
        prev.map((item) =>
          item.id === propertyId
            ? {
                ...item,
                development: {
                  phase: "construction",
                  daysRemaining: CONSTRUCTION_DURATION_DAYS
                }
              }
            : item
        )
      );

      setToastMessage(`Construction started on ${property.address}.`);
      setTimeout(() => setToastMessage(null), 5000);
    },
    [properties, playerMoney, formatCurrency]
  );

  const handleRaiseFunds = useCallback(
    (propertyId: number) => {
      const property = properties.find((p) => p.id === propertyId);
      if (!property) return;

      if (property.owner !== "Player" || property.type !== PropertyType.LAND) {
        setToastMessage(
          "Only owned land properties can raise development funds."
        );
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      if (property.developmentFunding && property.developmentFunding > 0) {
        setToastMessage("Funding has already been raised for this property.");
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      const fundingAmount = Math.round(property.value * 0.5);
      if (fundingAmount <= 0) {
        setToastMessage(
          "This property is not eligible for development funding."
        );
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }

      setPlayerMoney((prev) => prev + fundingAmount);
      setTotalDebt((prev) => prev + fundingAmount);
      setMonthlyRepayment(
        (prev) => prev + fundingAmount * (baseInterestRate / 12)
      );

      setProperties((prev) =>
        prev.map((item) =>
          item.id === propertyId
            ? { ...item, developmentFunding: fundingAmount }
            : item
        )
      );

      setToastMessage(
        `Raised ${formatCurrency(
          fundingAmount
        )} for development (adds to your loan balance).`
      );
      setTimeout(() => setToastMessage(null), 5000);
    },
    [properties, baseInterestRate, formatCurrency]
  );

  const handleResetSim = useCallback(() => {
    setPaused(true);
    setToastMessage(null);
    setShowNotifications(false);
    setNotifications([]);
    setActiveTab("listings");
    setProperties(generateRandomProperties(20));
    setPlayerMoney(250000);
    setTotalDebt(0);
    setMonthlyRepayment(0);
    setBankCreditScore(INITIAL_CREDIT_SCORE);
    setMaxLoanAmount(INITIAL_MAX_LOAN);
    setMaxLoanToValueRatio(INITIAL_LOAN_TO_VALUE_RATIO);
    setPaymentHistory([]);
    setConsecutivePayments(0);
    setMissedPayments(0);
    setBaseInterestRate(0.05);
    setInterestRateHistory([{ date: new Date(), rate: 0.05 }]);
    const nextDate = new Date(currentDate);
    nextDate.setMonth(nextDate.getMonth() + 3);
    setNextRateChangeDate(nextDate);
    setMonthlyTaxesPaid({ propertyTax: 0, incomeTax: 0 });
    setYearlyTaxesPaid(0);
    setRecentCapitalGains([]);
    setPropertyWithApplications(null);
    setShowLeaseApplications(false);
    setOutsourcedProperties(new Set());
    setPropertyManager({
      hired: false,
      fee: 500,
      efficiency: 0.85
    });
    setAiPlayers(INITIAL_AI_PLAYERS);
    setRealEstateAgent({
      hired: false,
      commissionRate: 0.01,
      negotiationRate: 0.02
    });
    setEvents([]);
    setSelectedEvent(null);
    setShowEventDetails(false);
    setRateProtection({
      active: false,
      capRate: 0,
      monthlyCost: 0
    });

    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    try {
      window.localStorage.clear();
    } catch {
      // Ignore storage failures.
    }

    fetch("/api/state", { method: "DELETE" }).catch(() => undefined);
  }, [currentDate]);

  function handleRepayLoan(amount: number): void {
    // Early repayment fee (2% of remaining balance)
    const earlyRepaymentFee = Math.round(amount * 0.02);
    const totalPayment = amount + earlyRepaymentFee;

    if (playerMoney < totalPayment) {
      setToastMessage(
        `You need ${formatCurrency(totalPayment)} to repay this loan with fees.`
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

    setToastMessage(`Repaid ${formatCurrency(amount)} of your loan.`);
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

  const playerNetWorth =
    playerMoney +
    properties
      .filter((property) => property.owner === "Player")
      .reduce((sum, property) => sum + property.value, 0) -
    totalDebt;
  const aiNetWorths = aiPlayers.map((ai) => {
    const assets = properties
      .filter((property) => property.owner === ai.id)
      .reduce((sum, property) => sum + property.value, 0);
    return { ...ai, netWorth: ai.cash + assets };
  });

  return (
    <div className='min-h-screen bg-gray-900 text-white p-4'>
      <h1 className='text-3xl font-bold mb-4'>Real Estate Simulator</h1>

      <div className='bg-gray-800 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4'>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Date</span>
          <span className='text-lg font-semibold'>
            {formatDate(currentDate)}
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Cash</span>
          <span className='text-lg font-semibold text-green-400'>
            {formatCurrency(playerMoney)}
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Debt</span>
          <span className='text-lg font-semibold text-red-400'>
            {formatCurrency(totalDebt)}
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Debt-to-Asset Ratio</span>
          <span className='text-lg font-semibold'>
            {(currentDebtRatio * 100).toFixed(1)}%
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Monthly Payment</span>
          <span className='text-lg font-semibold'>
            {formatCurrency(
              monthlyRepayment + calculateAdminFee(monthlyRepayment)
            )}
          </span>
        </div>
        <div className='flex flex-col'>
          <span className='text-gray-400'>Monthly Tax</span>
          <span className='text-lg font-semibold text-red-400'>
            {formatCurrency(
              monthlyTaxesPaid.propertyTax + monthlyTaxesPaid.incomeTax
            )}
          </span>
        </div>
      </div>

      <div className='bg-gray-800 rounded-lg p-3 mb-4 relative'>
        <div className='flex items-center justify-between'>
          <div className='font-semibold'>
            Notifications ({notifications.length})
          </div>
          <button
            className='text-sm text-blue-400 hover:text-blue-300'
            onClick={handleToggleNotifications}
          >
            {showNotifications ? "Hide" : "Show"}
          </button>
        </div>
        {!showNotifications && notifications[0] && (
          <div className='text-sm text-gray-300 mt-2'>
            <span className='text-xs text-gray-400 mr-2'>
              {formatDate(notifications[0].date)}
            </span>
            {notifications[0].message}
          </div>
        )}
        {showNotifications && (
          <div className='mt-2 space-y-2 max-h-40 overflow-y-auto'>
            {notifications.slice(0, 6).map((note, index) => (
              <div
                key={`${note.date.toISOString()}-${index}`}
                className='bg-gray-700/60 rounded p-2 text-sm'
              >
                <div className='text-xs text-gray-400'>
                  {formatDate(note.date)}
                </div>
                <div>{note.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className='bg-gray-800 rounded-lg p-3 mb-4'>
        <div className='flex items-center justify-between'>
          <div className='font-semibold'>AI Opponents</div>
          <div className='text-xs text-gray-400'>
            Your net worth: {formatCurrency(playerNetWorth)}
          </div>
        </div>
        <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-3'>
          {aiNetWorths.map((ai) => (
            <div
              key={ai.id}
              className='bg-gray-700/60 rounded p-3 flex items-center justify-between'
            >
              <div>
                <div className='font-medium'>{ai.name}</div>
                <div className='text-xs text-gray-400'>{ai.id}</div>
              </div>
              <div className='text-right'>
                <div className='text-sm text-gray-300'>Net Worth</div>
                <div className='font-semibold'>
                  {formatCurrency(ai.netWorth)}
                </div>
              </div>
            </div>
          ))}
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
        activeEvents={activeEventsList}
        onEventClick={handleEventClick}
      />

      {toastMessage && tickRate !== TIME_SPEED.FAST && (
        <div className='fixed top-4 right-4 bg-yellow-500 text-black p-4 rounded shadow-lg z-[120] animate-pulse'>
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
            currentDate={currentDate}
            playerMoney={playerMoney}
            onUpdateListing={handleUpdateListingKeywords}
            onUpdateListingCopy={handleUpdateListingCopy}
            onUpdateRentPrice={handleUpdateRentPrice}
            onAcceptOffer={handleAcceptOffer}
            onBulldoze={handleBulldozeProperty}
            onApplyPermit={handleApplyPermit}
            onStartConstruction={handleStartConstruction}
            onRaiseFunds={handleRaiseFunds}
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
            currentDate={currentDate}
            playerMoney={playerMoney}
            outsourcedProperties={outsourcedProperties}
            onToggleOutsource={toggleOutsourceProperty}
            onUpdateListing={handleUpdateListingKeywords}
            onUpdateListingCopy={handleUpdateListingCopy}
            onUpdateRentPrice={handleUpdateRentPrice}
            onAcceptOffer={handleAcceptOffer}
            onBulldoze={handleBulldozeProperty}
            onApplyPermit={handleApplyPermit}
            onStartConstruction={handleStartConstruction}
            onRaiseFunds={handleRaiseFunds}
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
            maxLoanAmount={eventAdjustedMaxLoanAmount}
            maxLoanToValueRatio={maxLoanToValueRatio}
            currentDebtRatio={currentDebtRatio}
            paymentHistory={paymentHistory}
            interestRateHistory={interestRateHistory}
            consecutivePayments={consecutivePayments}
            nextRateChangeDate={nextRateChangeDate}
            loanApprovalImpact={loanApprovalEventImpact}
            hasLoanHistory={paymentHistory.length > 0}
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
              .reduce((sum, p) => {
                const occupiedUnits =
                  p.occupiedUnits ?? getUnitTenants(p).length;
                return sum + p.rentPrice * Math.max(0, occupiedUnits);
              }, 0)}
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
            onResetSim={handleResetSim}
            propertyManager={propertyManager}
            togglePropertyManager={togglePropertyManager}
            realEstateAgent={realEstateAgent}
            toggleRealEstateAgent={toggleRealEstateAgent}
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
