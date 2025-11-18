import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Landlords - Student24 - List Your Property",
  description: "List your student accommodation property on Student24. Reach thousands of students looking for quality housing near universities.",
  keywords: ["landlords", "property listing", "student housing", "rental", "income"],
};

export default function LandlordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
