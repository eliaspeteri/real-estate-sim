"use client";

import RealEstateSim from "./sim";
import { SettingsProvider } from "./context/settings.context";

export default function Home() {
  return (
    <>
      <SettingsProvider>
        <RealEstateSim />
      </SettingsProvider>
    </>
  );
}
