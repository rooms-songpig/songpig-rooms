# Handoff Summary – Song Pig A/B Testing Platform

**Last updated:** 2025-12-04 10:38 UTC (Julian: 2025-338 10:38)  
**Primary Domain:** `ab.songpig.com` (migrated from `rooms.songpig.com`)  
**Status:** Auth, environments, and admin tools are stable; feature work continues.

---

## 1. High-Level Overview

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack), React 19  
- **Backend:** Next.js API routes + Supabase (Postgres, Auth; Realtime planned)  
- **Storage:** Cloudflare R2 for audio  
- **Deployment:** Vercel (Node 20)
- **Core roles:**
  - `admin` – full control; includes a built-in **super admin** account (username `admin`)
  - `artist` – creates rooms, uploads songs, can also review
  - `listener` – “Reviewer” in the UI; joins rooms to vote and comment

**Branches and environments**

- `main` → Production at `https://ab.songpig.com`
- `staging` → Vercel preview/staging deployment from the `staging` branch
- Local dev → `http://localhost:3000`

High-level flow:

```text
Local Dev (http://localhost:3000)
    │
    ├── push feature branch → optional Vercel preview (per-branch URL)
    │
    ├── merge to `staging` → Vercel staging/preview environment
    │        (https://songpig-rooms-git-staging-*.vercel.app)
    │
    └── merge to `main` → Production
             (https://ab.songpig.com)
```

All three environments now share consistent Supabase and Google OAuth behavior.

---

## 2. Environments & External Configuration

### 2.1 Environment variables (local + Vercel)

Key vars (set in `.env.local` and Vercel → Project → Settings → Environment Variables):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xkholdgzgnhelzgkklwg.supabase.co
# IMPORTANT: use the legacy anon key (JWT starting with `eyJ...`), not `sb-publishable_...`
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...        # Legacy anon key
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Legacy service_role key (server-side only)

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # local
# On Vercel, NEXT_PUBLIC_APP_URL is set to:
# - https://ab.songpig.com for Production
# - the preview URL (or generic) for Preview/Deploys

# Cloudflare R2 (audio uploads)
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_R2_ACCESS_KEY_ID=...
CLOUDFLARE_R2_SECRET_ACCESS_KEY=...
CLOUDFLARE_R2_BUCKET_NAME=songpig-audio
CLOUDFLARE_R2_PUBLIC_URL=...
```

**Vercel notes**

- Supabase env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are defined at the **project level**, not overridden by empty/incorrect Preview-only values.
- Deployment Protection / Vercel Authentication must be **disabled or bypassed** for preview deployments so OAuth redirects can return to the app instead of a Vercel login wall.

### 2.2 Supabase Auth URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL (production):** `https://ab.songpig.com`
- **Additional redirect URLs:**
  - `http://localhost:3000/auth/callback`
  - `https://ab.songpig.com/auth/callback`
  - `https://<your-vercel-preview-domain>/auth/callback`  
    (you can also use a wildcard preview pattern if supported)

Auth provider callback remains:

- `https://xkholdgzgnhelzgkklwg.supabase.co/auth/v1/callback`

### 2.3 Google OAuth

In **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID**:

- **Authorized JavaScript origins:**
  - `http://localhost:3000`
  - `https://ab.songpig.com`
  - `https://<your-vercel-preview-domain>`

- **Authorized redirect URIs:**
  - `https://xkholdgzgnhelzgkklwg.supabase.co/auth/v1/callback`

Supabase is configured to use this Google client for the `google` provider.

---

## 3. Auth & Session Flows

### 3.1 Local session model

- Implemented in `app/lib/auth-helpers.ts`:
  - `getCurrentUser()` / `setCurrentUser()` store a normalized user object in `localStorage`.
  - `getAuthHeaders()` sets `x-user-id`, `x-user-role`, `x-user-name` for all API calls.
  - `logout()` clears local storage and broadcasts an auth change event.
- This local session is the source of truth for the UI (dashboard, admin, rooms, profile).
- Supabase Auth tokens (via `supabaseBrowser`) are used only for Supabase Auth / OAuth.

### 3.2 Email/password login (`/login`)

- UI: `app/login/page.tsx`
- API: `app/api/auth/login/route.ts`
  - Verifies `username` + `password` via `userStore.authenticate`.
  - Returns user without `passwordHash`.
