# 📒 Daily Expenses / Shop Ledger Mobile App

> A digital **Bahi-Khata (Shop Ledger)** mobile application crafted for small business owners and shopkeepers. Features an authentic warm ruled-paper aesthetic, secure **Supabase Authentication**, and PostgreSQL database with **Row Level Security (RLS)**.

---

## 📱 Project Overview

The **Daily Expenses / Shop Ledger App** is built with **React Native**, **Expo SDK 57**, and **TypeScript**, connected directly to **Supabase** backend services (Auth + PostgreSQL + Storage). It eliminates the need for an intermediate Node.js/Express.js server, delivering real-time performance, client-side encryption, and strict data isolation per shop.

---

## 🎨 Design Philosophy & Visual Aesthetic

- **Warm Shop Ledger Aesthetic**: Mimics traditional Indian *Bahi-Khata* accounts notebooks with creamy parchment/kraft paper backgrounds (`#FAF5EB` / `#FDFBF7`) and authentic faint ruled ledger lines (`#E2D5BE`).
- **Torn Paper Effect**: The "Today's Entry" card features a custom mathematical SVG-less zigzag perforated edge reminiscent of physical cash register receipts and torn notebook sheets.
- **Shopkeeper Financial Palette**:
  - **Income / Collection**: Deep Emerald Green (`#2E7D32`) with `+₹` prefixes.
  - **Expenses**: Bold Terracotta Red (`#C84B31` / `#D32F2F`) with `-₹` prefixes.
  - **Net Cash-in-Hand**: High-contrast, warm dark brown badges (`#2D241E`).
- **Tactile Micro-Interactions**: Active press scaling, smooth animations, and clean field validation feedback.

---

## 🚀 Progress & Completed Phases

### ✅ Phase 1: Authentication — Login UI
- **Ruled Paper Background**: Global `LedgerBackground` component dynamically calculates screen height and renders subtle horizontal ledger lines.
- **Form Components**:
  - `Input`: Customized shop-ledger text input with floating-style labels, focused border highlights, and validation error messages.
  - `PasswordInput`: Reusable password input with show/hide password toggle eye icon.
  - `PrimaryButton`: High-contrast terracotta button with active press opacity and loading spinner indicator.
- **Responsive Layout**: Keyboard avoidance handling (`KeyboardAvoidingView`, `ScrollView`, `TouchableWithoutFeedback`) preventing inputs from being occluded on mobile devices.

### ✅ Phase 2: Onboarding — Registration UI & Client Validation
- **Multi-Field Registration**:
  - **Shop Name**: e.g., *"Gupta General Store"*
  - **Owner Name**: e.g., *"Ramesh Gupta"*
  - **Email Address**: Formatted email validation
  - **Mobile Number**: Numeric keypad with 10-digit Indian mobile validation
  - **Password & Confirm Password**: Minimum 6 characters with match checking
- **Navigation & Routing**: Built on `expo-router` with typed navigation links (`/` for Login, `/register` for Registration).

### ✅ Phase 3: Main Dashboard / Home Screen UI (`app/home.tsx`)
- **Dynamic Header**:
  - Displays registered **Shop Name** and **Owner Name**.
  - Current Date display formatted with day, date, and month (e.g., *"Fri, 05 Sep 2026"*).
  - Quick **Logout** action icon with confirmation prompt.
- **Today's Entry Card (`components/TodayEntryCard.tsx`)**:
  - Authentic receipt look with perforated zigzag torn-paper bottom edge.
  - Dual metrics: **Today's Collection** (Income) vs **Today's Expenses**.
  - Highlighted **Net Balance / Cash-in-Hand** calculation pill.
- **Monthly Summary Card (`components/MonthlySummaryCard.tsx`)**:
  - Current calendar month tracking.
  - Monthly Collection & Monthly Expense metrics.
  - Visual visual financial breakdown bar showing income-to-expense proportion.
- **Fixed Bottom Navigation (`components/BottomNavigation.tsx`)**:
  - 4 Tab destinations: **Home**, **Entries**, **Reports**, **Profile**.
  - Center floating terracotta `+` Floating Action Button (FAB) with custom curved cutout for rapid daily entry creation.

