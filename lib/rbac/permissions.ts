/**
 * Granular Role-Based Access Control (RBAC) System
 * 50+ individual security toggles for fine-grained admin control
 */

export const RBAC_PERMISSIONS = {
  // User Management (8 permissions)
  "users:view": { name: "View Users", category: "User Management", description: "View user profiles and details" },
  "users:edit": { name: "Edit Users", category: "User Management", description: "Modify user account information" },
  "users:create": { name: "Create Users", category: "User Management", description: "Create new user accounts" },
  "users:delete": { name: "Delete Users", category: "User Management", description: "Delete user accounts permanently" },
  "users:suspend": { name: "Suspend Users", category: "User Management", description: "Suspend or freeze user accounts" },
  "users:impersonate": { name: "Impersonate Users", category: "User Management", description: "Login as any user (god mode)" },
  "users:reset-password": { name: "Reset User Password", category: "User Management", description: "Reset user passwords" },
  "users:export": { name: "Export User Data", category: "User Management", description: "Export user list and analytics" },

  // Plan & Billing Management (7 permissions)
  "billing:edit-plans": { name: "Edit Subscription Plans", category: "Billing", description: "Modify plan pricing and features" },
  "billing:edit-limits": { name: "Edit Plan Limits", category: "Billing", description: "Adjust verification limits per tier" },
  "billing:view-revenue": { name: "View Revenue", category: "Billing", description: "View platform revenue and payouts" },
  "billing:manage-coupons": { name: "Manage Coupons", category: "Billing", description: "Create, edit, delete discount codes" },
  "billing:custom-offers": { name: "Create Custom Offers", category: "Billing", description: "Issue custom pricing to users" },
  "billing:view-invoices": { name: "View All Invoices", category: "Billing", description: "View invoices across all users" },
  "billing:refund": { name: "Process Refunds", category: "Billing", description: "Manually process refunds" },

  // Content & Policy Management (6 permissions)
  "content:edit-privacy": { name: "Edit Privacy Policy", category: "Legal", description: "Update privacy policy documents" },
  "content:edit-terms": { name: "Edit Terms & Conditions", category: "Legal", description: "Update terms of service" },
  "content:edit-refund": { name: "Edit Refund Policy", category: "Legal", description: "Update refund policy" },
  "content:edit-faq": { name: "Edit FAQ", category: "Legal", description: "Manage FAQ section" },
  "content:edit-blog": { name: "Edit Blog", category: "Legal", description: "Create and edit blog posts" },
  "content:manage-tutorials": { name: "Manage Tutorials", category: "Content", description: "Create, edit and publish tutorials" },
  "content:publish": { name: "Publish Content", category: "Legal", description: "Publish content to live site" },

  // Support & Tickets (6 permissions)
  "support:view-tickets": { name: "View All Tickets", category: "Support", description: "View support tickets from all users" },
  "support:respond": { name: "Respond to Tickets", category: "Support", description: "Reply to support tickets" },
  "support:assign": { name: "Assign Tickets", category: "Support", description: "Assign tickets to support staff" },
  "support:close-ticket": { name: "Close Tickets", category: "Support", description: "Mark tickets as resolved" },
  "support:ai-config": { name: "Configure AI Ticket System", category: "Support", description: "Adjust AI ticket settings" },
  "support:escalate": { name: "Escalate Tickets", category: "Support", description: "Escalate tickets to higher tier" },

  // Communication & Notifications (5 permissions)
  "notifications:send-global": { name: "Send Global Announcements", category: "Communications", description: "Broadcast to all users" },
  "notifications:send-segment": { name: "Send Segmented Alerts", category: "Communications", description: "Send alerts to user segments" },
  "notifications:send-individual": { name: "Send Individual Notifications", category: "Communications", description: "Message individual users" },
  "notifications:critical-popup": { name: "Send Critical Popups", category: "Communications", description: "Trigger high-priority red alerts" },
  "notifications:email-broadcast": { name: "Send Email Broadcasts", category: "Communications", description: "Send bulk emails" },

  // Security & Monitoring (8 permissions)
  "security:view-audit-log": { name: "View Audit Logs", category: "Security", description: "Access full audit trail" },
  "security:view-suspicious": { name: "View Suspicious Accounts", category: "Security", description: "See flagged accounts" },
  "security:manage-flags": { name: "Manage Security Flags", category: "Security", description: "Mark/unmark suspicious activity" },
  "security:view-ips": { name: "View IP Logs", category: "Security", description: "View login IP history" },
  "security:manage-whitelist": { name: "Manage IP Whitelist", category: "Security", description: "Control IP restrictions" },
  "security:view-sessions": { name: "View Active Sessions", category: "Security", description: "See all active user sessions" },
  "security:revoke-sessions": { name: "Revoke User Sessions", category: "Security", description: "Force logout users" },
  "security:2fa-reset": { name: "Reset 2FA", category: "Security", description: "Reset 2FA for users" },

  // Platform Configuration (8 permissions)
  "config:upi-settings": { name: "Configure UPI Settings", category: "Platform", description: "Manage UPI destination accounts" },
  "config:integration": { name: "Manage Integrations", category: "Platform", description: "Configure third-party integrations" },
  "config:smtp": { name: "Configure Email", category: "Platform", description: "Setup SMTP settings" },
  "config:webhooks": { name: "Manage Webhooks", category: "Platform", description: "Configure platform webhooks" },
  "config:api-keys": { name: "Manage API Keys", category: "Platform", description: "Create/revoke platform API keys" },
  "config:feature-flags": { name: "Toggle Features", category: "Platform", description: "Enable/disable platform features" },
  "config:maintenance": { name: "Maintenance Mode", category: "Platform", description: "Enable maintenance mode" },
  "config:rate-limits": { name: "Configure Rate Limits", category: "Platform", description: "Adjust API rate limits" },

  // Admin & Staff Management (6 permissions)
  "admin:manage-roles": { name: "Manage Roles", category: "Admin", description: "Create/edit/delete admin roles" },
  "admin:manage-staff": { name: "Manage Staff", category: "Admin", description: "Invite/remove staff members" },
  "admin:view-staff": { name: "View Staff", category: "Admin", description: "See staff list and permissions" },
  "admin:edit-permissions": { name: "Edit Permissions", category: "Admin", description: "Assign permissions to roles" },
  "admin:view-logs": { name: "View Admin Logs", category: "Admin", description: "See admin action history" },
  "admin:access-analytics": { name: "Access Platform Analytics", category: "Admin", description: "View comprehensive analytics" },

  // Webhook & Event Management (4 permissions)
  "webhooks:view-all": { name: "View All Webhooks", category: "Webhooks", description: "See user webhooks" },
  "webhooks:test": { name: "Test Webhooks", category: "Webhooks", description: "Trigger test webhook events" },
  "webhooks:retry": { name: "Retry Failed Webhooks", category: "Webhooks", description: "Manually retry failed deliveries" },
  "webhooks:manage": { name: "Manage Webhooks", category: "Webhooks", description: "Edit/delete user webhooks" },
} as const;

