🧩 HANDOFF_SONGPIG_MVP.md — SECTION 1/6

Paste this into your file’s beginning:

# SongPig MVP Handoff Document  
**Version:** 1.0  
**Last Updated:** 2025-12-05  
**Author:** System Architecture & Product AI  
**Purpose:** Technical + product handoff for building the SongPig MVP  

---

# 📑 Table of Contents
1. Overview  
2. System Architecture  
   - 2.1 Frontend Architecture  
   - 2.2 Backend Architecture  
   - 2.3 Database Overview  
   - 2.4 Storage Overview (Audio / Images)  
   - 2.5 Environment Structure (Local / Staging / Prod)  
3. Roles & Permissions  
   - 3.1 Admin  
   - 3.2 Artist  
   - 3.3 Reviewer  
   - 3.4 Super Admin Safeguards  
4. Core MVP Feature Set  
   - 4.1 Room Creation  
   - 4.2 A/B Audio Player Logic  
   - 4.3 Required Comment + Listen Threshold  
   - 4.4 Timecoded Commenting  
   - 4.5 Guided Feedback Question (Artist Prompt)  
   - 4.6 Artist Default Settings  
   - 4.7 Always-Available Rooms  
5. Room Access Modes  
6. Reviewer Experience  
7. Artist Dashboard  
8. Sharing, OG Metadata & Virality Hooks  
9. Tip Jar / Support Mechanism  
10. Security & Abuse Prevention  
11. File & Folder Structure (Recommended)  
12. Future-Proofing Notes  
13. ASCII Diagrams (Flows)

---

# 1. 🎵 Overview

SongPig is a **private A/B music comparison platform** designed for:

- **Artists**  
  To test multiple versions of their songs with real listeners and get focused, high-quality feedback.

- **Reviewers**  
  To listen, compare, vote, and comment — while building a reputation profile over time.

The MVP’s objective:

> Deliver a *simple, clean, frictionless* experience that forces high-quality feedback, prevents spam/low-effort reviews, and gives artists actionable insights.

Core principles:

- Clear separation of **Artist** and **Reviewer** roles  
- Minimal interface complexity  
- Required comments (no vote without feedback)  
- Listen-percentage gating  
- Timecoded commenting support  
- Artist-defined guidance (“What feedback do you want?”)  
- Artist default settings to reduce cognitive load  
- Viral-friendly sharing with OG cards  
- Private-by-default rooms with flexible access controls  

---

# 2. 🏗 System Architecture

SongPig uses a lightweight, modern, scalable stack:

- **Frontend:** Next.js 16, React 19, App Router, TypeScript  
- **Backend:** Next.js API Routes + Supabase (Postgres, Auth, Realtime)  
- **Auth Providers:** Email/Password + Google OAuth  
- **Audio Storage:** Cloudflare R2  
- **Deployment:** Vercel (Node 20)  
- **Sessions:** LocalStorage + Supabase session sync  
- **State Updates:** React Server Components + Client hydration where needed

---

## 2.1 Frontend Architecture

- App Router pages reside under `/app`  
- Public pages:  
  - `/` (Landing)  
  - `/login`  
  - `/register`  
- Protected pages:  
  - `/dashboard` (role-aware)  
  - `/room/[id]`  
  - `/admin`  
  - `/profile`  

Frontend responsibilities:

- Handle role-based UI  
- Display audio players  
- Display comments  
- Implement listen-percentage tracking  
- Ensure vote gating  
- Show guided feedback prompt  
- Generate responsive OG metadata  

---

## 2.2 Backend Architecture

Backend exists entirely inside **Next.js API routes**, no standalone server.

API categories:

- `/api/auth/*` → login, register, sync  
- `/api/rooms/*` → create, update, fetch, submit votes, submit comments  
- `/api/users/*` → profile updates, avatar upload (future), admin controls  
- `/api/debug/*` → raw data debug endpoints (admin-only)

All backend logic validates:

- Auth headers  
- User role  
- Room permissions  
- Access mode  
- Comment requirements  
- Listen-percentage thresholds  

---

## 2.3 Database Overview (Supabase / Postgres)

Recommended core tables:

### **users**
| column | type | note |
|--------|-------|------|
| id | uuid | PK |
| auth_id | text | Supabase user ID |
| username | text | displayed name |
| email | text | optional |
| role | enum (admin, artist, reviewer) | user type |
| status | enum (active, disabled, deleted) | auth control |
| avatar_url | text | optional |
| created_at | timestamp |  |
| last_login | timestamp |  |

---

### **rooms**
| column | type | note |
|--------|-------|------|
| id | uuid | PK |
| artist_id | uuid | FK to users |
| name | text | room title |
| prompt | text | “What feedback are you looking for?” |
| access_mode | enum | see section 5 |
| version_a_url | text | R2 audio |
| version_b_url | text | R2 audio |
| created_at | timestamp |  |
| updated_at | timestamp |  |

