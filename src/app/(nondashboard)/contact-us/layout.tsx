import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Student24",
  description: "Get in touch with Student24. We're here to help answer any questions about student accommodation and housing.",
  keywords: ["contact", "support", "student housing", "inquiries"],
};

export default function ContactUsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
