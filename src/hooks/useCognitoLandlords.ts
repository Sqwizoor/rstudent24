import { useEffect, useState, useCallback } from "react";
import type { ExtendedAuthUser } from "@/types/cognito";

export interface CognitoLandlord {
  username: string;
  userId: string;
  id?: number;
  email?: string;
  phoneNumber?: string;
  status?: string;
  attributes?: Record<string, string>;
}

export function useCognitoLandlords() {
  const [landlords, setLandlords] = useState<CognitoLandlord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLandlords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/managers");
      if (!res.ok) {
        setLandlords([]);
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setLandlords(data.map((m: any) => ({
          username: m.name || m.email || "Landlord",
          userId: String(m.cognitoId || m.id || m._id),
          id: m.id || m._id,
          email: m.email,
          phoneNumber: m.phoneNumber || "",
          status: m.status || "Active"
        })));
      }
    } catch (err: any) {
      console.warn("Manager fetch error:", err);
      setLandlords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLandlords();
  }, [fetchLandlords]);

  return { landlords, isLoading, error: null, refetch: fetchLandlords };
}