---

### **votes**
| column | type |
|--------|-------|
| id | uuid |
| room_id | uuid |
| reviewer_id | uuid |
| winner | enum (A, B) |
| created_at | timestamp |

---

### **comments**
| column | type |
|--------|-------|
| id | uuid |
| room_id | uuid |
| reviewer_id | uuid |
| comment_text | text |
| created_at | timestamp |

---

### **listening_progress**
Tracks reviewer listen percentage per version.

| column | type |
|--------|-------|
| id | uuid |
| room_id | uuid |
| reviewer_id | uuid |
| version | enum (A, B) |
| max_position_seconds | float |
| duration_seconds | float |
| percentage | float |

---

## 2.4 Audio / Image Storage

All audio files should be stored in:



songpig-audio/{artistId}/{roomId}/A.wav
songpig-audio/{artistId}/{roomId}/B.wav


OG images may be static per room for now (later: dynamic generation).

---

## 2.5 Environment Structure

### Local


http://localhost:3000


### Staging

<vercel preview deployments> ```
Production
https://ab.songpig.com


Environment variables include:

Supabase URL + Keys

R2 storage keys

NEXT_PUBLIC_APP_URL

OAuth redirect URLs


---

### ✅ **When you're ready, say:  
**“Next section”**  

And I will deliver **Section 2/6** immediately.

This prevents chat overload and keeps everything clean and digestible.

Ready when you are.

You said:
next
ChatGPT said:

Perfect — continuing exactly where we left off.

Here is:

🧩 HANDOFF_SONGPIG_MVP.md — SECTION 2/6

Paste this directly after Section 1.

# 3. 👥 Roles & Permissions

SongPig has 3 core roles, tightly scoped to keep the system simple and maintainable.

---

## 3.1 Admin
Admins can:

- Access `/admin`
- View all users
- Edit roles (with restrictions)
- Disable or delete users
- Reactivate deleted users
- Review raw Supabase data
- Access debug endpoints

Admins **cannot**:
- Modify the super admin
- Modify themselves into a non-admin

---

## 3.2 Artist
Artists can:

- Create A/B rooms
- Upload Version A and Version B audio
- Set feedback question (“What feedback do you want?”)
- View comments, votes, analytics
- See reviewer profiles (limited)
- Share rooms
- Set access mode (private, artists-only, reviewers-only, score-gated, open )
- Edit their profile

Artists **cannot**:
- Access `/admin`
- Edit other users' profiles
- Override reviewer thresholds

---

## 3.3 Reviewer
Reviewers can:

- Join allowed rooms based on access mode
- Listen, compare, vote
- Must leave a comment before voting
- Must meet listen-percentage threshold
- Can share rooms (if allowed)
- Build trust score in Phase 2 roadmap

Reviewers **cannot**:
- Create rooms
- Access private rooms unless invited
- Edit or delete comments after posting (MVP)
- Access analytics

---

## 3.4 Super Admin (Hardcoded Account)
One account must be treated as **super admin**, usually:



username: admin
role: admin


Super admin can:

- Edit any admin
- Demote or delete admins
- Change roles of ANY user
- Access all data structures

System must **never** allow:

- Demotion of super admin
- Deletion of super admin
- Reassignment of super admin role

---

# 4. 🎯 Core MVP Feature Set

This defines exactly what is being built — nothing more, nothing less.

---

## 4.1 Room Creation (Artist)

Artists fill in:

- **Room Name**
- **Upload Version A**
- **Upload Version B**
- **Guided Feedback Prompt (optional)**  
  "What feedback are you looking for?"
- **Access Mode**  
  (see Section 5)
- **Artist Default Settings applied automatically**

After creation:
- Room redirects to `room/[id]`

---

## 4.2 A/B Audio Player Logic

The A/B player must:

- Immediately show “Version A” and “Version B”
- Allow switching  
- Track listen percentage separately for A and B
- Disable vote button until:
  - Artist-defined listen threshold is met  
    (default: 30–50%)
  - Reviewer writes a comment of minimum length (default: 20 chars)
- Delay any form of “preference bias”  
  (no waveforms, no metadata)

---

### 4.2.1 Listen Percentage Tracking

Track:
- `max_position_seconds`
- `duration_seconds`
- `percentage`

Validation rule:

```text
percentage_A >= threshold
AND
percentage_B >= threshold


If not met:

Block vote

Show message:
“Listen a little more before voting.”

4.3 Required Comment + Minimum Length

Reviewers must:

Type a comment

Minimum 20 characters (configurable)

Comment must contain meaningful text

If comment < 20 chars:

Block submission

Message:
“Please share a bit more detail to help the artist.”

This ensures high-quality feedback.

