import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import LandingContent from "./(nondashboard)/landing/LandingContent";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Student24 - Your Best Student Housing Platform",
  description: "Find perfect student accommodation close to your campus. Connect students with landlords. Search, apply, and book your ideal room today.",
};

export default function Home() {
  return (
    <Suspense fallback={null}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Navbar />
        <main className="h-full flex w-full flex-col">
          <LandingContent />
        </main>
      </div>
    </Suspense>
  );
}
