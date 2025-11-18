import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog - Student24 - Student Housing Tips & Articles",
  description: "Read our blog for tips on finding student accommodation, rental advice, housing trends, and student living guides.",
  keywords: ["blog", "articles", "student housing tips", "rental advice", "housing guides"],
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