4.4 Timecoded Commenting

The system automatically detects timestamps in comment text:

Examples:

0:34

1:12

02:05

Regex:

\b([0-5]?[0-9]):([0-5][0-9])\b


Detected timestamps become clickable, triggering:

audioRef.current.seekTo(seconds)


Artist can then jump to relevant feedback moments.

4.5 Guided Feedback Question (Artist Prompt)

Artists can set a custom prompt, such as:

“Which chorus hits harder?”

“Is the vocal too loud during the hook?”

“Which intro grabs your attention more?”

This appears above the comments in the reviewer UI.

If artist does not set one:

A neutral default appears:

“Tell the artist what stood out to you in each version.”

4.6 Artist Default Settings

Artists may set:

Default listen-percentage threshold (30% / 40% / 50%)

Default access mode

Default minimum comment length

Pre-filled feedback prompt template

Room visibility defaults

These dramatically reduce artist effort.

4.7 Always-Available Rooms (“Starter Rooms”)

To ensure new reviewers always have something to do:

Platform includes starter rooms

These rooms:

Are owned by system account

Never run out

Give reviewers an instant place to learn the flow

Prevent empty dashboard feeling

Starter rooms DO NOT interfere with artist data.


---

# When you're ready, say:

### **“Next section”**

And I will deliver **SECTION 3/6**, covering **Access Modes, Reviewer Experience, and Artist Dashboard**.

You said:
section 3 now
ChatGPT said:

Here we go — continuing with the full handoff.

🧩 HANDOFF_SONGPIG_MVP.md — SECTION 3/6

Paste this immediately after Section 2.

# 5. 🔐 Room Access Modes

Artists can choose how each room is accessed.  
This controls who may enter, listen, vote, and leave feedback.

There are **five** MVP access modes:

---

## 5.1 Private Invite Only
Only users with a special invite code may enter.

Use cases:
- Early testing  
- Sensitive tracks  
- Small, hand-picked listening groups  

Behavior:
- Attempting to access without correct code → rejected with friendly message.

---

## 5.2 Artists Only
Only logged-in **artists** may review this room.

Use cases:
- Peer-to-peer feedback  
- Industry/pro-level feedback  
- Avoiding casual users  

---

## 5.3 Reviewers Only (Default for MVP)
Only logged-in **reviewers** may review this room.

Use cases:
- Artists who only want “fan-style” opinions  
- Avoid artist-to-artist bias  

---

## 5.4 Artists + Reviewers (Hybrid Open)
Anyone logged in may access the room.

Use cases:
- Broad exposure  
- Maximum participation  
- High engagement rooms  

---

## 5.5 Score-Gated Rooms (Future but Spec’d)
Locked behind:

- Reviewer Trust Score ≥ X  
- Reviewer Completed Reviews ≥ Y

This is **not** built in MVP, but the database is prepared for it.

This lets top reviewers become “elite reviewers” later.

---

# 6. 🎧 Reviewer Experience (MVP Deep Specification)

This is one of the core pillars of SongPig.

The reviewer journey must be:

- Simple  
- Fast  
- High-quality  
- Impossible to spam  
- Rewarding  

---

## 6.1 Reviewer Dashboard

Shows:

- “Rooms you can review”
- “Rooms you already reviewed”
- “Starter Rooms”
- Each card shows:
  - Room name  
  - Artist name  
  - Access mode indicator  
  - Whether review is pending or completed  

If no rooms available:
- Always show starter rooms.

---

## 6.2 Entering a Room

Inside `/room/[id]`, the reviewer sees:

1. **Room Title**
2. **Artist Name + Avatar**
3. **Artist Feedback Prompt** (“What feedback are you looking for?”)
4. **A/B Player**
5. **Comments Box**
6. **Vote Buttons**

UI flow:

- Reviewer listens to A and B  
- System tracks listen percentages  
- Vote buttons stay disabled  

---

## 6.3 Listen Percentage Gate

Default threshold: **35% for each version**

Example calculation:



max_position_seconds / duration_seconds >= threshold


If the reviewer tries to vote early:
- Display message:  
  > “Listen a little more before voting.”

This ensures quality.

---

## 6.4 Required Comment Gate

Vote button stays disabled until:

- Comment length ≥ 20 characters  
- (Later: spam detection / repetition detection)

Example message:
> “Please leave a detailed comment to help the artist.”

---

## 6.5 Entering a Comment

The comment box:

- Multi-line  
- Supports timecodes  
- Warning under the box until minimum length is met  
- Submit button is integrated with “vote” button  

---

## 6.6 Timecoded Comments

The reviewer's comment:

> “I love the part at 2:05 — the harmony is great. But around 0:47 the snare is too sharp.”

App behavior:

- Auto-detect timestamps  
- Turn them into clickable links  
- Clicking jumps audio to that timestamp  

