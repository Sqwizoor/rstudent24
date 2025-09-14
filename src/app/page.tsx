import Navbar from "@/components/Navbar";
import Landing from "./(nondashboard)/landing/page";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="h-full flex w-full flex-col">
        <Landing />
      </main>
    </div>
  );
}
