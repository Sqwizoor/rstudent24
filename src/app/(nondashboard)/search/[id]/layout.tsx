import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Details - Student24",
  description: "View detailed property information, available rooms, reviews, and location. Apply for your perfect student accommodation.",
  keywords: ["property", "accommodation details", "rooms", "student housing", "location"],
};

export default function SearchDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