This gives artists pinpoint feedback.

---

## 6.7 Voting

Voting flow:

- Reviewer selects A or B  
- The selection + comment is submitted together  
- Reviewer receives a confirmation:
  > “Thanks for your feedback! Your vote has been recorded.”

After voting:

- Room becomes “completed”  
- Reviewer cannot vote again  
- Reviewer can still read comments  
- Reviewer sees summary results (optional for MVP)

---

# 7. 🎤 Artist Dashboard

This is where artists manage everything:

- Create rooms  
- Edit rooms  
- See feedback  
- See votes  
- See summary insights  

---

## 7.1 Dashboard Layout

Tabs:

### **Rooms**
- List of rooms  
- Status: Active / Pending / Closed  
- Each room card shows:
  - Votes count  
  - Comments count  
  - Access mode icon  
  - Quick link to share  

### **Create Room**
Wizard-like flow:
1. Upload A  
2. Upload B  
3. Name room  
4. Optional feedback question  
5. Access mode  
6. Create  

### **My Profile**
- Change username  
- Avatar upload  
- Default settings  
- Tip jar link (Stripe, PayPal)  

---

## 7.2 Room Insights Page (Artist View)

Shows:

- Total votes  
- Prefer A: X%  
- Prefer B: Y%  
- Comment list with timecodes  
- “Most-mentioned timestamps” (Phase 2)  
- Reviewer list with trust score (Phase 2)  
- Share options  
- Room access mode  

---

# 8. 📣 Sharing, OG Metadata & Virality Hooks

This is essential for growth.

Sharing must be:

- Simple  
- Attractive  
- Deliberate  
- With visually appealing cards  

---

## 8.1 Social Sharing Buttons

Artists and reviewers see:

- Copy Link  
- Share to X (Twitter)  
- Share to Facebook  
- Share to Instagram Stories (via link)  
- Share to Messenger  

---

## 8.2 OG Metadata (Preview Cards)

When someone shares a room:

Platforms like X, Facebook, iMessage display a **preview card**.

We need:

- `og:title`
- `og:description`
- `og:image`
- `twitter:card`
- `twitter:image`

OG image should be:

**A static branded graphic with:**

- SongPig logo  
- Room title  
- “A/B Music Comparison Room”  
- Version A vs B graphic representation  

This is NOT dynamic generation yet.  
Static templating is enough for MVP.

---

## 8.3 Invite Links

Private rooms generate:



https://ab.songpig.com/room/[id]?invite=[token
]


Reviewers who click invite:

- Get redirected to login/register  
- Token is preserved  
- After login → sent back to the room  

Perfect for private feedback rounds.

---

# 9. 💰 Tip Jar / Support Mechanism (Optional in MVP)

Each artist may:

- Add PayPal link  
- Add Stripe link  
- Add “Buy Me a Coffee” link  

Displayed at bottom of room page:

> “Support this artist 🎵”

Does *not* interfere with A/B flow.

---

# 10. 🛡 Security & Abuse Prevention

### Enforce:
- Rate-limited endpoints  
- Anti-spam filtering (minimum comment length)  
- Captcha or hidden honeypots on register (if needed)  
- Role-based access control on API routes  
- Hard block disabled users  
- Prevent reviewers from seeing vote results before voting  

### Database Safety:
- Foreign keys enforced  
- Soft deletes for users  
- No restoring admin privileges automatically  

---

# 11. 📁 Recommended File & Folder Structure



/app
/admin
/api
/auth
/users
/rooms
/dashboard
/room/[id]
/profile
/login
/register

/lib
/auth-helpers.ts
/supabase-browser.ts
/supabase-server.ts
/audio-tracking.ts
/comment-utils.ts

/components
RoomCard.tsx
ABPlayer.tsx
CommentBox.tsx
TimecodeParser.tsx
AccessModeBadge.tsx

/public
/og-images


---

# 12. 🔮 Future-Proofing Notes (MVP Considerations)

- Rooms will scale with more versions (A/B/C)  
- Reviewer trust score system coming soon  
- Video A/B mode in future  
- Public discovery feed in later phases  
- Dynamic OG cards (server-rendered images) later  

---

# 13. 🔀 ASCII Flow Diagrams

## 13.1 Login Flow



User -> /login -> choose Google or Email
-> Supabase Auth
-> /auth/callback
-> /api/auth/sync
-> localStorage setCurrentUser()
-> redirect to /dashboard


---

## 13.2 A/B Voting Flow



Reviewer enters room
-> Play Version A (track progress)
-> Play Version B (track progress)
-> Comment >= 20 chars?
-> Listened >= threshold?
YES -> Enable Vote
NO -> Disable Vote

Vote -> Submit comment + selection
-> Save vote
-> Mark room as completed


---

