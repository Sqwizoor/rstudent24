import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

/**
 * API endpoint to update admin user settings
 * POST /api/admin/settings/update
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin authentication strictly with verifyAuth
    const authResult = await verifyAuth(req, ['admin']);
    if (!authResult.isAuthenticated || authResult.userRole !== 'admin') {
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

    // Update admin details in database
    if (authResult.userEmail) {
      const { prisma } = await import('@/lib/prisma');
      await prisma.admin.updateMany({
        where: { email: authResult.userEmail },
        data: {
          name: name || undefined,
        }
      }).catch((dbErr: any) => {
        console.warn("Could not update admin in prisma:", dbErr);
      });
    }

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