### ✅ Phase 4: Supabase Backend & Cloud Integration
- **Direct-to-Supabase Architecture**: Completely serverless frontend. No custom Express.js or Node.js server needed.
- **Supabase Authentication**:
  - Native Email & Password sign-up and sign-in via `@supabase/supabase-js`.
  - Persistent auth sessions backed by `@react-native-async-storage/async-storage`.
  - `react-native-url-polyfill` integration for standard browser URL compliance on native runtimes.
- **Centralized `AuthContext` (`context/AuthContext.tsx`)**:
  - Manages reactive `session`, `user`, `shop`, and `isLoading` states.
  - Automatic session restoration on app boot.
  - Subscribes to Supabase `onAuthStateChange` events for instant auth state propagation.
- **Route Protection (`app/_layout.tsx`)**:
  - Redirects unauthenticated visitors to the Login screen (`/`).
  - Redirects authenticated users directly to the Dashboard (`/home`).
  - Shows an authentic ledger loading screen while session is being verified.
- **PostgreSQL Database & Row Level Security (RLS)**:
  - Table: `public.shops` linked directly to `auth.users(id)` via Foreign Key with `ON DELETE CASCADE`.
  - Granular RLS policies ensuring that shopkeepers can strictly only view, insert, update, or delete their own shop data.
- **Shop Service (`services/shopService.ts`)**:
  - Clean abstracted queries with full TypeScript return types.
  - Automatically fetches or provisions shop profile upon login/registration.

### ✅ Phase 5: Daily Entry System & Add Entry Screen (`app/add-entry.tsx`)
- **Add Entry Screen**:
  - Screen modeled accurately after the approved reference design with warm ledger notebook aesthetics.
  - Native calendar date picker via `@react-native-community/datetimepicker` with web fallback.
  - Segmented `Working day` / `Holiday` toggle selector.
  - Required `Today's collection` currency input with `₹` prefix and non-negative validation.
  - Full-width `Home expense` input.
  - Card-based `Other expenses` system with `+ Add expense`, individual white cards featuring `Name` input (`e.g. Sugar`), trash delete button, `Amount` box with `₹` prefix, and `Category` dropdown selector (supporting `Business`, `Personal`, `Household`, `Staff`, `Transport`, `Utilities`, `Other`) with interactive selection modal.
  - Multiline `Notes` field with *"Optional"* caption.
  - Full-width deep emerald green `Save entry` button with loading state.
  - Automatic detection of existing entries for the selected date, populating fields for seamless updating.
- **Supabase Backend Schema & RLS**:
  - `public.daily_entries`: Stores daily entry financial metrics with `unique(shop_id, entry_date)` and `check >= 0`.
  - `public.other_expenses`: Normalized table storing dynamic individual expenses with `category` field linked to daily entries with `ON DELETE CASCADE`.
  - Strict Row Level Security policies (`auth.uid() = user_id`) on both tables.
  - Atomic PostgreSQL RPC `save_daily_entry`: Executes transactional upsert of daily entry and synchronized replacement of other expenses with zero risk of partial data states.
- **Home Dashboard Integration**:
  - Tapping "Add today's entry" or the floating `+` button navigates to `/add-entry`.
  - Uses real device local date for header and today card.
  - Reactive `useFocusEffect` auto-refreshes today's entry on return, showing recorded collection and expense metrics.
- **Phone Number Authentication**:
  - Direct 10-digit phone number registration and login (`phone@dailyexpenses.app` Supabase bridge).
  - Clean numeric keyboard input and validation.

### ✅ Phase 6: Entries History, Detail, Edit & Delete System
- **Home Dashboard Enhancements (`app/home.tsx`)**:
  - Displays today's recorded entry with 4-line financial breakdown (Collection, Business expense, Home expense, Profit) and *"View or edit this entry"* button.
  - Live monthly summary aggregation from Supabase (Collection, Expense, Profit, working days count, holiday count).
  - *"Recent entries"* section displaying the latest 5 entries with profit figures and a *"See all"* link navigating to `/entries`.
  - Focused auto-refresh (`useFocusEffect`) keeping home synchronized after entry modifications.