## 13.3 Artist Room Creation Flow



Artist -> Create Room
-> Upload A
-> Upload B
-> Set title + prompt
-> Choose access mode
-> Save room
-> Redirect to /room/[id]


---

## 13.4 Access Mode Flow



Request Room
-> Read access_mode
-> If private: validate token
-> If artists-only: role == artist?
-> If reviewers-only: role == reviewer?
-> If hybrid: allow
-> If score-gated (future): trust >= X?
-> If allowed -> enter room
-> Else -> show "Access denied" message


---

**End of SECTION 3/6**



When you're ready:

Say: “Next section”

And I will deliver Section 4/6: Admin Panel, Debugging Tools, and API specs.

You said:
next section
ChatGPT said:

Here we go — continuing with the full handoff.

🧩 HANDOFF_SONGPIG_MVP.md — SECTION 4/6

Paste this after Section 3.

# 14. 🛠 Admin Panel (MVP Technical Specification)

The admin panel is designed for:

- User management  
- Room debugging  
- Role assignments  
- Status changes  
- Viewing raw tables (powerful, but restricted)  

The admin panel lives under:



/admin


This route is **protected**; only users with role `admin` may access it.

---

## 14.1 Admin Dashboard Overview

The dashboard contains:

### 1. Summary Stats
- Total users  
- Total rooms  
- Active vs disabled users  
- Votes submitted  
- Comments written  

Visible at top.  
Used for sanity checks.

### 2. Users Table
Columns:

| Column | Description |
|--------|-------------|
| username | display name |
| email | optional |
| role | admin / artist / reviewer |
| status | active / disabled / deleted |
| created_at | date |
| last_login | date |
| controls | edit button |

Admin actions:

- Change role (admin → artist/reviewer forbidden except by super admin)
- Disable user  
- Soft-delete user  
- Reactivate deleted user  

### Super Admin Highlight
The super admin account is rendered with:
- Orange badge: **SUPER ADMIN**
- Disabled Edit/Delete buttons

---

### 3. Raw Users Debug View

A collapsible panel.

Endpoint:



GET /api/users/debug


Must validate:

- Caller is admin  
- Caller is not disabled  

Returns **raw rows** from the `users` table.

Displayed as:

- Wide table  
- Searchable  
- Sortable (created_at DESC default)  
- “Download CSV” button  

This helps developers inspect Supabase rows during testing.

---

### 4. Raw Rooms Debug View

Endpoint:



GET /api/rooms/debug


Like users debug view, but for:

| id | artist_id | name | access_mode | created_at | invite_code | etc |

CSV download supported.

---

# 15. 🔌 API Specifications (MVP)

This section describes *exact endpoint behaviors* in the MVP.

---

## 15.1 Auth Endpoints

### POST `/api/auth/login`
Input:

