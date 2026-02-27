import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  setAuth: (user: User | null, token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("ehr_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const setAuth = (newUser: User | null, newToken: string | null) => {
    setUser(newUser);
    setToken(newToken);

    if (newUser && newToken) {
      localStorage.setItem("ehr_user", JSON.stringify(newUser));
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("ehr_user");
      localStorage.removeItem("token");
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};