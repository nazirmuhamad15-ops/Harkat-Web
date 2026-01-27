# Implementation Plan - Comprehensive UI Overhaul (User Request)

## Goal
Implement and verify the full suite of Shadcn UI components requested by the user. Ensure each component is utilized effectively within the Admin and Driver applications to create a consistent, premium experience.
*Verified against latest Shadcn UI documentation via Context7.*

## User Review Required
- **Date Picker**: Authenticated standard Shadcn `DatePickerWithRange` implementation using `react-day-picker` and `Popover`.
- **Button Group**: Confirmed `ToggleGroup` is the correct accessible primitive for button groups in Shadcn/Radix ecosystem.
- **Native Select**: We will ensure the standard `Select` is used, but can fallback to native `<select>` styled with `Input` classes where necessary for mobile (Context7 recommendation).

## Proposed Changes

### 1. Component Verification & Creation
We will verify `src/components/ui` for the following. If missing, we will create them using standard Shadcn patterns (verified via Context7).
- `date-picker.tsx` (Component wrapping `Calendar` + `Popover` with `date-fns`)
- `data-table.tsx` (Generic wrapper for `@tanstack/react-table` with sorting, filtering, and pagination)
- `alert-dialog.tsx`, `slider.tsx`, `switch.tsx`, `tabs.tsx`, `toggle-group.tsx`, `toast.tsx`
- `pagination.tsx` (Verify existence)
- `chart.tsx` (New Shadcn Charts using `recharts` and `ChartContainer`)

### 2. Integration Points

#### Admin Dashboard (`src/app/(admin)/admin/dashboard`)
- **Date Picker**: Replace current custom picker with Shadcn `Calendar` + `Popover`.
- **Card**: Already used, will verify consistency.
- **Charts**: Migrate to Shadcn `Chart`.

#### Admin Catalog (`src/app/(admin)/admin/catalog`)
- **Data Table**: Implement sorting, filtering, and pagination for Products list.
- **Dropdown Menu**: Use for "Row Actions" (Edit/Delete).
- **Alert Dialog**: Use for "Delete Confirmation".
- **Badge**: Use for Stock Status (In Stock / Low Stock).
- **Select**: Use for Filtering by Category.

#### Admin Settings (`src/app/(admin)/admin/system/settings`)
- **Switch**: Use for toggling features (e.g., "Maintenance Mode").
- **Tabs**: Organize settings into sections (General, Email, Fleet).
- **Input**: Standardize form inputs.
- **Button**: Standardize usage (Primary vs Outline).

#### Driver App
- **Collapsible**: Use for Task Details.
- **Slider**: (If applicable, e.g., for some setting, otherwise verify if needed).
- **Sheet**: Mobile Sidebar (already planned).

### 3. Global Features
- **Toaster**: Ensure `Toaster` is placed in `layout.tsx` for global notifications.
- **Command Palette**: Implement global search.

## Verification Plan
1.  **Component Audit**: Run a script or check to confirm all files exist in `src/components/ui`.
2.  **Interactive Test**:
    - Open Admin Products: Check Table, Filters, Pagination.
    - Open Dashboard: Check Date Picker logic.
    - Trigger Alert: Ensure Dialog appears.