- **Entries History Screen (`app/entries.tsx`)**:
  - Month navigation bar (`← Month Year →`) querying Supabase using efficient date ranges (`>= startOfMonth AND < startOfNextMonth`).
  - Search bar (`Search notes...`) with real-time, case-insensitive note filtering.
  - List of `EntryListCard` items showing date, day of week, and profit/loss amounts.
  - Empty states for no monthly records and no matching search queries.
  - Native pull-to-refresh (`RefreshControl`).
  - Active Entries tab in fixed bottom navigation.
- **Entry Detail Screen (`app/entry/[id].tsx`)**:
  - Detailed financial breakdown card (Collection, Business expense, Other business expense, Home expense, Other home expense, Profit).
  - Categorized list of individual other expenses.
  - Optional notes section.
  - *"Edit"* button loading entry into `app/add-entry.tsx`.
  - *"Delete"* button with native confirmation dialog, cascading deletion of associated other expenses, and auto-refresh.
- **Edit & Collision Handling (`app/add-entry.tsx`)**:
  - Pre-populates all entry fields via `entryId` parameter.
  - Safe date collision detection preventing duplicate records for the same shop and date.
- **Centralized Financial Logic (`utils/entryCalculations.ts`)**:
  - Unified formulas and Indian number formatting (`formatCurrency`).


### ✅ Phase 7: Complete Reports Module & Data Export (`app/reports.tsx`)
- **Reports Screen & Reference Layout**:
  - Warm ledger header with Shop Name, Owner Name, and stylized "Reports" badge.
  - **Period Filter Tabs**: Segmented tabs for `Day`, `Week` (default), `Month`, and `Custom`.
  - **Sub-Period Selectors**:
    - Day tab: `This day` / `Previous day`.
    - Week tab: `This week` / `Last week` (Monday to Sunday calculation).
    - Month tab: `This month` / `Last month`.
    - Custom tab: Interactive start and end date pickers using `DatePickerModal`.
  - Half-open boundary date filtering: `entry_date >= startDate AND entry_date < nextDayAfterEnd`.
- **Financial Report Summary Card (`components/ReportSummaryCard.tsx`)**:
  - Total Collection (`+₹` in emerald green).
  - Business Expense (`-₹` in terracotta red).
  - Home Expense (`-₹` in amber).
  - Total Cash Outflow (`-₹`).
  - Net Business Profit (with positive green / negative red indicator).
  - Average Daily Collection.
  - Working days and holiday count badges.
- **Data Exporting (PDF & Excel)**:
  - **Download PDF**: Generates branded, styled HTML document via `expo-print`, saved locally, uploaded to Supabase Storage, recorded in `public.report_exports`, and opened in system share sheet (`expo-sharing`).
  - **Download Excel**: Creates multi-tab workbook (`Summary`, `Day-by-Day Entries`, `Expense Breakdown`) via `xlsx` and `expo-file-system/legacy`, uploaded to Supabase Storage, recorded in `public.report_exports`, and opened in system share sheet.
- **Categorized Expense Breakdown (`components/ExpenseBreakdownList.tsx`)**:
  - Aggregates and lists all `other_expenses` for the selected period with category badges.
  - Empty state with notebook icon when no expenses exist.
- **Day-by-Day Entry Cards**:
  - Chronological list of daily entries within the selected period.
  - Displays formatted date, day of week, and profit amount with chevron arrow.
  - Tapping any entry navigates directly to Entry Detail (`/entry/[id]`).
- **Supabase Backend Schema & Storage**:
  - `public.report_exports` audit table tracking all generated reports (format, report type, date range, storage path, file size).
  - Private Supabase Storage bucket `report-exports` with strict per-user RLS policies.
  - Migration script: `supabase/migrations/0004_reports.sql`.

### ✅ Phase 8: Profile / Account Page & Logout System (`app/profile.tsx`, `app/edit-profile.tsx`)
- **Bottom Navigation Overhaul (`components/BottomNavigation.tsx`)**:
  - Replaced legacy Logout tab with **Profile** (`Home | Entries | + | Reports | Profile`).
  - Active tab highlighting, styled `person-outline` icon, and dedicated navigation to `/profile`.
  - Floating center `+` button preserved, opening `/add-entry`.
