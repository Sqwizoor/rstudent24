import { NextRequest, NextResponse } from "next/server";
import { CognitoIdentityProviderClient, ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";

// You should store these securely in environment variables
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID!;
const AWS_REGION = process.env.AWS_REGION!;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID!;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY!;

export async function GET(request: NextRequest) {
  try {
    type CognitoAttribute = { Name: string; Value?: string };
    type CognitoUser = {
      Username: string;
      UserStatus?: string;
      Attributes?: CognitoAttribute[];
    };

    const client = new CognitoIdentityProviderClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      // Optionally filter by landlord/manager role
      // Filter: "custom:role = \"manager\""
    });
    const response = await client.send(command) as { Users?: CognitoUser[] };
    const landlords = (response.Users || [])
      .filter((user: CognitoUser) =>
        user.Attributes?.some(
          (attr: CognitoAttribute) => attr.Name === "custom:role" && ["manager", "landlord"].includes(attr.Value || "")
        )
      )
      .map((user: CognitoUser) => {
        const attributes: Record<string, string> = {};
        user.Attributes?.forEach((attr: CognitoAttribute) => {
          attributes[attr.Name] = attr.Value || "";
        });
        return {
          username: user.Username,
          userId: attributes["sub"] || user.Username,
          email: attributes["email"],
          phoneNumber: attributes["phone_number"],
          status: user.UserStatus,
          attributes,
        };
      });
    return NextResponse.json(landlords);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch landlords from Cognito" }, { status: 500 });
  }
}
