import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Student24 - Your Student Housing Partner",
  description: "Learn about Student24, the leading student housing platform connecting students with quality accommodation near their universities.",
  keywords: ["about", "student housing", "accommodation provider", "South Africa"],
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
