# Elyto v2 High-Density Design System Implementation Guide

## Overview
This document provides guidelines for implementing the new high-density design system across all Elyto dashboard modules. The system prioritizes information density, micro-typography, and compact layouts while maintaining visual hierarchy and usability.

## Core Design Principles

### 1. Typography Scaling
- **Base Font Size**: 14px (body text)
- **Headers**: 16px (h1), 15px (h2)
- **Button Text**: 13px
- **Form Labels**: 13px
- **Micro-text (tables, captions)**: 12px

### 2. Component Density
- **Card Padding**: Fixed 16px globally
- **Button Padding**: 6px 12px (compact)
- **Border Radius**: 8px (dense)
- **Gap/Spacing**: 12px (normal), 8px (dense)

### 3. Table Row Height
- **Data Tables**: 36px per row (micro-typography only)
- **Columns**: Enforce micro-typography (text-micro class)
- **Status Badges**: 20px height, [10px font]

## Layout Patterns

### Header Pattern
```tsx
<DashboardHeader
  title="Module Title"
  description="Brief description"
  planBadge={{ label: "Free", variant: "default" }}
  actions={<Button>Action</Button>}
/>
```

### Grid Pattern
```tsx
<DashboardGrid columns={3} gap="gap-dense-lg">
  <StatCard label="Metric" value={123} unit="items" />
  <StatCard label="Metric" value="95%" trend="up" />
  <StatCard label="Metric" value="Healthy" />
</DashboardGrid>
```

### Card Pattern
```tsx
<DashboardCard title="Card Title" subtitle="Optional subtitle">
  {/* Content here */}
</DashboardCard>
```

### Table Pattern
```tsx
<DenseTable
  columns={[
    { key: "id", label: "ID", width: "w-24" },
    { key: "name", label: "Name", width: "flex-1" },
    { key: "status", label: "Status", render: (value) => <Badge>{value}</Badge> }
  ]}
  data={data}
  keyField="id"
  rowHeight="h-9"
/>
```

## Module-Specific Guidelines

### Projects Module
- **Grid View**: Show projects in 3-column grid (responsive)
- **Metadata Summary**: Single line description with ellipsis
- **Actions**: Edit, Delete (with confirmation), Settings
- **Delete Confirmation**: Require text entry matching project name

### Products Module
- **Compact Matrix**: Grid layout, thumbnail images only
- **Single-line Descriptions**: Truncate with ellipsis
- **Actions Dropdown**: Minimize visual clutter

### Orders Module
- **Dense Table**: 36px rows with micro-typography
- **Columns**: Order ID, Customer, Amount, Status, Date, UTR
- **Status Badges**: Color-coded (Verified=green, Pending=yellow, Failed=red)
- **Pagination**: Below table with current page info

### Gmail Integration
- **Single Connection**: Max 1 per user (enforced in backend)
- **Status Display**: Connection state, inbox address, health tokens
- **Actions**: Reconnect, Disconnect, Sync Now

### Webhooks Module
- **CRUD Interface**: Create, Read, Update, Delete in dense table
- **Columns**: Target URL, Events, Status, Last Delivery, Actions
- **Edit Modal**: Full-screen overlay for URL and event configuration
- **Delete Confirmation**: Require confirmation before removal

### Analytics Console
- **Multi-series Charts**: Compressed bar charts, line graphs
- **KPI Metrics**: Clean numeric display without large boxes
- **Filters**: Compact dropdown filters above charts

### Security Module
- **Login History**: Last 5 sessions with IP, Location, Device, Auth Method
- **Active Sessions**: Current session highlighted
- **Global Logout**: OTP-verified logout from all other devices
- **Location Data**: Geolocation details for audit trail

### Billing Module
- **Plan Display**: Current tier, limits, usage
- **Usage Meters**: Visual progress bars for verification quota
- **Upgrade Path**: Clear CTA to upgrade plans
- **Invoice History**: Paginated table with download links

### Support Tickets Module
- **AI Intake**: Welcome message → Issue description → AI responses
- **Escalation Path**: "Chat with support" button visible
- **Status Persistence**: Tickets saved to user support log
- **Admin View**: Staff can view/respond/archive tickets

## Toast Notifications

