import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { z } from "zod";
import { RoomTypeEnum, RoomFeatureEnum, RoomAmenityEnum } from "./constants";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatEnumString(str: string) {
  return str.replace(/([A-Z])/g, " $1").trim();
}

export function formatPriceValue(value: number | null, isMin: boolean) {
  if (value === null || value === 0)
    return isMin ? "Min Price" : "Max Price";
  if (value >= 1000) {
    const kValue = value / 1000;
    return isMin ? `R${kValue}k+` : `<R${kValue}k`;
  }
  return isMin ? `R${value}+` : `<R${value}`;
}


export function cleanParams(params: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([_, value]) =>
        value !== undefined &&
        value !== "any" &&
        value !== "" &&
        (Array.isArray(value) ? value.some((v) => v !== null) : value !== null)
    )
  );
}

type MutationMessages = {
  success?: string;
  error?: string;
  showErrorToast?: boolean;
};

export const withToast = async <T>(
  mutationFn: Promise<T>,
  messages: Partial<MutationMessages>
) => {
  const { success, error, showErrorToast = true } = messages;

  try {
    const result = await mutationFn;
    if (success) toast.success(success);
    return result;
  } catch (err: any) {
    // Only show error toast if explicitly enabled and there's an error message
    if (showErrorToast && error) {
      // Extract the actual error message when possible
      const errorMessage = err?.data?.message || err?.message || error;
      toast.error(errorMessage, {
        id: `error-${errorMessage.slice(0, 20)}`, // Use first part of message as ID to prevent duplicates
        duration: 4000
      });
    }
    throw err;
  }
};

export const createNewUserInDatabase = async (
  user: any,
  idToken: any,
  userRole: string,
  fetchWithBQ: any
) => {
  // Determine which API endpoint to use based on the user role
  const createEndpoint =
    userRole?.toLowerCase() === "manager" ? "/managers" : "/tenants";

  // Add the cognitoId as a URL parameter as a fallback mechanism
  // This helps if the body parsing fails on the server
  const endpointWithFallback = `${createEndpoint}?cognitoId=${encodeURIComponent(user.userId)}`;

  // Prepare the user data for database creation
  const userData = {
    cognitoId: user.userId,
    name: user.username || '',
    email: idToken?.payload?.email || '',
    phoneNumber: '',
    // For managers, include required fields from the Manager model
    ...(userRole?.toLowerCase() === "manager" && {
      firstName: user.attributes?.given_name || '',
      lastName: user.attributes?.family_name || '',
      companyName: ''
    })
  };

  // Creating user in database

  try {
    // Make the API request with explicit headers
    const createUserResponse = await fetchWithBQ({
      url: endpointWithFallback,
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData), // Properly stringify the JSON body
    });

    // Check for different types of errors
    if (createUserResponse.error) {
      // Error creating user
      
      // If it's a 409 Conflict (user already exists), this is actually not an error
      // Allow the flow to continue since the user exists
      if (createUserResponse.error.status === 409) {
        // User already exists, proceeding with login
        return {
          data: createUserResponse.error.data?.manager || { cognitoId: user.userId }
        };
      }
      
      // For database schema errors, provide a helpful message
      if (createUserResponse.error.status === 500 && 
          createUserResponse.error.data?.message?.includes('schema')) {
        throw new Error(`Database schema error: ${createUserResponse.error.data.message}. Run database migrations.`);
      }
      
      // Generic error
      throw new Error(
        `Failed to create ${userRole} record: ${createUserResponse.error.data?.message || 'Unknown error'}`
      );
    }

    return createUserResponse;
  } catch (error) {
    // Exception creating user
    // Rethrow with more context
    throw error instanceof Error ? error : new Error(`Failed to create ${userRole} record`);
  }
};

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'R',
  }).format(amount);
}




