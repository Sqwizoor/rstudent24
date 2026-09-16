"use client"

import { NAVBAR_HEIGHT } from "@/lib/constants"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useGetAuthUserQuery } from "@/state/api"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "aws-amplify/auth"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  Settings,
  LogOut,
  User,
  Shield,
  ChevronDown,
  LayoutDashboard,
  Users,
  BarChart4,
  Home
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const AdminNavbar = () => {
  const { data: authUser } = useGetAuthUserQuery(undefined)
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  // Helper function to get user's first letter for avatar
  const getUserInitial = () => {
    if (authUser?.cognitoInfo?.username) {
      return authUser.cognitoInfo.username[0].toUpperCase();
    }
    return "A"; // Default to "A" for Admin
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    await signOut().catch(() => {})
    window.location.href = "/signin"
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div 
        className="flex justify-between items-center w-full px-6 md:px-8 transition-colors backdrop-blur-xl border-b bg-[#09090b]/95 border-zinc-800/80 text-zinc-100"
        style={{ height: `${NAVBAR_HEIGHT}px` }}
      >
        {/* Left section: Logo and admin title */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="group transition-all duration-300">
            <div className="relative transform transition-transform duration-300">
              <Link href="/admin">
                <div className="flex items-center gap-2">
                  <picture>
                    <source srcSet="/student24-logo.avif" type="image/avif" />
                    <source srcSet="/student24-logo.webp" type="image/webp" />
                    <Image
                      src="/student24-logo-optimized.png"
                      alt="Student24 Logo"
                      width={160}
                      height={37}
                      className="object-contain h-14 cursor-pointer"
                      priority
                      draggable={false}
                      loading="eager"
                      quality={90}
                      sizes="160px"
                    />
                  </picture>
                  <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span className="font-medium text-emerald-400 text-xs uppercase tracking-wider">Admin</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Center section: Main navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 rounded-lg text-xs font-medium ${pathname === "/admin" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}
            onClick={() => router.push("/admin")}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 rounded-lg text-xs font-medium ${pathname.includes("/admin/students") ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}
            onClick={() => router.push("/admin/students")}
          >
            <Users className="h-4 w-4" />
            <span>Students</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 rounded-lg text-xs font-medium ${pathname.includes("/admin/properties") ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}
            onClick={() => router.push("/admin/properties")}
          >
            <Home className="h-4 w-4" />
            <span>Properties</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 rounded-lg text-xs font-medium ${pathname.includes("/admin/analytics") ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900"}`}
            onClick={() => router.push("/admin/analytics")}
          >
            <BarChart4 className="h-4 w-4" />
            <span>Analytics</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900"
            onClick={() => router.push("/")}
          >
            <Home className="h-4 w-4" />
            <span>Main Site</span>
          </Button>
        </nav>

        {/* Right section: User actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-2 md:px-3 text-zinc-200 hover:bg-zinc-900 hover:text-white"
              >
                <Avatar className="h-8 w-8 border border-zinc-700">
                  <AvatarFallback className="bg-zinc-800 text-white font-semibold">
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-xs font-medium text-white">
                    {authUser?.cognitoInfo?.username ? 
                      authUser.cognitoInfo.username.charAt(0).toUpperCase() + authUser.cognitoInfo.username.slice(1) : 
                      "Admin User"}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Administrator
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-zinc-950 shadow-2xl rounded-xl border border-zinc-800 mt-2 p-1.5 min-w-[200px] text-zinc-200 animate-in fade-in-50 zoom-in-95 duration-200"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuItem
                className="cursor-pointer py-2 px-3 my-0.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors duration-150 flex items-center gap-2 text-xs"
                onClick={() => router.push("/admin/settings")}
              >
                <Settings className="w-4 h-4 text-zinc-400" />
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-zinc-800 my-1" />

              <DropdownMenuItem
                className="cursor-pointer py-2 px-3 my-0.5 rounded-lg text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors duration-150 flex items-center gap-2 text-xs"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export default AdminNavbar
