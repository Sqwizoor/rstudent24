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
import { ThemeToggle } from "@/components/ThemeToggle"
import { cn } from "@/lib/utils"
import {
  Plus,
  Search,
  Settings,
  LayoutDashboard,
  LogOut,
  User,
  Circle,
  ChevronDown,
  LogIn,
  UserPlus,
  Home,
  Building2,
  FileText,
  BookOpen,
  Shield
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SidebarTrigger } from "@/components/ui/sidebar"

const Navbar = () => {
  const { user: authUser, isAuthenticated, provider, isLoading: authLoading } = useUnifiedAuth()
  const router = useRouter()
  const pathname = usePathname()
  // Use auth loading to avoid UI flicker when session is still resolving
  const [isLoading, setIsLoading] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isDashboardPage = pathname.includes("/managers") || pathname.includes("/tenants") || pathname.includes("/admin")
  
  // Check if current page is the home page (which has a dark background image)
  const isHomePage = pathname === "/"

  // Sync component loading state with auth loading to avoid showing wrong UI briefly
  useEffect(() => {
    setIsLoading(!!authLoading)
  }, [authLoading])

  // For Next.js App Router, we need to handle route changes differently
  const handleRouteChangeComplete = () => {
    setIsLoading(false)
  }

  // Navigation state handling
  useEffect(() => {
    // Clean up loading state if component unmounts during navigation
    return () => {
      setIsLoading(false)
    }
  }, [])
  
  // Handle scroll events to change navbar background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    
    // Initial check
    handleScroll()
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const handleSignOut = async () => {
    setIsLoading(true)
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

  // Helper: derive initial(s) strictly from identity fields (never role)
  const getDisplayName = () => {
    if (!authUser) return 'User';
    const role = authUser.role?.toLowerCase();
    const userInfo: any = (authUser as any)?.userInfo || {};
    const cognitoInfo: any = (authUser as any)?.cognitoInfo || {};

    const isGeneric = (val?: string) => {
      if (!val) return true;
      const trimmed = val.trim().toLowerCase();
      return trimmed === 'manager' || trimmed === 'admin' || trimmed === 'tenant';
    };

    const rawName = authUser.name || userInfo.name;
    if (rawName && !isGeneric(rawName)) return rawName.trim();

    const username = userInfo.username || cognitoInfo.username;
    if (username && !isGeneric(username)) return String(username).trim();

    const email = authUser.email || userInfo.email || cognitoInfo.email;
    if (email && typeof email === 'string') {
      const local = email.split('@')[0];
      if (local) return local;
      return email;
    }
    return 'User';
  };

  const handlePrimaryAuthAction = () => {
    if (isAuthenticated && authUser?.role) {
      const role = authUser.role.toLowerCase();
      if (role === "admin") return router.push("/admin");
      if (role === "manager") return router.push("/managers/properties");
      return router.push("/tenants/favorites");
    }
    router.push("/signin");
  }

  const getUserInitial = () => {
    const display = getDisplayName();
    if (!display || display === 'User') return 'U';
    // If multi-word, take first + last initials
    const parts = display.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && /[a-z]/i.test(parts[0][0]) && /[a-z]/i.test(parts[parts.length - 1][0])) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    const firstChar = display[0];
    if (firstChar && /[a-z]/i.test(firstChar)) return firstChar.toUpperCase();
    return 'U';
  };

  return (
    <>
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
                  : "bg-white/80 backdrop-blur-sm border-b border-slate-200/30"
          )}
          style={{ height: `${NAVBAR_HEIGHT}px` }}
        >
          {/* Left section: Logo and dashboard actions */}
          <div className="flex items-center gap-4 md:gap-6">
            {isDashboardPage && (
              <div className="md:hidden">
                <SidebarTrigger />
              </div>
            )}
            <div className="group transition-all duration-300">
              <div className="relative transform transition-transform duration-300">
                <Link href="/" >
                  <Image
                    src="/student24-logo.png"
                    alt="Rentiful Logo"
                    width={160}
                    height={53}
                    className="object-contain h-14 cursor-pointer"
                    priority
                    draggable={false}
                  />
                </Link>
              </div>
            </div>
            
            {/* Add property button for managers */}
            {isDashboardPage && authUser && authUser.role?.toLowerCase() === "manager" && (
              <Button
                variant="default"
                className="ml-4 md:ml-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 shadow-sm dark:shadow-blue-900/20"
                onClick={() => router.push("/managers/newproperty")}
              >
                <Building2 className="h-4 w-4" />
                <span className="ml-2">Add Property</span>
              </Button>
            )}
            
            {/* Admin dashboard button */}
            {isDashboardPage && authUser && authUser.role?.toLowerCase() === "admin" && (
              <Button
                variant="default"
                className="ml-4 md:ml-6 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white transition-all duration-300 shadow-sm dark:shadow-purple-900/20"
                onClick={() => router.push("/admin")}
              >
                <Shield className="h-4 w-4" />
                <span className="ml-2">Admin Dashboard</span>
              </Button>
            )}
          </div>

          {/* Middle section with action buttons aligned with sidebar */}
          <div className="flex items-center justify-center">
            {isDashboardPage && authUser && authUser.role?.toLowerCase() === "tenant" && (
              <Button
                variant="default"
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all duration-300 shadow-sm dark:shadow-blue-900/20"
                onClick={() => router.push("/search")}
              >
                <Search className="h-4 w-4" />
                <span className="ml-2">Search Properties</span>
              </Button>
            )}
          </div>

          {/* Middle section removed */}

          {/* Right section: User actions */}
          <div className="flex items-center gap-6">
            {/* While loading auth, avoid rendering auth-dependent UI to prevent flicker */}
            {isLoading ? (
              <div className="flex items-center gap-4">
                <div className="h-9 w-32 rounded-full bg-slate-200 animate-pulse" />
                <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse" />
              </div>
            ) : authUser ? (
              <>
                {/* Theme toggle - only show on dashboard pages */}
                {isDashboardPage && <ThemeToggle />}
                
                {/* Settings link */}
                <Link href={`/${authUser.role?.toLowerCase()}s/settings`} className="group" scroll={false}>
                  <Settings className={`w-6 h-6 cursor-pointer text-slate-500 ${isDashboardPage ? 'dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400' : 'group-hover:text-blue-600'} transition-colors duration-300`} />
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 ${isDashboardPage ? 'dark:hover:bg-slate-800' : ''} transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isDashboardPage ? 'dark:focus-visible:ring-offset-slate-900' : ''}`}>
                      <Avatar className={`h-9 w-9 ring-2 ring-blue-500/20 ${isDashboardPage ? 'dark:ring-blue-500/30' : ''} hover:ring-blue-500/50 bg-gradient-to-br from-slate-50 to-slate-100 ${isDashboardPage ? 'dark:from-slate-800 dark:to-slate-900' : ''} transition-all duration-200 shadow-sm`}>
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium text-lg flex items-center justify-center">
                          {getUserInitial()}
                        </AvatarFallback>
                      </Avatar>

                      <ChevronDown className={`h-4 w-4 text-slate-400 group-hover:text-slate-500 ${isDashboardPage ? 'dark:text-slate-500 dark:group-hover:text-slate-400' : ''}`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className={`bg-white/95 ${isDashboardPage ? 'dark:bg-slate-900/95' : ''} backdrop-blur-sm shadow-xl rounded-xl border border-slate-200 ${isDashboardPage ? 'dark:border-slate-800/60' : ''} mt-2 p-1 min-w-[240px] animate-in fade-in-50 zoom-in-95 duration-200`}
                    align="end"
                    sideOffset={8}
                  >
                    {/* User info header */}
                    <div className={`px-4 py-3 border-b border-slate-200 ${isDashboardPage ? 'dark:border-slate-700/50' : ''}`}>
                      <div className="flex items-center gap-2">
                        <User className={`h-4 w-4 text-blue-600 ${isDashboardPage ? 'dark:text-blue-400' : ''}`} />
                        <p className={`font-medium text-slate-900 ${isDashboardPage ? 'dark:text-white' : ''}`}>
                          {getDisplayName()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        <p className={`text-xs text-slate-500 ${isDashboardPage ? 'dark:text-slate-400' : ''} capitalize`}>{authUser.role?.toLowerCase()} account</p>
                      </div>
                    </div>

                    {/* Dashboard link */}
                    <DropdownMenuItem
                      className={`cursor-pointer py-2.5 px-3 my-1 rounded-md text-slate-700 ${isDashboardPage ? 'dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800' : 'hover:text-blue-600 hover:bg-slate-100'} transition-colors duration-200 flex items-center gap-2 text-sm`}
                      onClick={() => {
                        if (authUser.role?.toLowerCase() === "admin") {
                          router.push("/admin", { scroll: false });
                        } else if (authUser.role?.toLowerCase() === "manager") {
                          router.push("/managers/properties", { scroll: false });
                        } else {
                          router.push("/tenants/favorites", { scroll: false });
                        }
                      }}
                    >
                      <Home className="w-4 h-4" />
                      <span>Dashboard</span>
                    </DropdownMenuItem>
                    
                    {/* Admin-specific menu item */}
                    {authUser.role?.toLowerCase() === "admin" && (
                      <DropdownMenuItem
                        className={`cursor-pointer py-2.5 px-3 my-1 rounded-md text-purple-700 ${isDashboardPage ? 'dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20' : 'hover:text-purple-800 hover:bg-purple-50'} transition-colors duration-200 flex items-center gap-2 text-sm`}
                        onClick={() => router.push('/admin/landlords', { scroll: false })}
                      >
                        <Shield className="w-4 h-4" />
                        <span>Manage Landlords</span>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      className="cursor-pointer py-2.5 px-3 my-1 rounded-md text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 flex items-center gap-2 text-sm"
                      onClick={() => router.push('/blog', { scroll: false })}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Blog</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      className="cursor-pointer py-2.5 px-3 my-1 rounded-md text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 flex items-center gap-2 text-sm"
                      onClick={() => router.push(`/${authUser.role?.toLowerCase()}s/settings`, { scroll: false })}
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
              </>
            ) : (
              <>
                <div className="flex items-center gap-6">
                  {/* Navigation links for non-authenticated users */}
                  <nav className="hidden md:flex items-center space-x-3">
                  <Link 
                    href="/" 
                    className={cn(
                      "px-4 py-2 text-base font-medium transition-colors duration-300",
                      scrolled ? "text-slate-700 hover:text-blue-600" : 
                      isHomePage ? "text-white hover:text-blue-100" : "text-slate-700 hover:text-blue-600"
                    )}
                  >
                    Home
                  </Link>
                  <Link 
                    href="/about" 
                    className={cn(
                      "px-4 py-2 text-base font-medium transition-colors duration-300",
                      scrolled ? "text-slate-700 hover:text-blue-600" : 
                      isHomePage ? "text-white hover:text-blue-100" : "text-slate-700 hover:text-blue-600"
                    )}
                  >
                    About
                  </Link>
                  <Link 
                    href="/contact-us" 
                    className={cn(
                      "px-4 py-2 text-base font-medium transition-colors duration-300",
                      scrolled ? "text-slate-700 hover:text-blue-600" : 
                      isHomePage ? "text-white hover:text-blue-100" : "text-slate-700 hover:text-blue-600"
                    )}
                  >
                    Contact
                  </Link>
                  <Link 
                    href="/landlords" 
                    className={cn(
                      "px-4 py-2 text-base font-medium transition-colors duration-300",
                      scrolled ? "text-slate-700 hover:text-blue-600" : 
                      isHomePage ? "text-white hover:text-blue-100" : "text-slate-700 hover:text-blue-600"
                    )}
                  >
                    Landlords
                  </Link>
                  </nav>
                  
                  {/* Theme toggle for non-authenticated users */}
                  <ThemeToggle />
                  
                  {/* Auth buttons */}
                  <div className="flex items-center gap-8 mr-5">
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => router.push("/signup")}
                    className={cn(
                      "transition-colors bg-transparent border-2 px-7 py-4 rounded-full text-l shadow-md",
                      scrolled 
                        ? "border-[#043e55] text-[#043e55] hover:border-[#00acee] hover:text-[#00acee]" 
                        : isHomePage
                          ? "border-gray-300 bg-transparent hover:border-gray-300 text-slate-200"
                          : "border-[#00acee] hover:border-[#00acee] text-slate-700 hover:text-blue-700"
                    )}
                  >
                    Register
                  </Button>
                  
                  <Button
                    size="lg"
                        onClick={handlePrimaryAuthAction}
                    className="bg-[#00acee] hover:bg-[#00acee] text-white  text-l px-7 py-5 rounded-full shadow-full hover:shadow-xl transition-all duration-300"
                  >
                        {isAuthenticated ? 'Go to dashboard' : 'Login'}
                  </Button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </header>
    </>
  );
}

export default Navbar