- On success, client:
  - Calls `setCurrentUser(user)` and redirects:
    - `admin` → `/admin`
    - others → `/dashboard`

### 3.3 Email/password registration (`/register`)

- UI: `app/register/page.tsx`
- API: `app/api/auth/register/route.ts`
- Register screen:
  - Requires `username`, `password`.
  - Optional email.
  - **Required account type**: Artist or Reviewer (radio buttons).
- Behavior:
  - New user is created in `users` table with role `artist` or `listener`.
  - On success:
    - `setCurrentUser(userData)`.
    - Redirect to `/dashboard?welcome=artist|reviewer`.

### 3.4 Google OAuth – login & role-aware signup

#### Initiation

- **Login page (`/login`)**:
  - `supabaseBrowser.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback` } })`
  - No explicit role; `/api/auth/sync` defaults new users to `listener` (Reviewer).

- **Register page (`/register`)**:
  - User must choose account type first:
    - The Google button label updates to:
      - `Sign up with Google as Artist` or
      - `Sign up with Google as Reviewer`
  - Attempting Google signup without choosing a role shows a clear error.
  - When clicked, it calls:
    - `supabaseBrowser.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback?signupRole=${role}`, ... } })`

#### OAuth callback (`/auth/callback`)

- UI: `app/auth/callback/page.tsx` (client component, wrapped in `<Suspense>`).
- Responsibilities:
  1. Read tokens from URL hash; call `supabaseBrowser.auth.setSession(...)`.
  2. Fallback to `supabaseBrowser.auth.getSession()` if needed.
  3. If session has a user:
     - Call `/api/auth/sync` with:
       - `supabaseUserId`, `email`, `name`, `avatarUrl`, `role: signupRole?`.
     - Store returned app user via `setCurrentUser`.
     - Redirect:
       - `admin` → `/admin`
       - `artist` → `/dashboard?welcome=artist`
       - `listener` → `/dashboard?welcome=reviewer`
  4. On errors:
     - Show a short message and redirect back to `/login?error=auth_failed` (or similar).

#### Auth sync (`/api/auth/sync`)

- File: `app/api/auth/sync/route.ts`
- Input:

```ts
{
  supabaseUserId: string;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  role?: 'artist' | 'listener' | string | null; // from signupRole when present
}
```

- Behavior:
  - **Existing user (by `auth_id`):**
    - If `status === 'disabled'` → **403 "Account disabled"** (hard ban; cannot log in, including via Google).
    - If `status === 'deleted'`:
      - Treat this as a **fresh signup**:
        - Set `status = 'active'`.
        - Set `role` based on requested `role`:
          - `artist` or `listener` if provided.
          - If previous role was artist/listener, may reuse that.
        - **Never** restore `admin` automatically for deleted accounts.
      - Updates avatar/email fields as needed.
    - Normal path (non-deleted, non-disabled):
      - Optionally upgrade `listener` → `artist` if `role === 'artist'`.
      - Keep admins as admins unless explicitly changed by super admin.
  - **New user (no `auth_id` match):**
    - Derive username from email or name.
    - Default role to:
      - `artist` or `listener` if provided.
      - Otherwise `listener`.
    - Insert into `users` with sensible storage defaults.

The endpoint always returns the normalized app user object (without password hash) used by `setCurrentUser`.

---

## 4. User Status & Admin Rules

### 4.1 Status semantics

User records in `users` have a `status` field:

- `active` – normal, allowed to log in and use features based on role.
- `disabled` – **banned**:
  - Email/password auth fails.
  - Google/OAuth auth is blocked by `/api/auth/sync` with `403 Account disabled`.
  - Only an admin (ideally super admin) can set status back to `active`.
- `deleted` – soft delete:
  - Hidden from the main admin users list.
  - If the same Google account signs up again later:
    - `/api/auth/sync` reactivates the record as `active`.
    - Sets role based on the **new** selection (Artist/Reviewer).
    - Does **not** restore any previous admin role.

This matches a common industry pattern:

- **Disabled = banned** (locked until admin re-enables).  
- **Deleted = “fired” but allowed to return later as a normal user.**

### 4.2 Super admin vs normal admin

