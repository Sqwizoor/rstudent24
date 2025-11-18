"use client"

import { NAVBAR_HEIGHT } from "@/lib/constants"
import { ROUTES, NAVBAR_LINKS } from "@/lib/routes"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth"
import { usePathname, useRouter } from "next/navigation"
import { signOut as cognitoSignOut } from "aws-amplify/auth"
import { signOut as nextAuthSignOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Search, LogOut, ChevronDown, Home, Building2, Menu, X } from "lucide-react"
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
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"

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

  const userEmail =
    authUser?.email ||
    ((authUser as any)?.userInfo?.email as string | undefined) ||
    ((authUser as any)?.cognitoInfo?.email as string | undefined)

  const NavigationLinks = ({ mobile = false, onLinkClick }: { mobile?: boolean; onLinkClick?: () => void }) => (
    <nav className={mobile ? "flex flex-col space-y-4" : "hidden md:flex items-center space-x-3"}>
      {NAVBAR_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          onClick={onLinkClick}
          className={cn(
            mobile
              ? "text-lg font-medium text-slate-700 dark:text-slate-300 hover:text-[#00acee] dark:hover:text-[#00acee]"
              : "px-4 py-2 text-base font-medium transition-colors duration-300",
            !mobile &&
              (scrolled
                ? "text-slate-700 hover:text-[#00acee]"
                : isHomePage
                  ? "text-white hover:text-[#00acee]"
                  : "text-slate-700 hover:text-[#00acee]"),
          )}
          title={link.description}
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
        <div className="flex items-center gap-4 md:gap-6 md:flex-1">
          {isDashboardPage && (
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
          )}
          <Link href={ROUTES.HOME} className="group transition-all duration-300 relative" title="Go to home">
            <picture>
              <source srcSet="/student24-logo.avif" type="image/avif" />
              <source srcSet="/student24-logo.webp" type="image/webp" />
              <Image
                src="/student24-logo-optimized.png"
                alt="Student24 Logo"
                width={160}
                height={37}
                className="object-contain h-10 sm:h-12 md:h-14 cursor-pointer"
                priority
                draggable={false}
                loading="eager"
                quality={90}
                sizes="(max-width: 640px) 120px, 160px"
              />
            </picture>
          </Link>
        </div>

        {/* Center navigation (desktop) */}
        <div className="hidden md:flex flex-1 justify-center">
          <NavigationLinks />
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4 md:gap-6 md:flex-1 md:justify-end">
          {isDashboardPage && authUser?.role?.toLowerCase() === "tenant" && (
            <Button
              variant="default"
              className="hidden md:flex bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 shadow-sm"
              onClick={() => router.push(ROUTES.SEARCH)}
              title="Search for properties"
            >
              <Search className="h-4 w-4" />
              <span className="ml-2">Search Properties</span>
            </Button>
          )}

          {/* Register/Login (desktop only, when logged out) */}
          {!authUser && (
            <div className="hidden md:flex items-center gap-3">
              <Button
                className="h-10 rounded-full bg-[#00acee] text-white hover:bg-[#00acee]/90 shadow-lg px-5 md:px-8 lg:px-9 md:min-w-[140px]"
                onClick={() => router.push(ROUTES.SIGNUP)}
                title="Create a new account"
              >
                Register
              </Button>
              <Button
                className="h-10 rounded-full border-2 border-[#00acee] text-[#00acee] hover:bg-[#00acee] hover:text-white bg-transparent px-5 md:px-8 lg:px-9 md:min-w-[140px]"
                onClick={handlePrimaryAuthAction}
                title="Sign in to your account"
              >
                Login
              </Button>
            </div>
          )}

          {authUser && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full border border-slate-200/60 bg-white/80 px-2 py-1.5 shadow-sm transition-all duration-200 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00acee]/40"
                >
                  <Avatar className="h-10 w-10 text-[#00acee] bg-[#00acee]/10">
                    <AvatarFallback className="text-sm font-semibold uppercase text-[#00acee]">
                      {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-slate-700">{getDisplayName()}</span>
                    {authUser?.role && <span className="text-xs text-slate-500 capitalize">{authUser.role}</span>}
                  </div>
                  <ChevronDown className="hidden md:block h-4 w-4 text-slate-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-slate-900">{getDisplayName()}</p>
                  {userEmail && <p className="text-xs text-slate-500 truncate">{userEmail}</p>}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => handlePrimaryAuthAction()} className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Go to dashboard</span>
                </DropdownMenuItem>
                {authUser?.role?.toLowerCase() === "manager" && (
                  <DropdownMenuItem onSelect={() => router.push(ROUTES.MANAGER_NEW_PROPERTY)} className="cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Add property</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => handleSignOut()}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Toggle navigation"
                className={cn(
                  "md:hidden flex items-center justify-center w-10 h-10 rounded-full transition-colors z-50",
                  mobileMenuOpen
                    ? "text-blue-600 hover:text-blue-700"
                    : "text-slate-700 hover:text-blue-600",
                  isHomePage && !scrolled && !mobileMenuOpen && "text-white hover:text-blue-100",
                )}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </SheetTrigger>

            <SheetContent
              side="top"
              hideCloseButton
              className="w-full px-0 pb-8 bg-white/95 backdrop-blur-lg border-none rounded-b-2xl shadow-xl transition-all"
              style={{ paddingTop: NAVBAR_HEIGHT + 16 }}
            >
              {/* Custom close button with conditional styling */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "absolute top-4 right-6 flex items-center justify-center w-10 h-10 rounded-full transition-colors",
                  isHomePage && !scrolled
                    ? "text-white hover:text-blue-100 hover:bg-white/10"
                    : "text-slate-700 hover:text-blue-600 hover:bg-slate-100"
                )}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="px-6 space-y-8">
                <NavigationLinks mobile onLinkClick={() => setMobileMenuOpen(false)} />

                {authUser ? (
                  <div className="space-y-3 border-t border-gray-100/60 pt-6">
                    <Button
                      className="w-full h-11 rounded-full bg-[#00acee] text-white hover:bg-[#0099d4] transition-all"
                      onClick={() => {
                        handlePrimaryAuthAction()
                        setMobileMenuOpen(false)
                      }}
                      title="Go to dashboard"
                    >
                      Go to dashboard
                    </Button>
                    {authUser.role?.toLowerCase() === "manager" && (
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-full border-2 border-[#00acee] text-[#00acee] hover:bg-[#00acee] hover:text-white transition-all bg-transparent"
                        onClick={() => {
                          router.push(ROUTES.MANAGER_NEW_PROPERTY)
                          setMobileMenuOpen(false)
                        }}
                        title="Add a new property"
                      >
                        Add property
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-100 bg-transparent"
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
                      }}
                      title="Sign out from account"
                    >
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 border-t border-gray-100/60 pt-6">
                    <Button
                      className="w-full h-12 rounded-full bg-[#00acee] text-white hover:bg-[#00acee]/90 shadow-lg transition-all"
                      onClick={() => {
                        router.push(ROUTES.SIGNUP)
                        setMobileMenuOpen(false)
                      }}
                      title="Create a new account"
                    >
                      Register
                    </Button>
                    <Button
                      className="w-full h-12 rounded-full border-2 border-[#00acee] text-[#00acee] hover:bg-[#00acee] hover:text-white bg-transparent transition-all"
                      onClick={() => {
                        handlePrimaryAuthAction()
                        setMobileMenuOpen(false)
                      }}
                      title="Sign in to your account"
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
