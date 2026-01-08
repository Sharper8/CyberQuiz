"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type AccessibilitySettings = {
  colorBlindMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: "normal" | "large" | "extra-large";
  lowPowerMode: boolean;
};

type AccessibilityContextType = {
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    colorBlindMode: false,
    highContrast: false,
    reducedMotion: false,
    fontSize: "normal",
    lowPowerMode: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cyberquiz-a11y");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load a11y settings", e);
      }
    }
  }, []);

  // Apply settings to document element
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Classes
    if (settings.colorBlindMode) root.classList.add("colorblind");
    else root.classList.remove("colorblind");
    
    if (settings.highContrast) root.classList.add("high-contrast");
    else root.classList.remove("high-contrast");
    
    if (settings.reducedMotion) root.classList.add("reduced-motion");
    else root.classList.remove("reduced-motion");

    if (settings.lowPowerMode) root.classList.add("low-power");
    else root.classList.remove("low-power");

    // Font size
    root.style.fontSize = 
      settings.fontSize === "large" ? "115%" : 
      settings.fontSize === "extra-large" ? "130%" : 
      "100%";

    localStorage.setItem("cyberquiz-a11y", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <AccessibilityContext.Provider value={{ settings, updateSettings }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider");
  }
  return context;
};
