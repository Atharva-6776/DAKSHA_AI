import React, { createContext, useContext, useState, useEffect } from "react";
import { projectId, publicAnonKey } from '/utils/supabase/info';

export type Report = {
  id: string;
  citizenImage: string;
  status: "Pending" | "Verified" | "Rejected";
  date: string;
  location: string;        // human-readable address / label
  lat?: number;            // GPS latitude  (set when citizen submits)
  lng?: number;            // GPS longitude (set when citizen submits)
  workerLat?: number;      // GPS latitude  (set when worker resolves)
  workerLng?: number;      // GPS longitude (set when worker resolves)
  workerImage?: string;
  integrityScore?: number;
  cleanlinessScore?: number;
  yoloScore?: number;
  opencvScore?: number;
};

type AppContextType = {
  reports: Report[];
  loading: boolean;
  addReport: (report: Partial<Report>, citizenImageBase64: string) => Promise<void>;
  updateReport: (id: string, updates: Partial<Report>, workerImageBase64?: string) => Promise<void>;
  fetchReports: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-84bb53da`;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/reports`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const addReport = async (report: Partial<Report>, citizenImageBase64: string) => {
    try {
      await fetch(`${API_URL}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ ...report, citizenImageBase64 }),
      });
      await fetchReports();
    } catch (err) {
      console.error("Error adding report:", err);
    }
  };

  const updateReport = async (
    id: string,
    updates: Partial<Report>,
    workerImageBase64?: string
  ) => {
    try {
      await fetch(`${API_URL}/reports/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ ...updates, workerImageBase64 }),
      });
      await fetchReports();
    } catch (err) {
      console.error("Error updating report:", err);
    }
  };

  return (
    <AppContext.Provider value={{ reports, loading, addReport, updateReport, fetchReports }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};