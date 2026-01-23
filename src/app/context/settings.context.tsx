"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { TaxRegion } from "../utils/calculateTaxes.util";

type SettingsContextValue = {
  locale: string;
  currency: string;
  taxRegion: TaxRegion;
  setLocale: (locale: string) => void;
  setCurrency: (currency: string) => void;
  setTaxRegion: (taxRegion: TaxRegion) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date) => string;
  formatPercent: (value: number) => string;
};

const DEFAULT_LOCALE = "en-US";
const DEFAULT_CURRENCY = "USD";
const DEFAULT_TAX_REGION: TaxRegion = "US";
const STORAGE_KEY = "real-estate-sim.settings";

const SettingsContext = createContext<SettingsContextValue | null>(null);

const safeFormatCurrency = (locale: string, currency: string, amount: number) => {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency
    }).format(amount);
  } catch {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: "currency",
      currency: DEFAULT_CURRENCY
    }).format(amount);
  }
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [taxRegion, setTaxRegion] = useState<TaxRegion>(DEFAULT_TAX_REGION);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as Partial<{
        locale: string;
        currency: string;
        taxRegion: TaxRegion;
      }>;

      if (parsed.locale) setLocale(parsed.locale);
      if (parsed.currency) setCurrency(parsed.currency);
      if (parsed.taxRegion) setTaxRegion(parsed.taxRegion);
    } catch {
      // Ignore malformed storage values.
    }
  }, []);

  React.useEffect(() => {
    const payload = JSON.stringify({ locale, currency, taxRegion });
    window.localStorage.setItem(STORAGE_KEY, payload);
  }, [locale, currency, taxRegion]);

  const value = useMemo<SettingsContextValue>(() => {
    return {
      locale,
      currency,
      taxRegion,
      setLocale,
      setCurrency,
      setTaxRegion,
      formatCurrency: (amount) => safeFormatCurrency(locale, currency, amount),
      formatDate: (date) =>
        new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "short",
          day: "numeric"
        }).format(date),
      formatPercent: (value) =>
        new Intl.NumberFormat(locale, {
          style: "percent",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value / 100)
    };
  }, [locale, currency, taxRegion]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
