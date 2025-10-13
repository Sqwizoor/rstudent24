import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import type { ExtendedAuthUser } from "@/types/cognito";

export interface CognitoLandlord {
  username: string;
  userId: string;
  email?: string;
  phoneNumber?: string;
  status?: string;
  attributes?: Record<string, string>;
}

export function useCognitoLandlords() {
  const [landlords, setLandlords] = useState<CognitoLandlord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLandlords() {
      setIsLoading(true);
      setError(null);
      try {
        let headers: HeadersInit = {};
        try {
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken?.toString();
          if (idToken) {
            headers = { ...headers, Authorization: `Bearer ${idToken}` };
          }
        } catch {}

        const res = await fetch("/api/admin/cognito-landlords", { headers });
        if (!res.ok) throw new Error("Failed to fetch landlords from Cognito");
        const data = await res.json();
        setLandlords(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch landlords from Cognito");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLandlords();
  }, []);

  return { landlords, isLoading, error };
}