- **Profile Screen (`app/profile.tsx`)**:
  - Warm shop ledger header with *"Profile - Manage your shop and account"*.
  - Owner avatar card with shop owner role badge.
  - **Shop Information Card**: Displays live `shop_name`, `owner_name`, `mobile`, and `email` from `public.shops`.
  - **Account Card**: Displays active account status badge, mobile number, and email (with *"Not added"* fallback).
  - **Edit Profile Action**: Full-width terracotta action button opening `/edit-profile`.
  - **Confirmed Logout Action**: Clean modal confirmation dialog prompting user before calling `supabase.auth.signOut()` and redirecting to Login (`/`).
  - Dedicated loading spinner and friendly error recovery states.
- **Edit Profile Screen (`app/edit-profile.tsx`)**:
  - Header with back navigation `←` returning to `/profile`.
  - Form inputs with real-time validation:
    - Shop name: required, non-empty.
    - Owner name: required, non-empty.
    - Mobile number: required, strictly 10 digits validation.
    - Email: optional, standard email format validation.
  - Submits updates directly to `public.shops` scoped by `auth.uid() = user_id`.
  - Disables button and displays *"Saving..."* during submission.
  - Seamlessly re-syncs updated shop name and owner greeting with Home dashboard via `useFocusEffect`.
- **Profile Service (`services/profileService.ts`)**:
  - Centralizes profile fetch and update queries with type-safe payloads.
  - Zero changes to existing phone-number authentication.
- **Route Guard Protection (`app/_layout.tsx`)**:
  - Enforces strict route guarding: all non-auth routes redirect unauthenticated users to `/`.

---

### ✅ System & Platform Upgrades: Expo SDK 57
- Upgraded the codebase to **Expo SDK 57** (`expo@57.0.20`, `react@19.2.3`, `react-native@0.86.3`) to ensure full compatibility with the latest Expo Go client.
- Fixed React Native 0.86+ styling deprecations (migrated `StyleSheet.absoluteFillObject` to explicit position coordinates in `LedgerBackground.tsx`).
- Enabled cross-platform web support via `react-native-web` and `react-dom`.
- Verified 100% type safety (`npx tsc --noEmit` passes with 0 errors) and Android production export (`npx expo export --platform android --no-bytecode` passes with 0 errors).

---

## 📂 Project Architecture

```
d:/Daily Expenses App/
├── app/                                 # Expo Router (File-based navigation)
│   ├── _layout.tsx                      # Root layout, AuthProvider & route protection guard
│   ├── index.tsx                        # Login Screen (Phase 1)
│   ├── register.tsx                     # Shop Registration Screen (Phase 2)
│   ├── home.tsx                         # Main Dashboard / Home Screen (Phase 3, 5, 6, 8)
│   ├── entries.tsx                      # Entries History Screen (Phase 6)
│   ├── reports.tsx                      # Reports & Analytics Screen (Phase 7)
│   ├── profile.tsx                      # Profile & Account Management Screen (Phase 8)
│   ├── edit-profile.tsx                 # Edit Shop Profile Screen (Phase 8)
│   ├── entry/
│   │   └── [id].tsx                     # Entry Detail Screen (Phase 6)
│   └── add-entry.tsx                    # Add / Edit Daily Entry Screen (Phase 5, 6)
├── components/                          # Reusable UI Components
│   ├── BottomNavigation.tsx             # Fixed tab bar with center floating '+' FAB
│   ├── DatePickerModal.tsx              # Cross-platform date picker (Android/iOS/Web)
│   ├── EntryListCard.tsx                # Day entry card with date and profit
│   ├── ExpenseBreakdownList.tsx         # Categorized expenses with badges
│   ├── Input.tsx                        # Themed text input with validation styling
│   ├── LedgerBackground.tsx             # Ruled notebook line background generator
│   ├── MonthlySummaryCard.tsx           # Monthly analytics & breakdown progress bar
│   ├── PasswordInput.tsx                # Secure password field with eye icon toggle
│   ├── PrimaryButton.tsx                # Terracotta action button with loading state
│   ├── ReportFilterTabs.tsx             # Segmented period tabs (Day, Week, Month, Custom)
│   ├── ReportPeriodSelector.tsx         # Sub-period selector and custom date inputs
│   ├── ReportSummaryCard.tsx            # Comprehensive financial summary card
│   └── TodayEntryCard.tsx               # Torn-paper receipt card with live entry state
├── constants/
│   └── colors.ts                        # Master theme design tokens & financial colors
├── context/
│   └── AuthContext.tsx                  # Global Supabase authentication context & hooks
├── lib/
│   └── supabase.ts                      # Supabase client singleton with AsyncStorage
├── services/
│   ├── dailyEntryService.ts             # Supabase operations for daily entries & expenses
│   ├── profileService.ts                # Profile fetch & update operations for `public.shops`
│   ├── reportService.ts                 # Report aggregation, PDF/Excel generation & export tracking
│   └── shopService.ts                   # Supabase DB operations for `public.shops`
├── supabase/
│   └── migrations/
│       ├── 0001_create_shops.sql        # Phase 4: shops table & RLS
│       ├── 0002_daily_entry_system.sql  # Phase 5: daily_entries, other_expenses, RPC
│       ├── 0003_category_support.sql    # Phase 5: other_expenses category support
│       └── 0004_reports.sql             # Phase 7: report_exports table, storage bucket & RLS
├── types/
│   ├── database.types.ts                # TypeScript definitions for Supabase tables
│   ├── dailyEntry.ts                    # Daily entry & other expenses models
│   ├── report.ts                        # Report period, summary, day entry & export types
│   └── shop.ts                          # Shop model and registration form types
├── utils/
│   ├── entryCalculations.ts             # Financial calculations & currency formatting
│   └── reportCalculations.ts            # Date range builders & report summary aggregations
├── .env.example                         # Environment variables template
├── app.json                             # Expo application configuration
├── package.json                         # Dependencies and npm run scripts
└── tsconfig.json                        # TypeScript strict compiler configuration
```

