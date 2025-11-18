import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Properties - Student24",
  description: "Search and browse student accommodation properties. Filter by location, price, amenities, and find your perfect student home near your university.",
  keywords: ["search", "properties", "student accommodation", "rooms", "housing"],
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