export type RBACPermission = keyof typeof RBAC_PERMISSIONS;

/**
 * Default roles with predefined permission sets
 */
export const DEFAULT_ROLES = {
  OWNER: {
    name: "Owner",
    description: "Platform owner with unrestricted access",
    permissions: Object.keys(RBAC_PERMISSIONS) as RBACPermission[],
  },
  ADMIN: {
    name: "Administrator",
    description: "Full administrative access",
    permissions: [
      "users:view",
      "users:edit",
      "users:impersonate",
      "users:suspend",
      "billing:view-revenue",
      "support:view-tickets",
      "support:respond",
      "security:view-audit-log",
      "admin:view-logs",
      "admin:access-analytics",
    ] as RBACPermission[],
  },
  SUPPORT: {
    name: "Support Staff",
    description: "Support ticket handling",
    permissions: [
      "support:view-tickets",
      "support:respond",
      "support:assign",
      "support:close-ticket",
      "users:view",
      "notifications:send-individual",
    ] as RBACPermission[],
  },
  BILLING: {
    name: "Billing Manager",
    description: "Billing and revenue management",
    permissions: [
      "billing:edit-plans",
      "billing:view-revenue",
      "billing:manage-coupons",
      "billing:custom-offers",
      "billing:view-invoices",
      "billing:refund",
      "users:view",
      "admin:access-analytics",
    ] as RBACPermission[],
  },
  MODERATOR: {
    name: "Moderator",
    description: "Content and user moderation",
    permissions: [
      "users:view",
      "users:suspend",
      "content:edit-faq",
      "security:view-suspicious",
      "security:manage-flags",
      "support:view-tickets",
      "notifications:send-segment",
    ] as RBACPermission[],
  },
} as const;

/**
 * Permission categories for organizing UI
 */
export const PERMISSION_CATEGORIES = [
  "Content",
  "User Management",
  "Billing",
  "Legal",
  "Support",
  "Communications",
  "Security",
  "Platform",
  "Admin",
  "Webhooks",
] as const;

/**
 * Get all permissions in a category
 */
export function getPermissionsByCategory(category: string): RBACPermission[] {
  return Object.entries(RBAC_PERMISSIONS)
    .filter(([_, perm]) => perm.category === category)
    .map(([key]) => key as RBACPermission);
}

/**
 * Get permission details
 */
export function getPermissionDetails(permission: RBACPermission) {
  return RBAC_PERMISSIONS[permission];
}

/**
 * Check if a permission exists
 */
export function isValidPermission(permission: string): permission is RBACPermission {
  return permission in RBAC_PERMISSIONS;
}
