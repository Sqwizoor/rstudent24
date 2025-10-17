"use client"

import { NAVBAR_HEIGHT } from "@/lib/constants"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth"
import { usePathname, useRouter } from "next/navigation"
import { signOut as cognitoSignOut } from "aws-amplify/auth"
import { signOut as nextAuthSignOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Search, Settings, LogOut, User, ChevronDown, Home, Building2, BookOpen, Shield, Menu, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useSignInRedirect } from "@/hooks/useSignInRedirect"
import { Sheet, SheetContent } from "@/components/ui/sheet"

const Navbar = () => {
  const { user: authUser, isAuthenticated, provider, isLoading: authLoading } = useUnifiedAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { homeSigninUrl, homeSignupUrl } = useSignInRedirect()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isDashboardPage = pathname.includes("/managers") || pathname.includes("/tenants") || pathname.includes("/admin")
  const isHomePage = pathname === "/"

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll)
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSignOut = async () => {
    try {
      if (provider === "google") {
        await nextAuthSignOut({ callbackUrl: "/" })
      } else if (provider === "cognito") {
        await cognitoSignOut()
        window.location.href = "/"
      }
    } catch (error) {
      console.error("Sign out error:", error)
      window.location.href = "/"
    }
  }

  const getDisplayName = () => {
    if (!authUser) return "User"
    const role = authUser.role?.toLowerCase()
    const userInfo: any = (authUser as any)?.userInfo || {}
    const cognitoInfo: any = (authUser as any)?.cognitoInfo || {}
    const isGeneric = (val?: string) => {
      if (!val) return true
      const trimmed = val.trim().toLowerCase()
      return trimmed === "manager" || trimmed === "admin" || trimmed === "tenant"
    }
    const rawName = authUser.name || userInfo.name
    if (rawName && !isGeneric(rawName)) return rawName.trim()
    const username = userInfo.username || cognitoInfo.username
    if (username && !isGeneric(username)) return String(username).trim()
    const email = authUser.email || userInfo.email || cognitoInfo.email
    if (email && typeof email === "string") {
      const local = email.split("@")[0]
      if (local) return local
      return email
    }
    return "User"
  }

  const handlePrimaryAuthAction = () => {
    if (isAuthenticated && authUser?.role) {
      const role = authUser.role.toLowerCase()
      if (role === "admin") return router.push("/admin")
      if (role === "manager") return router.push("/managers/properties")
      return router.push("/tenants/favorites")
    }
    router.push(homeSigninUrl)
  }

  const getUserInitial = () => {
    const display = getDisplayName()
    if (!display || display === "User") return "U"
    const parts = display.split(/\s+/).filter(Boolean)
    if (parts.length >= 2 && /[a-z]/i.test(parts[0][0]) && /[a-z]/i.test(parts[parts.length - 1][0])) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    const firstChar = display[0]
    if (firstChar && /[a-z]/i.test(firstChar)) return firstChar.toUpperCase()
    return "U"
  }

  const NavigationLinks = ({ mobile = false, onLinkClick }: { mobile?: boolean; onLinkClick?: () => void }) => (
    <nav className={mobile ? "flex flex-col space-y-4" : "hidden md:flex items-center space-x-3"}>
      {[
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/contact-us", label: "Contact" },
        { href: "/landlords", label: "Landlords" },
        { href: "/blog", label: "Blog" },
      ].map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onLinkClick}
          className={cn(
            mobile
              ? "text-lg font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400"
              : "px-4 py-2 text-base font-medium transition-colors duration-300",
            !mobile &&
              (scrolled
                ? "text-slate-700 hover:text-blue-600"
                : isHomePage
                ? "text-white hover:text-blue-100"
                : "text-slate-700 hover:text-blue-600"),
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )

  return (
    <header className="fixed top-0 left-0 w-full z-[70]">
      <div
        className={cn(
          "flex justify-between items-center w-full px-6 md:px-8 transition-all duration-300",
          isDashboardPage
            ? "bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-700/40 backdrop-blur-lg"
            : scrolled
            ? "bg-white/90 border-b border-slate-200 backdrop-blur-lg"
            : isHomePage
            ? "bg-transparent border-transparent"
            : "bg-white/80 backdrop-blur-sm border-b border-slate-200/30",
        )}
        style={{ height: `${NAVBAR_HEIGHT}px` }}
      >
        {/* Left section */}
        <div className="flex items-center gap-4 md:gap-6">
          {isDashboardPage && <div className="md:hidden"><SidebarTrigger /></div>}
          <Link href="/" className="group transition-all duration-300 relative">
            <Image
              src="/student24-logo.png"
              alt="Rentiful Logo"
              width={160}
              height={53}
              className="object-contain h-10 sm:h-12 md:h-14 cursor-pointer"
              priority
              draggable={false}
            />
          </Link>
        </div>

        {/* Middle section (Dashboard actions for tenants) */}
        <div className="flex items-center justify-center">
          {isDashboardPage && authUser?.role?.toLowerCase() === "tenant" && (
            <Button
              variant="default"
              className="hidden md:flex bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 shadow-sm"
              onClick={() => router.push("/search")}
            >
              <Search className="h-4 w-4" />
              <span className="ml-2">Search Properties</span>
            </Button>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4 md:gap-6">
          <NavigationLinks />

          {/* Register/Login (desktop only, when logged out) */}
          {!authUser && (
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                className="h-10 rounded-full bg-transparent border-2 border-[#00acee] text-[#00acee] hover:bg-[#00acee] hover:text-white transition-all"
                onClick={() => router.push(homeSignupUrl)}
              >
                Register
              </Button>
              <Button
                className="h-10 rounded-full bg-[#00acee] text-white hover:bg-[#00acee]/90 shadow-lg"
                onClick={handlePrimaryAuthAction}
              >
                Login
              </Button>
            </div>
          )}

          {/* ✅ Manual mobile toggle button replaces SheetTrigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "md:hidden flex items-center justify-center w-10 h-10 rounded-full transition-colors",
              "text-slate-700 hover:text-blue-600",
              isHomePage && !scrolled && !mobileMenuOpen && "text-white hover:text-blue-100",
              mobileMenuOpen && "text-blue-600 hover:text-blue-700",
            )}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Mobile menu content */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetContent
              side="top"
              className="w-full min-h-[70vh] pt-24 px-0 bg-white/95 backdrop-blur-lg border-none rounded-b-2xl shadow-xl transition-all"
            >
              <div className="flex flex-col h-full">
                <div className="flex-1 px-6 pt-2">
                  <NavigationLinks mobile onLinkClick={() => setMobileMenuOpen(false)} />
                </div>
                {!authUser && (
                  <div className="mt-auto border-t border-gray-100/60 bg-white/90 backdrop-blur-sm p-6 space-y-4 rounded-t-2xl shadow-lg">
                    <Button
                      variant="outline"
                      className="w-full h-12 rounded-full bg-transparent border-2 border-[#00acee] text-[#00acee] hover:bg-[#00acee] hover:text-white transition-all"
                      onClick={() => {
                        router.push(homeSignupUrl)
                        setMobileMenuOpen(false)
                      }}
                    >
                      Register
                    </Button>
                    <Button
                      className="w-full h-12 rounded-full bg-[#00acee] text-white hover:bg-[#00acee]/90 shadow-lg transition-all"
                      onClick={() => {
                        handlePrimaryAuthAction()
                        setMobileMenuOpen(false)
                      }}
                    >
                      Login
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Navbar
