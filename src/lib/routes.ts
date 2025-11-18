/**
 * Route Configuration and Navigation Map
 * This file documents all available routes in the application
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  ABOUT: '/about',
  CONTACT_US: '/contact-us',
  LANDLORDS: '/landlords',
  BLOG: '/blog',
  BLOG_POST: (id: string) => `/blog/${id}`,

  // Search and Properties
  SEARCH: '/search',
  PROPERTY_DETAIL: (id: string | number) => `/search/${id}`,

  // Authentication
  SIGNIN: '/signin',
  SIGNUP: '/signup',
  COGNITO_SIGNIN: '/cognito-signin',
  COGNITO_SIGNUP: '/cognito-signup',
  ADMIN_LOGIN: '/admin-login',
  ADMIN_SIGNUP: '/admin-signup',
  ADMIN_LOGOUT: '/admin-logout',

  // Dashboard - Admin
  ADMIN_DASHBOARD: '/admin',
  ADMIN_PROPERTIES: '/admin/properties',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_STUDENT_DETAIL: (id: string | number) => `/admin/students/${id}`,
  ADMIN_LANDLORDS: '/admin/landlords',
  ADMIN_LANDLORD_DETAIL: (id: string | number) => `/admin/landlords/${id}`,
  ADMIN_ANALYTICS: '/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',

  // Dashboard - Manager/Landlord
  MANAGER_PROPERTIES: '/managers/properties',
  MANAGER_NEW_PROPERTY: '/managers/newproperty',
  MANAGER_PROPERTY_DETAIL: (id: string | number) => `/managers/properties/${id}`,

  // Dashboard - Tenant/Student
  TENANT_DASHBOARD: '/tenants/favorites',
  TENANT_FAVORITES: '/tenants/favorites',
  TENANT_RESIDENCES: '/tenants/residences',
  TENANT_APPLICATIONS: '/tenants/applications',
  TENANT_SETTINGS: '/tenants/settings',
} as const

/**
 * Navigation links for the main navbar
 */
export const NAVBAR_LINKS = [
  {
    href: ROUTES.HOME,
    label: 'Home',
    description: 'Back to home page'
  },
  {
    href: ROUTES.ABOUT,
    label: 'About',
    description: 'Learn about Student24'
  },
  {
    href: ROUTES.CONTACT_US,
    label: 'Contact',
    description: 'Get in touch with us'
  },
  {
    href: ROUTES.LANDLORDS,
    label: 'Landlords',
    description: 'Information for property owners'
  },
  {
    href: ROUTES.BLOG,
    label: 'Blog',
    description: 'Read our latest articles'
  },
] as const

/**
 * Check if a route is valid and exists
 */
export function isValidRoute(path: string): boolean {
  const validRoutes = Object.values(ROUTES).filter(route => typeof route === 'string')
  return validRoutes.some(route => {
    // For parameterized routes, check the base path
    if (path.match(/\/\d+$/) || path.match(/\/[a-zA-Z0-9-]+$/)) {
      const basePath = path.substring(0, path.lastIndexOf('/'))
      return validRoutes.includes(basePath as any)
    }
    return route === path
  })
}

/**
 * Get a user-friendly route label
 */
export function getRouteLabel(path: string): string {
  const route = NAVBAR_LINKS.find(link => link.href === path)
  return route?.label || 'Page'
}
