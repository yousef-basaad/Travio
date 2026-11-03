import type { Messages } from "./en";

// Arabic dashboard copy. Typed as Messages, so a key missing here (or
// one that no longer exists in en.ts) is a type error.
export const ar: Messages = {
  "nav.operationsCenter": "مركز العمليات",
  "nav.crm": "العملاء",
  "nav.leads": "العملاء المحتملون",
  "nav.bookings": "الحجوزات",
  "nav.visa": "مركز التأشيرات",
  "nav.finance": "المالية",
  "nav.analytics": "التحليلات",
  "nav.documents": "المستندات",
  "nav.calendar": "التقويم",
  "nav.inbox": "صندوق الوارد",
  "nav.activities": "الأنشطة",
  "nav.aiAssistant": "المساعد الذكي",
  "nav.team": "الفريق",
  "nav.subscription": "الاشتراك",
  "nav.settings": "الإعدادات",
  "nav.helpCenter": "مركز المساعدة",
  "nav.dashboard": "لوحة التحكم",

  "brand.tagline": "منصة الوكالات",

  "header.openNavigation": "فتح القائمة",

  "search.label": "بحث",
  "search.placeholder": "ابحث في الحجوزات والعملاء وطلبات التأشيرة…",
  "search.hint": "ابدأ الكتابة للبحث في مساحة العمل.",
  "search.notConnected": "البحث غير متاح بعد، لا يمكن البحث عن \"{query}\" هنا.",

  "quickAdd.label": "إضافة سريعة",
  "quickAdd.title": "إنشاء جديد",
  "quickAdd.newBooking": "حجز جديد",
  "quickAdd.newCustomer": "عميل جديد",

  "userMenu.profile": "الملف الشخصي",
  "userMenu.settings": "الإعدادات",
  "userMenu.logout": "تسجيل الخروج",
  "userMenu.switchLanguage": "English",

  "role.travio_admin": "مسؤول ترافيو",
  "role.agency_owner": "مالك الوكالة",
  "role.branch_manager": "مدير الفرع",
  "role.sales_agent": "مندوب مبيعات",
  "role.visa_officer": "موظف التأشيرات",
  "role.accountant": "محاسب",
  "role.customer": "عميل",

  "footer.lastUpdated": "آخر تحديث: {time}",
  "footer.refresh": "تحديث",
  "footer.rights": "© {year} ترافيو. جميع الحقوق محفوظة.",
  "footer.terms": "الشروط",
  "footer.privacy": "الخصوصية",

  "greeting.morning": "صباح الخير",
  "greeting.afternoon": "مساء الخير",
  "greeting.evening": "مساء الخير",
  "greeting.withName": "{greeting}، {name}",
  "greeting.subtitle": "إليك نظرة عامة على وكالتك اليوم.",

  "notifications.title": "الإشعارات",
  "notifications.withUnread": "الإشعارات ({count} غير مقروءة)",
  "notifications.markRead": "تحديد كمقروء",
  "notifications.markReadLabel": "تحديد \"{title}\" كمقروء",
  "notifications.markAllRead": "تحديد الكل كمقروء",
  "notifications.marking": "جارٍ التحديد…",
  "notifications.loading": "جارٍ تحميل الإشعارات",
  "notifications.error": "حدث خطأ أثناء تحميل الإشعارات. يرجى المحاولة لاحقاً.",
  "notifications.empty": "لا توجد إشعارات بعد",
};