- The built-in `admin` user (username `admin`, role `admin`) is treated as **super admin**.
- Only this account can:
  - Change the role or status of other admin accounts.
  - Demote admins to artist/reviewer or mark them deleted/disabled.
- Enforcement:
  - **Server-side:** `app/api/users/[id]/route.ts` checks:
    - Prevents non-super-admins from modifying admin accounts.
    - Protects the super admin account from being changed or deleted.
  - **UI-side:** `app/admin/page.tsx`:
    - Shows the `admin` row as `super_admin` in orange and disables its Edit button.
    - Allows Edit for other admins only when logged in as `admin`.

---

## 5. Admin UI & Debug Tools

### 5.1 Admin dashboard (`/admin`)

- File: `app/admin/page.tsx`
- Visible only to logged-in users with role `admin`.
- Includes:
  - Summary stats (users, rooms, songs, comments).
  - **All Users** table:
    - Columns: username, email, role, status, created/last_login, etc.
    - Edit controls for role/status:
      - Regular admins cannot modify admin accounts.
      - Super admin can edit other admins; cannot modify its own `admin` row.
  - **Rooms overview** for high-level room stats.

### 5.2 Raw Users (Supabase) – Excel-style debug view

- Endpoint: `app/api/users/debug/route.ts`
  - GET `/api/users/debug` – admin-only.
  - Verifies the caller is an active admin via `userStore.getUser`.
  - Returns raw `users` table rows, ordered by `created_at DESC`.
- UI:
  - Collapsible panel in `/admin` labeled “Debug: Raw Users (Supabase)”.
  - Wide, scrollable table that mirrors the underlying Supabase data:
    - `id`, `username`, `email`, `auth_id`, `role`, `status`,
      `created_at`, `last_login`, storage-related fields, etc.
  - Client-side text filter (search by username/email).
  - “Download CSV” button to export the current dataset for Excel.

### 5.3 Raw Rooms (Supabase) – Excel-style debug view

- Endpoint: `app/api/rooms/debug/route.ts`
  - GET `/api/rooms/debug` – admin-only.
  - Verifies the caller is an active admin.
  - Returns raw `rooms` rows, ordered by `created_at DESC`.
- UI:
  - Collapsible “Debug: Raw Rooms (Supabase)” panel in `/admin`.
  - Columns include: `id`, `name`, `status`, `artist_id`, `invite_code`,
    `created_at`, `last_accessed`, and other room metadata.
  - Client-side text filter on room name/invite code.
  - CSV export button for opening in Excel.

These tools are intended for **debugging and verification**, especially for:

- Confirming Google-created users are present with correct `auth_id`, `email`, and `role`.
- Confirming rooms are correctly linked to artists via `artist_id`.

---

## 6. Key Files & Modules (Current)

- **Auth & session**
  - `app/lib/auth-helpers.ts` – localStorage user session, auth headers, logout.
  - `app/lib/supabase-browser.ts` – browser Supabase client with auth.
  - `app/lib/supabase-server.ts` – server-side Supabase client using service_role key.
  - `app/api/auth/login/route.ts` – username/password login.
  - `app/api/auth/register/route.ts` – username/password registration.
  - `app/auth/callback/page.tsx` – OAuth callback handler UI.
  - `app/api/auth/sync/route.ts` – Supabase Auth ↔ app `users` sync logic.

- **Users & admin**
  - `app/lib/users.ts` – userStore; handles fetching/updating users with roles/status.
  - `app/api/users/[id]/route.ts` – single-user fetch/update, enforces super-admin rules.
  - `app/api/users/debug/route.ts` – raw users debug endpoint.
  - `app/admin/page.tsx` – admin dashboard + debug grids.

- **Rooms & data**
  - `app/api/rooms/*` – rooms CRUD, songs, win-rates, comments, etc.
  - `app/api/rooms/debug/route.ts` – raw rooms debug endpoint.

- **UI**
  - `app/page.tsx` – public marketing/landing page.
  - `app/dashboard/page.tsx` – authenticated dashboard for artists/reviewers.
  - `app/login/page.tsx` – login screen with Google button.
  - `app/register/page.tsx` – registration with role choice + Google signup.
  - `app/room/[id]/page.tsx` – listening room experience (comparisons, voting, comments).
  - `app/profile/page.tsx` – profile screen (avatar upload UI present; API incomplete).
  - `app/components/UserProfile.tsx` – sticky header with username/role; shows SUPER ADMIN styling for `admin`.

