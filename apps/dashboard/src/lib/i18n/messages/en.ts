// English dashboard copy - the source of truth for the message keys.
// ar.ts must provide every key (its type is Record<MessageKey, string>).
// {name} placeholders are filled by t(key, { name }).
export const en = {
  "nav.operationsCenter": "Operations Center",
  "nav.crm": "CRM",
  "nav.leads": "Leads",
  "nav.bookings": "Bookings",
  "nav.visa": "Visa Center",
  "nav.finance": "Finance",
  "nav.analytics": "Analytics",
  "nav.documents": "Documents",
  "nav.calendar": "Calendar",
  "nav.inbox": "Inbox",
  "nav.activities": "Activities",
  "nav.aiAssistant": "AI Assistant",
  "nav.team": "Team",
  "nav.subscription": "Subscription",
  "nav.settings": "Settings",
  "nav.helpCenter": "Help Center",
  "nav.dashboard": "Dashboard",

  "brand.tagline": "Agency Platform",

  "header.openNavigation": "Open navigation",

  "search.label": "Search",
  "search.placeholder": "Search bookings, customers, visa requests…",
  "search.hint": "Start typing to search across your workspace.",
  "search.notConnected": "Search isn't connected yet - \"{query}\" can't be looked up here.",

  "quickAdd.label": "Quick add",
  "quickAdd.title": "Create new",
  "quickAdd.newBooking": "New Booking",
  "quickAdd.newCustomer": "New Customer",

  "userMenu.profile": "Profile",
  "userMenu.settings": "Settings",
  "userMenu.logout": "Logout",
  // Shown in the language being switched TO, so it's readable either way.
  "userMenu.switchLanguage": "العربية",

  "role.travio_admin": "Travio admin",
  "role.agency_owner": "Agency owner",
  "role.branch_manager": "Branch manager",
  "role.sales_agent": "Sales agent",
  "role.visa_officer": "Visa officer",
  "role.accountant": "Accountant",
  "role.customer": "Customer",

  "footer.lastUpdated": "Last updated: {time}",
  "footer.refresh": "Refresh",
  "footer.rights": "© {year} Travio. All rights reserved.",
  "footer.terms": "Terms",
  "footer.privacy": "Privacy",

  "greeting.morning": "Good morning",
  "greeting.afternoon": "Good afternoon",
  "greeting.evening": "Good evening",
  "greeting.withName": "{greeting}, {name}",
  "greeting.subtitle": "Here's an overview of your agency today.",

  "notifications.title": "Notifications",
  "notifications.withUnread": "Notifications ({count} unread)",
  "notifications.markRead": "Mark read",
  "notifications.markReadLabel": "Mark \"{title}\" as read",
  "notifications.markAllRead": "Mark all read",
  "notifications.marking": "Marking…",
  "notifications.loading": "Loading notifications",
  "notifications.error": "Something went wrong loading notifications. Please try again later.",
  "notifications.empty": "No notifications yet",
} as const;

export type MessageKey = keyof typeof en;
export type Messages = Record<MessageKey, string>;