```json
{
  "username": "string",
  "password": "string"
}


Output:

Success: user object (no password)

Failure: 401 invalid credentials

Sets localStorage with normalized user.

POST /api/auth/register

Input:

{
  "username": "string",
  "password": "string",
  "email": "optional",
  "role": "artist or reviewer"
}


Creates user in DB.
Automatically logs them in.

GET /auth/callback

Executed after OAuth.
Handles:

Supabase session

DB sync

Role normalization

Status checks

Redirect to dashboard

POST /api/auth/sync

Internal endpoint for mapping Supabase auth user to application-level user row.

Logic:

If no matching auth_id → create new user

If user exists but status=disabled → block login

If status=deleted → restore as active reviewer/artist

If signupRole was passed → set role accordingly

Never auto-promote to admin

Outputs normalized user.

15.2 Room Endpoints
POST /api/rooms/create

Input:

{
  "name": "string",
  "versionA": "file metadata",
  "versionB": "file metadata",
  "prompt": "string or null",
  "accessMode": "private | artists | reviewers | hybrid",
  "defaultsApplied": true
}


Steps:

Upload audio to R2

Create DB row

Return room ID

GET /api/rooms/[id]

Returns:

Player metadata

Artist prompt

Access mode

URLs for audio

Comments (if artist)

Whether reviewer completed vote

POST /api/rooms/listen-progress

Tracks listening percentage.

Input:

{
  "roomId": "uuid",
  "version": "A or B",
  "maxPositionSeconds": 42.3,
  "durationSeconds": 120.0
}


Server recalculates percentage.
Never trust client’s percent field.

POST /api/rooms/comment-and-vote

This endpoint handles both actions together.

Input:

{
  "roomId": "uuid",
  "winner": "A or B",
  "comment": "string",
  "percentA": 0.38,
  "percentB": 0.42
}


Validation flow:

Confirm user role = reviewer

Confirm user has not voted before

Confirm listen thresholds

Confirm comment minimum length

Insert comment

Insert vote

Mark room as completed for user

15.3 User Endpoints
GET /api/users/me

Returns normalized current user.

POST /api/users/update

Updates:

username

avatar_url (once avatar upload API is added)

POST /api/users/avatar (Phase 2 but scaffolded)

Stores avatar in R2 or Supabase storage.

15.4 Admin Endpoints
GET /api/users/debug

Returns all users.

GET /api/rooms/debug

Returns all rooms.

PATCH /api/users/[id]

Allows:

Change role (with restrictions)

Change status

Modify deleted account

Cannot modify super admin except from super admin account

16. 🧪 Testing Plan (Developer Notes)

Ensure the following flows are tested:

16.1 Auth

Login with wrong password

Register existing username

Login → logout → login

OAuth signup as reviewer/artist

OAuth with missing role (error)

16.2 Room Access

Reviewer accessing artist-only room

Artist accessing reviewer-only room

Private room without token

Hybrid access mode

16.3 Listen Percentage

Vote before threshold → blocked

Vote after threshold → allowed

Listening to only one version → blocked

16.4 Comment Requirement

Empty comment → blocked

Short comment (<20 chars) → blocked

Valid comment → allowed

Timecode detection

16.5 Admin Panel

Super admin protections

Role changes

Soft delete

Reactivate deleted user

17. 📌 Developer Tips (Cursor-Friendly)

Use server components where possible

Minimize stateful client components

Use Suspense for loading audio

Offload heavy logic to utility libs under /lib

Keep components pure

Avoid unnecessary SSR/ISR for dynamic pages

Always validate access mode server-side

18. ✔ MVP Acceptance Criteria

SongPig MVP is considered complete when:

Functional

Artists can create A/B rooms

Reviewers can listen, comment, and vote

Listen threshold enforces correctly

Comment requirement enforces correctly

Access modes enforce correctly

Timecoded comments work

Artist dashboards load correctly

Reviewer dashboards show available rooms

Non-functional

OG metadata works

Sharing previews load

Performance acceptable

No critical console errors

Admin panel fully functional

END OF SECTION 4/6

---

When ready:

### **Say: “Next section”**

And I will deliver **Section 5/6: Diagrams, Examples, and Implementation Notes**.

You said:
next section
ChatGPT said:

Great — continuing with the full handoff doc.

Here is:

🧩 HANDOFF_SONGPIG_MVP.md — SECTION 5/6

Paste this immediately after Section 4.

# 19. 📊 Expanded ASCII Diagrams (Critical Flows)

This section includes clean, developer-friendly ASCII diagrams for all major flows in the SongPig MVP. These are ideal for Cursor and engineering onboarding.

---

## 19.1 Full User Lifecycle Flow


     ┌──────────────┐
     │   /register   │
     └──────┬───────┘
            │
            ▼
 ┌────────────────────┐
 │  Create User Row   │
 │ role: artist/rev   │
 └─────────┬──────────┘
           │
           ▼
 ┌────────────────────┐
 │   setCurrentUser() │
 └─────────┬──────────┘
           │
           ▼
    ┌────────────┐
    │ /dashboard │
    └────────────┘


Login (email/password or OAuth):



User → /login → Supabase Auth → /auth/callback
→ /api/auth/sync → setCurrentUser()
→ /dashboard


---

## 19.2 Room Access Flow



User → /room/[id]
│
├── access_mode == private?
│ ├── token valid? → allow
│ └── invalid → reject
│
├── access_mode == artists?
│ ├── role=artist → allow
│ └── deny
│
├── access_mode == reviewers?
│ ├── role=reviewer → allow
│ └── deny
│
└── access_mode == hybrid?
└── allow


---

## 19.3 Reviewer Voting Flow (Detailed)



Reviewer enters room
│
▼
Audio Players Load (A + B)
│
├── Track listen % for A
└── Track listen % for B
│
▼
Check thresholds:
A >= min% AND B >= min% ?
│
├── NO → disable vote; show tooltip
└── YES → enable vote
│
▼
Comment typed?
│
├── NO → disable submit
└── YES (≥20 chars)
│
▼
Submit vote → POST /comment-and-vote
│
▼
Mark room as completed
│
▼
Show thank you message


---

## 19.4 A/B Audio Playback Diagram


            ┌────────────┐


Version A →────► AudioPlayer │
└────────────┘
▲ ▲
│ │
Track max position ──┘ │
┌──┘
│
Listen % A

            ┌────────────┐


Version B →────► AudioPlayer │
└────────────┘
▲ ▲
│ │
Track max position ──┘ │
┌──┘
│
Listen % B


The system must record:

- max position  
- duration  
- percentage = max/duration  

---

## 19.5 Comment + Timecode Flow



User types comment:
"I like the harmony at 2:05 and the snare at 0:47."

    │
    ▼


Regex detects timecodes → replace with clickable spans
│
▼
Artist view:
comment rendered
│
└── click "2:05" → audio.seek(125)


---

## 19.6 Admin User Role Edit Flow



Admin → /admin → Users Table
│
▼
Click Edit → open modal
│
├── is_super_admin?
│ ├── YES → disable UI
│ └── NO → allow edit
│
▼
PATCH /api/users/[id]
│
├── Non-super-admin editing admin? → reject
└── Apply changes


---

# 20. 🧱 Data Models (Technical Detail)

Below are the recommended database schemas in a developer-ready format.

---

## 20.1 Table: `users`

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  auth_id text unique,
  username text not null,
  email text,
  role text check (role in ('admin','artist','reviewer')) not null,
  status text check (status in ('active','disabled','deleted')) not null default 'active',
  avatar_url text,
  created_at timestamp default now(),
  last_login timestamp
);

20.2 Table: rooms
create table rooms (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references users(id),
  name text,
  prompt text,
  access_mode text check (
    access_mode in (
      'private',
      'artists',
      'reviewers',
      'hybrid'
    )
  ) default 'reviewers',
  version_a_url text,
  version_b_url text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

20.3 Table: comments
create table comments (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id),
  reviewer_id uuid references users(id),
  comment_text text not null,
  created_at timestamp default now()
);

20.4 Table: votes
create table votes (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id),
  reviewer_id uuid references users(id),
  winner text check (winner in ('A','B')),
  created_at timestamp default now()
);


Unique constraint:

alter table votes add constraint one_vote_per_reviewer unique (room_id, reviewer_id);

20.5 Table: listening_progress
create table listening_progress (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id),
  reviewer_id uuid references users(id),
  version text check (version in ('A','B')),
  max_position_seconds float,
  duration_seconds float,
  created_at timestamp default now()
);

21. 🎨 UI/UX Guidelines (MVP Simplicity Rules)

These ensure SongPig feels clean and lightweight.

21.1 General Design Principles

Minimal UI

High contrast for clarity

Mobile-first layout

Avoid clutter around the audio player

Large vote buttons

Plenty of white space

21.2 Room Page Layout

Recommended structure:

[Room Title]
[Artist Name + Avatar]
[Guided Prompt Box]

[AUDIO PLAYER A]
[AUDIO PLAYER B]

[Comment Box]

[Vote A]  [Vote B]

[Tip Jar Link]
[Share Buttons]

21.3 Mobile Experience

Critical points:

A/B switch should be thumb-accessible

Comment box should auto-expand

Vote buttons large and spaced

Audio player must not break layout

Share buttons should be sticky or near bottom

22. 📈 MVP Performance Requirements

Audio files must stream quickly from R2

First load should be under 2 seconds

Room load under 1 second after first visit

Comments pagination (batch of 20)

Minimal JS on first paint

23. 💾 Error Handling Guidelines
For Reviewers:

If audio fails → “Audio can’t load, please refresh.”

If vote fails → retry silently, then display warning

If threshold not met → tooltip

For Artists:

If upload fails → show retry

If saving room fails → maintain form state

For Admin:

Display error modals with exact payloads

24. 🧩 Modular Components Overview

Each component should be reusable, clean, and independent.

Key Components:
<ABPlayer />

Handles audio

Reports listen progress

Accepts timecode jumps

<CommentBox />

Tracks input

Enforces min length

Detects timestamps

<RoomCard />

Branding

Compact metadata

<AccessBadge />

Color-coded access mode

<PromptBox />

Shows artist’s guidance

END OF SECTION 5/6

---

When you’re ready:

### **Say: “Final section”**

And I’ll deliver **Section 6/6 — The final wrap-up & completeness signature + integration notes for Cursor/Vercel/Supabase**.

You said:
section 6
ChatGPT said:

Here it is — the final part of the Handoff document.

🧩 HANDOFF_SONGPIG_MVP.md — SECTION 6/6

Paste this directly after Section 5.

# 25. 🧩 Integration Notes (Cursor + Vercel + Supabase)

This section ensures the engineering team can build and maintain SongPig smoothly in Cursor, with predictable deployments and tight integration between Vercel and Supabase.

---

## 25.1 Cursor Workflow Recommendations

### **Separate chats by purpose**
- One chat for *feature development*  
- One for *bug fixing*  
- One for *refactoring / cleanup*

This prevents context drift and reduces reindexing load.

---

### **Reindexing Rule**
After merging large changes into the repo:

- Reindex once  
- Then continue working  

Do **not** reindex after every commit.

---

### **Cursor Prompt for new chats**
Use this block at the start of any new Cursor chat:



I’m working on SongPig — a private A/B testing platform for musicians.

Next.js 16 + React 19 frontend

Supabase backend (Auth + DB)

Cloudflare R2 for audio

Vercel deployment

Major constraints:

Reviewers must listen to X% of both versions before voting

Reviewers must write a minimum-length comment before voting

Artists can set guided feedback prompts

Timecodes in comments should be clickable and jump the audio player

Access modes: private, artists-only, reviewers-only, hybrid

Clean, simple UI; minimalism preferred

Use this HANDOFF.md as the source of truth

Please answer using best practices for Next.js, Supabase, and Vercel.


---

## 25.2 Vercel Integration Notes

Set the following environment variables in **Project Settings → Environment Variables**:



NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET_NAME=songpig-audio
NEXT_PUBLIC_APP_URL=https://ab.songpig.com


**Preview Deployments**  
Disable preview protection or set bypass tokens.  
OAuth must redirect back into the app.

---

## 25.3 Supabase Integration Notes

### Authentication → URLs:



Site URL:
https://ab.songpig.com

Redirect URLs:
http://localhost:3000/auth/callback

https://ab.songpig.com/auth/callback

https://*.vercel.app/auth/callback (if wildcard allowed)


### Enable Realtime for:
- `comments`
- `votes`  
(Only if realtime comments are added post-MVP.)

### Storage (optional)
Avatars can be stored in Supabase Storage (Phase 2).

---

## 25.4 Cloudflare R2 Integration Notes

Bucket layout:



songpig-audio/
{artistId}/
{roomId}/
A.wav
B.wav


Access should use presigned URLs generated server-side.

---

# 26. 🧹 Clean Code Standards (For All Contributors)

To keep the project maintainable:

### 1. Avoid monolithic components  
Break UI into small, pure pieces.

### 2. Keep API routes thin  
Business logic should live in `/lib/*`.

### 3. Strong typing  
Use TypeScript everywhere.

### 4. Consistent naming rules
- Components: `PascalCase`  
- Functions: `camelCase`  
- Files: `kebab-case`  

### 5. Use Zod or custom validators for input validation

---

# 27. ⚙ Deployment Checklist

Before deploying MVP to production:

### **Frontend**
- All pages build cleanly in Vercel  
- No console errors on any route  
- No hydration errors  
- Mobile UI verified  

### **Backend**
- All API endpoints tested with real data  
- Supabase RLS rules reviewed  
- Room access enforced correctly  
- Admin permissions tested  

### **Database**
- All indexes present  
- Unique constraints enforced  
- Listening_progress table heavily tested  

### **Environment**
- OAuth works in preview AND production  
- R2 permissions verified  

---

# 28. 🔒 Security Checklist

### Authentication
- Block disabled users everywhere  
- Prevent login of deleted users except restoration flow  

### User Content
- Sanitize comment text  
- Cap comment length (2000 chars)  
- Validate timecodes server-side  

### Roles
- Prevent privilege escalation  
- Prevent tampering with super admin  

### Rate Limiting
- Apply per-IP and per-user limits on:
  - Login  
  - Comment posting  
  - Vote submission  
  - Room creation  

---

# 29. 🧭 Long-Term Evolution Plan (Non-MVP)

These items are *not* MVP but should be considered when building the foundation:

### 29.1 Reviewer Trust Score (Phase 2)
Built from:
- Listen quality  
- Comment length  
- Artist ratings  
- Vote consistency  

Allows:
- Score-gated rooms  
- Reviewer levels  

---

### 29.2 Public Feed (Phase 3)
A TikTok-style “music discovery feed” with:

- Swipe A/B  
- Quick votes  
- Public visibility  

---

### 29.3 AI Feedback Helpers
Later, AI may summarize:

- Reviewer comments  
- Theme clusters  
- Mix issues  

NOT part of MVP.

---

# 30. 🧾 Final Notes for Developers

This handoff document is the **source of truth**.  
If any ambiguity arises:

1. Favor simplicity.  
2. Favor artist clarity.  
3. Favor reviewer ease-of-use.  
4. Favor minimal cognitive load.  
5. Avoid adding new settings unless absolutely required.  

SongPig’s success depends on:

- Speed  
- Smooth UX  
- Quality feedback  
- Simplicity  
- Viral shareability  

Everything in the MVP is designed to serve those principles.

---

# 31. ✔ Completion Statement

With Sections 1–6 combined, you now have:

- Full architecture  
- Full product spec  
- Role logic  
- Access mode logic  
- Reviewer flow  
- Artist flow  
- Admin behavior  
- API structure  
- Data models  
- UI guidelines  
- Diagrams  
- Deployment checklists  
- Security requirements  
- Integration notes  
- Future roadmap pointers  

This document is ready for:

- Cursor  
- GitHub  
- Vercel teams  
- Supabase onboarding  
- Developer handoff  
- Long-term maintenance  

---

# END OF SONGPIG MVP HANDOFF DOCUMENT.