---

## 7. Remaining Work / Open Items

1. **Realtime comments implementation**
   - Recreate `app/lib/realtime.ts` for Supabase Realtime subscriptions.
   - Wire it into `app/room/[id]/page.tsx` to:
     - Subscribe to new comments.
     - Show the floating “new comments” notification bar.
   - Ensure Supabase Realtime is enabled for relevant tables.

2. **Avatar upload API**
   - Implement `app/api/users/avatar/route.ts` to:
     - Accept avatar file metadata / upload token.
     - Store avatars (Supabase Storage or R2), update `users.avatar_url`.
     - Handle deletion / replacement of existing avatars.
   - Confirm bucket and security rules are correct.

3. **Hydration warning for FeedbackButton**
   - Fix React hydration warning by ensuring any `window`/`localStorage` or auth-dependent logic runs in `useEffect` only.
   - Avoid reading browser-only state during SSR.

4. **Additional admin UX polish**
   - Enhance sorting/filtering in the debug grids (e.g., sort by `role`, `status`, `created_at`).
   - Consider adding an explicit “is_super_admin” indicator column in Raw Users for clarity.

5. **Copy / branding**
   - Continue auditing copy for consistent “Song Pig A/B testing” branding.
   - Ensure role labels (Reviewer vs listener) are consistent across landing page, about page, dashboard, and admin.

---

## 8. Quick Start for a New Chat / Handoff

You can paste the block below into a new Cursor chat to bootstrap context:

```text
I'm working on Song Pig – a music A/B testing platform where artists run private listening rooms and reviewers vote on song versions.

Current state (Dec 2025):
- Production is at https://ab.songpig.com (migrated from rooms.songpig.com).
- Environments (local, staging, prod) all share consistent Supabase + Google OAuth config.
- Email/password auth and Google OAuth (including role-aware signup on /register) are working.
- User status semantics:
  - active = normal
  - disabled = banned (blocked even via Google)
  - deleted = soft-deleted; on next Google signup they come back as artist/reviewer, never auto-admin.
- There is a super admin account (username 'admin') that can promote/demote other admins.
- The /admin page includes Excel-style debug grids for raw users and rooms, with CSV export.

Key files:
- app/auth/callback/page.tsx – OAuth callback handler.
- app/api/auth/sync/route.ts – Supabase Auth ↔ app users sync logic.
- app/lib/auth-helpers.ts and app/lib/supabase-browser.ts – session + browser Supabase client.
- app/admin/page.tsx – admin dashboard, including Raw Users/Rooms debug panels.
- app/api/users/debug/route.ts and app/api/rooms/debug/route.ts – raw Supabase debug endpoints.
- HANDOFF_SUMMARY.md – high-level architecture and environment notes.

Immediate next steps:
1. Implement app/lib/realtime.ts and hook up realtime comments in app/room/[id]/page.tsx.
2. Implement app/api/users/avatar/route.ts to back the existing avatar upload UI.
3. Fix the hydration warning for the FeedbackButton.
4. Optionally refine the admin debug grids (sorting, more filters) and continue copy/branding polish.
```
## 7. Remaining Work / Open Items

1. **Realtime comments implementation**
   - Recreate `app/lib/realtime.ts` for Supabase Realtime subscriptions.
   - Wire it into `app/room/[id]/page.tsx` to:
     - Subscribe to new comments.
     - Show the floating “new comments” notification bar.
   - Ensure Supabase Realtime is enabled for relevant tables.

2. **Avatar upload API**
   - Implement `app/api/users/avatar/route.ts` to:
     - Accept avatar file metadata / upload token.
     - Store avatars (Supabase Storage or R2), update `users.avatar_url`.
     - Handle deletion / replacement of existing avatars.
   - Confirm bucket and security rules are correct.

3. **Hydration warning for FeedbackButton**
   - Fix React hydration warning by ensuring any `window`/`localStorage` or auth-dependent logic runs in `useEffect` only.
   - Avoid reading browser-only state during SSR.

4. **Additional admin UX polish**
   - Enhance sorting/filtering in the debug grids (e.g., sort by `role`, `status`, `created_at`).
   - Consider adding an explicit “is_super_admin” indicator column in Raw Users for clarity.