### Usage
```tsx
const { addToast } = useToast();

// Success
addToast("Operation completed", "success", 3000);

// Error
addToast("Connection error: Internet connection lost", "error", 0);

// Info
addToast("System maintenance completed", "info", 3000);
```

### Error Toast Rules
- Network Error: Red, no auto-dismiss (duration 0)
- Validation Error: Red, 5 second auto-dismiss
- Success: Green, 3 second auto-dismiss
- Info: Blue, 3 second auto-dismiss

## Modal Patterns

### Settings Modal
- **Location**: Triggered via gear icon in profile footer
- **Style**: Full-screen centered with blur backdrop
- **Tabs**: Account, Security, Notifications
- **Behavior**: Close on backdrop click or X button

### Notifications Modal
- **Location**: Triggered via bell icon in profile footer
- **Unread Badge**: Shows count on bell icon
- **Inline Expansion**: Click to expand, click to collapse
- **Actions**: Mark as read, Archive, Mark all as read

## Color Scheme

### Status Colors
- **Success/Verified**: Emerald (#10b981)
- **Warning/Pending**: Yellow (#eab308)
- **Error/Failed**: Red (#ef4444)
- **Info**: Blue (#3b82f6)
- **Neutral/Disabled**: Zinc (#71717a)

### Backgrounds
- **Base**: #050505
- **Surface**: #0b0b0f
- **Card**: rgba(255, 255, 255, 0.02)
- **Hover**: rgba(255, 255, 255, 0.04)

## Responsive Breakpoints
- **sm**: 640px (2-column layouts)
- **lg**: 1024px (3-column layouts)
- **xl**: 1280px (4-column layouts)

## CSS Classes

### Typography
- `.text-micro`: Font-size 12px for tables
- `.btn-dense`: 6px 12px padding buttons
- `.form-field`: Compact form field spacing

### Layout
- `.card-dense`: Standard card styling
- `.scrollbar-hide`: Hide scrollbars
- `.rounded-dense`: 8px border radius
- `.gap-dense`: 8px gap
- `.gap-dense-lg`: 12px gap

## Implementation Checklist for Each Module

- [ ] Header with plan badge (if applicable)
- [ ] KPI stat cards grid (if applicable)
- [ ] High-density data table (if applicable)
- [ ] Actions use compact button styling
- [ ] Modals use blur backdrop pattern
- [ ] Toast notifications integrated
- [ ] Network monitor in layout
- [ ] Responsive grid layout
- [ ] Micro-typography in data tables
- [ ] Proper status color coding

## Common Mistakes to Avoid

1. **Large padding/margins**: Use dense spacing (8px-12px)
2. **Oversized headings**: Keep headers at 15-16px max
3. **Cluttered cards**: Consolidate information
4. **Slow modals**: Use blur backdrop, not full-page overlays
5. **Missing status colors**: Always indicate status visually
6. **Slow toast animation**: Keep transitions under 300ms
7. **Inconsistent borders**: Use white/10 consistently
8. **Over-wide tables**: Keep max-width constraint
9. **Poor table row height**: Enforce h-9 (36px) for data rows
10. **Forgetting scrollbar-hide**: Hide scrollbars in sidebars

## Testing Guidelines

### Visual Density Check
- [ ] No excessive whitespace in cards
- [ ] Typography follows size rules
- [ ] Tables have compact row height
- [ ] Buttons have dense padding

### Functionality Check
- [ ] Toast appears in top-right corner
- [ ] Network error shows persistent red alert
- [ ] Settings modal opens from gear icon
- [ ] Notifications modal shows unread count
- [ ] All modals have blur backdrop
- [ ] Modals close on backdrop click

### Responsive Check
- [ ] Mobile: Single column layouts
- [ ] Tablet: 2-column layouts
- [ ] Desktop: 3-4 column layouts
- [ ] No horizontal scrolling on any viewport

## References

- CSS Variables: `app/globals.css`
- Card Components: `components/dashboard/card-components.tsx`
- Table Component: `components/dashboard/dense-table.tsx`
- Toast System: `components/ui/toast-context.tsx`
- Network Monitor: `components/network-monitor.tsx`
- Modals: `components/dashboard/settings-modal.tsx`, `notifications-modal.tsx`
