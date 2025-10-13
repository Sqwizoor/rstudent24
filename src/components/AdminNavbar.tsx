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
    await signOut()
    window.location.href = "/admin-login"
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div 
        className="flex justify-between items-center w-full px-6 md:px-8 transition-colors backdrop-blur-lg border-b
                  bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/40"
        style={{ height: `${NAVBAR_HEIGHT}px` }}
      >
        {/* Left section: Logo and admin title */}
        <div className="flex items-center gap-4 md:gap-6">
          <div className="group transition-all duration-300">
            <div className="relative transform transition-transform duration-300">
              <Link href="/admin">
                <div className="flex items-center gap-2">
                  <Image
                    src="/student24-logo.png"
                    alt="Student24 Logo"
                    width={160}
                    height={53}
                    className="object-contain h-14 cursor-pointer"
                    priority
                    draggable={false}
                  />
                  <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                    <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="font-medium text-blue-700 dark:text-blue-400 text-sm">Admin</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Center section: Main navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <Button
            variant={pathname === "/admin" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => router.push("/admin")}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Button>
          <Button
            variant={pathname.includes("/admin/students") ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => router.push("/admin/students")}
          >
            <Users className="h-4 w-4" />
            <span>Students</span>
          </Button>
          <Button
            variant={pathname.includes("/admin/properties") ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => router.push("/admin/properties")}
          >
            <Home className="h-4 w-4" />
            <span>Properties</span>
          </Button>
          <Button
            variant={pathname.includes("/admin/analytics") ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => router.push("/admin/analytics")}
          >
            <BarChart4 className="h-4 w-4" />
            <span>Analytics</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
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
                className="gap-2 px-2 md:px-3"
              >
                <Avatar className="h-8 w-8 border-2 border-blue-200 dark:border-blue-800">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">
                    {authUser?.cognitoInfo?.username ? 
                      authUser.cognitoInfo.username.charAt(0).toUpperCase() + authUser.cognitoInfo.username.slice(1) : 
                      "Admin User"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Administrator
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-white dark:bg-slate-900 shadow-xl rounded-xl border border-slate-200 dark:border-slate-800 mt-2 p-1 min-w-[200px] animate-in fade-in-50 zoom-in-95 duration-200"
              align="end"
              sideOffset={8}
            >
              <DropdownMenuItem
                className="cursor-pointer py-2.5 px-3 my-1 rounded-md text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 flex items-center gap-2 text-sm"
                onClick={() => router.push("/admin/settings")}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800 my-1" />

              <DropdownMenuItem
                className="cursor-pointer py-2.5 px-3 my-1 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-200 flex items-center gap-2 text-sm"
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
