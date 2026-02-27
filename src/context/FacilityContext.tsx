import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
interface Facility {
  FacilityName?: string;
  LogoPath?: string;
}

interface FacilityContextType {
  facility: Facility | null;
  loadFacility: () => Promise<void>;
}

const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

export const FacilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [facility, setFacility] = useState<Facility | null>(null);

const loadFacility = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("No token yet — skipping facility load");
    return;
  }

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/facility`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    if (!res.ok) {
      console.error("Facility fetch failed:", res.status);
      return;
    }

    const data = await res.json();
    setFacility(data);
  } catch (err) {
    console.error("Failed to load facility", err);
  }
};

const { token } = useAuth();

useEffect(() => {
  if (token) {
    loadFacility();
  }
}, [token]);

  return (
    <FacilityContext.Provider value={{ facility, loadFacility }}>
      {children}
    </FacilityContext.Provider>
  );
};

export const useFacility = () => {
  const context = useContext(FacilityContext);
  if (!context) {
    throw new Error("useFacility must be used within FacilityProvider");
  }
  return context;
};