import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

interface Facility {
  FacilityName?: string;
  LogoPath?: string;
}

interface Department {
  id: number;
  code?: string;
  description?: string;
  dept_name?: string;
  auto_id?: number; // in case your DB uses auto_id
}

interface FacilityContextType {
  facility: Facility | null;
  loadFacility: () => Promise<void>;
  activeDepartment: Department | null;
  setActiveDepartment: (dept: Department) => void;
}

const FacilityContext = createContext<FacilityContextType | undefined>(undefined);

export const FacilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [activeDepartment, setActiveDepartment] = useState<Department | null>(null);

  const { user, token } = useAuth();

  /* ================= LOAD FACILITY ================= */
  const loadFacility = async () => {
    if (!token) return;

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

  /* ================= INIT ACTIVE DEPARTMENT ================= */
  useEffect(() => {
    if (user?.defaultDepartment) {
      setActiveDepartment(user.defaultDepartment);
    }
  }, [user]);

  /* ================= LOAD FACILITY WHEN TOKEN READY ================= */
  useEffect(() => {
    if (token) {
      loadFacility();
    }
  }, [token]);

  return (
    <FacilityContext.Provider
      value={{
        facility,
        loadFacility,
        activeDepartment,
        setActiveDepartment
      }}
    >
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