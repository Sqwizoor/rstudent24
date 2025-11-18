import { NextRequest, NextResponse } from "next/server";
import { fetchAuthSession, updateUserAttributes } from "aws-amplify/auth";

/**
 * API endpoint to update admin user settings
 * POST /api/admin/settings/update
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication
    const session = await fetchAuthSession();
    if (!session.tokens?.idToken) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify admin role
    const userRole = session.tokens.idToken.payload?.["custom:role"] as string;
    const userEmail = session.tokens.idToken.payload?.email as string;
    
    const isAdmin = userRole === "admin" || 
                   (userEmail && userEmail.toLowerCase() === "admin@student24.co.za");
    
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    // Parse the request body
    const data = await req.json();
    const { email, name, phoneNumber } = data;

    // Prepare attributes to update
    const attributes: Record<string, string> = {};
    
    if (email) attributes.email = email;
    if (name) attributes.name = name;
    if (phoneNumber) attributes.phone_number = phoneNumber;

    // Check if any attributes to update
    if (Object.keys(attributes).length === 0) {
      return NextResponse.json(
        { success: false, message: "No updates provided" },
        { status: 400 }
      );
    }

    // Update user attributes in Cognito
    await updateUserAttributes({
      userAttributes: attributes
    });

    return NextResponse.json({
      success: true,
      message: "Admin settings updated successfully",
      updatedAttributes: attributes
    });
  } catch (error: any) {
    console.error("Error updating admin settings:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to update admin settings" 
      },
      { status: 500 }
    );
  }
}