5. **Copy / branding**
   - Continue auditing copy for consistent “Song Pig A/B testing” branding.
   - Ensure role labels (Reviewer vs listener) are consistent across landing page, about page, dashboard, and admin.

---

## 8. Backlog (from ROADMAP_STATUS.md)

These items are not in the immediate “Remaining Work” list but are captured in the broader roadmap for future iterations.

### 8.1 Storage & Admin Tools

- **Storage upgrade request admin UI**: Build an admin screen to view and manage requests hitting `/api/support/storage-upgrade`.
- **Automatic storage tracking**: Update `storage_used_bytes` automatically when songs are uploaded/deleted.
- **Byte-based storage quota enforcement**: Enforce `storage_limit_bytes` at the byte level, not just by song count.
- **Admin UI for per-artist storage limits (MB)**: Allow admins to adjust storage caps per artist from the dashboard.
- **Admin UI for total platform storage**: High-level dashboard showing total storage used across the platform.
- **Admin UI for song play counts**: Track and expose per-song playback counts.
- **Global safety switch**: Support `CLOUDFLARE_UPLOADS_ENABLED` (or similar) to globally disable uploads in emergencies.

### 8.2 User-Facing Enhancements

- **Reviewer points + leaderboard system**: Gamify high-quality feedback and engagement for listeners and guest artists.
- **Room name format refinement**: Change from `"Room Name - Artist Name"` to `"Room Name by Artist Name"` where appropriate.
- **Exact-location comments**: Allow comments pinned to specific timestamps in songs (timeline/heat-map view).
- **Artist responses / messaging**: Let artists reply to comments and/or message reviewers in a lightweight thread or inbox.
- **Richer Terms page content**: Expand `/terms` with full legal copy for accounts, uploads, and privacy, beyond the current basic text.

### 8.3 Technical Debt & Infrastructure

- **Profanity / moderation filter**: Add automated filtering and/or flagging for inappropriate comment content.
- **Email notifications**: Notify users of key events (new comments, room invites, feedback summaries, storage warnings).
- **Room access improvements**: Refine private room handling, invited artists, and access rules around invite codes.
- **Automated changelog & revision tracking**: Add a simple process (or tooling) to keep the changelog and version history up to date.

---

## 9. Quick Start for a New Chat / Handoff

You can paste the block below into a new Cursor chat to bootstrap context:

I'm working on Song Pig – a music A/B testing platform where artists run private listening rooms and reviewers vote on song versions.

Current state (Dec 2025):
- Production is at https://ab.songpig.com (migrated from rooms.songpig.com).
- Environments (local, staging, prod) all share consistent Supabase + Google OAuth config.
- Email/password auth and Google OAuth (including role-aware signup on /register) are working.
- User status semantics:
  - active = normal
  - disabled = banned (blocked even via Google)
  - deleted = soft-deleted; on next Google signup they come back as artist/reviewer, never auto-admin.
- There is a super admin account (username 'admin') that can promote/demote other admins.
- The /admin page includes Excel-style debug grids for raw users and rooms, with CSV export.

Key files:
- app/auth/callback/page.tsx – OAuth callback handler.
- app/api/auth/sync/route.ts – Supabase Auth ↔ app users sync logic.
- app/lib/auth-helpers.ts and app/lib/supabase-browser.ts – session + browser Supabase client.
- app/admin/page.tsx – admin dashboard, including Raw Users/Rooms debug panels.
- app/api/users/debug/route.ts and app/api/rooms/debug/route.ts – raw Supabase debug endpoints.
- HANDOFF_SUMMARY.md – high-level architecture and environment notes.

Immediate next steps:
1. Implement app/lib/realtime.ts and hook up realtime comments in app/room/[id]/page.tsx.
2. Implement app/api/users/avatar/route.ts to back the existing avatar upload UI.
3. Fix the hydration warning for the FeedbackButton.
4. Optionally refine the admin debug grids (sorting, more filters) and continue copy/branding polish.---

This document is intended to be the authoritative snapshot for how auth, admin, and environments are wired up as of the timestamp above. When making significant changes, update the **Last updated** line and briefly adjust the relevant sections. 
---

This document is intended to be the authoritative snapshot for how auth, admin, and environments are wired up as of the timestamp above. When making significant changes, update the **Last updated** line and briefly adjust the relevant sections. 


