import React, { createContext, useContext, useState, useEffect } from "react";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const TABLE = "kv_store_84bb53da";

const headers = {
  "Content-Type": "application/json",
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
};

export type Report = {
  id: string;
  citizenImage: string;
  status: "Pending" | "Verified" | "Rejected";
  date: string;
  location: string;
  lat?: number;
  lng?: number;
  workerLat?: number;
  workerLng?: number;
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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&key=like.report_*`,
        { headers }
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        const parsed = data
          .map((row: any) => {
            try {
              return typeof row.value === "string"
                ? JSON.parse(row.value)
                : row.value;
            } catch { return null; }
          })
          .filter(Boolean) as Report[];
        setReports(parsed);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const addReport = async (report: Partial<Report>, citizenImageBase64: string) => {
    try {
      const fullReport: Report = {
        id: report.id!,
        citizenImage: citizenImageBase64,
        status: "Pending",
        date: report.date ?? new Date().toISOString(),
        location: report.location ?? "Unknown",
        lat: report.lat,
        lng: report.lng,
      };

      await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
        method: "POST",
        headers: { ...headers, "Prefer": "return=minimal" },
        body: JSON.stringify({
          key: `report_${fullReport.id}`,
          value: fullReport,
        }),
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
      // Get existing report first
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.report_${id}&select=*`,
        { headers }
      );
      const rows = await res.json();
      if (!rows.length) return;

      const existing: Report = typeof rows[0].value === "string"
        ? JSON.parse(rows[0].value)
        : rows[0].value;

      const updated: Report = {
        ...existing,
        ...updates,
        ...(workerImageBase64 ? { workerImage: workerImageBase64 } : {}),
      };

      await fetch(
        `${SUPABASE_URL}/rest/v1/${TABLE}?key=eq.report_${id}`,
        {
          method: "PATCH",
          headers: { ...headers, "Prefer": "return=minimal" },
          body: JSON.stringify({ value: updated }),
        }
      );

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