---

## 🗄️ Database Schema & Security

The application uses PostgreSQL hosted on **Supabase** with strict **Row Level Security (RLS)**:

```sql
-- public.shops table definition
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  shop_name text not null,
  owner_name text not null,
  email text,
  mobile text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- public.daily_entries table (Phase 5)
create table public.daily_entries (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  day_type text not null default 'working' check (day_type in ('working', 'holiday')),
  collection numeric(12,2) not null default 0 check (collection >= 0),
  milk_expense numeric(12,2) not null default 0 check (milk_expense >= 0),
  vimal_expense numeric(12,2) not null default 0 check (vimal_expense >= 0),
  home_expense numeric(12,2) not null default 0 check (home_expense >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_entries_shop_date_key unique (shop_id, entry_date)
);

-- public.other_expenses table (Phase 5)
create table public.other_expenses (
  id uuid primary key default gen_random_uuid(),
  daily_entry_id uuid not null references public.daily_entries(id) on delete cascade,
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  expense_name text not null check (length(trim(expense_name)) > 0),
  amount numeric(12,2) not null default 0 check (amount >= 0),
  category text not null default 'Business',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- public.report_exports table (Phase 7)
create table public.report_exports (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  export_format text not null check (export_format in ('pdf', 'excel')),
  report_type text not null,
  start_date date not null,
  end_date date not null,
  storage_path text,
  file_name text not null,
  file_size_bytes bigint,
  created_at timestamptz not null default now()
);
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20 LTS recommended)
- [Expo Go app](https://expo.dev/go) installed on your Android device or iPhone
- A [Supabase](https://supabase.com) account and project

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/MdSaifAli063/Daily-Expenses-Mobile-App.git
cd "Daily Expenses App"

# Install dependencies (use --legacy-peer-deps for React 19 compatibility)
npm install --legacy-peer-deps
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

### 4. Run the Database Migrations
1. Log in to the [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project and navigate to the **SQL Editor** tab.
3. Run the migrations in sequential order:
   - `supabase/migrations/0001_create_shops.sql`
   - `supabase/migrations/0002_daily_entry_system.sql`
   - `supabase/migrations/0003_category_support.sql`
   - `supabase/migrations/0004_reports.sql`
4. Verify that all tables, RLS policies, and the `report-exports` storage bucket are created.

---

## 🏃 Running the Application

Start the Expo development server with cache cleared:
```bash
npx expo start -c
```

- **Run on Android / iOS (Expo Go)**:
  - Scan the terminal QR code using the **Expo Go** app on your physical mobile device.
  - Both your computer and mobile phone must be connected to the same Wi-Fi network.
- **Run in Web Browser**:
  - Press `w` in the terminal or run `npm run web`.

