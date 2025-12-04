# SONGPIG PRODUCT ROADMAP
## Full Multi-Phase Development Plan (MVP → Viral Growth → Scaling)

**Last Updated:** 2025-12-04  
**Primary Domain:** `ab.songpig.com`  
**Core Objective:**  
Build the simplest possible A/B audio comparison platform that artists love using and reviewers love participating in — and then expand into a global music testing ecosystem.

> **Note:**  
> This document is a forward-looking roadmap. It describes planned phases and features beyond the current implementation.  
> For what is live today, see `HANDOFF_SUMMARY.md`. For the detailed target MVP behavior, see `handoff_mvp.md`.

---

# TABLE OF CONTENTS
1. Guiding Principles
2. Phase 0 — Stabilize & Polish the MVP Foundation
3. Phase 1 — MVP Feature Completion (Launch-Ready)
4. Phase 2 — High-Impact Enhancements (Viral + Trust)
5. Phase 3 — Engagement & Retention Systems
6. Phase 4 — Scaling, Monetization & Network Effects
7. Phase 5 — Advanced & Optional Future Features
8. Defer / Rejected Ideas (Documented for History)
9. Prioritization Framework
10. Release Cadence Recommendations

---

# 1. GUIDING PRINCIPLES

These rules decide what gets built, in what order, and why.

### **1.1. Serve Artists First**
- Fast room setup  
- Clear feedback  
- Easy comparisons  
- No clutter or overthinking required

### **1.2. Make Reviewers Feel Important**
- Smooth listening experience  
- Easy but **meaningful** comments  
- A feeling of contributing to real music

### **1.3. Keep Everything SIMPLE**
Every new feature must pass:
- Does this confuse a new user?  
- Can this be explained in 1 sentence?  
- Does it create settings bloat?  

If not → strip it down.

### **1.4. Default Settings Should Carry 95% of the Load**
Artists shouldn’t need to configure endless toggles.  
Defaults do the heavy lifting.

### **1.5. Viral by Design**
The product should naturally encourage:
- Sharing  
- Inviting  
- “Hey, check out this comparison”  
- “Help me choose which version to release”

### **1.6. Trust & Fairness Are Core**
We enforce:
- Listen-before-voting  
- Comment-before-voting  
- No spam reviews  
- No fake votes  
- Reviewer reputation in later phases

### **1.7. Build for Cursor-Friendly Development**
- Clean modular files  
- Clearly named components  
- Separation of concerns  
- No unnecessary complexity  

---

# 2. PHASE 0 — STABILIZE & POLISH THE FOUNDATION (PRE-MVP)

**Goal:** Ensure the app is technically solid before adding new features.

### **2.1 Fix Hydration Warnings**
- Ensure all browser-only logic runs in `useEffect`.

### **2.2 Clean Up Auth Logic**
- Ensure login/register/OAuth all redirect correctly.
- Test disabled/deleted users flows.

### **2.3 Ensure Room Access Enforcement**
- Private rooms  
- Artists-only  
- Reviewers-only  
- Both  
- Invite-only  

### **2.4 Validate Database Integrity**
- Unique constraints  
- Foreign keys  
- Indexes on rooms, listen_progress, comments  

### **2.5 Cleanup Admin UI**
- Correct coloring  
- Ensure super admin cannot be edited  
- Sorting/filter functionality polished  

### **2.6 Core Audio Player Stability**
- Both versions load reliably  
- Preload logic is efficient  
- No unnecessary buffering  

---

# 3. PHASE 1 — MVP FEATURE COMPLETION (READY FOR REAL USERS)

**Goal:** Build a polished, intuitive baseline version that works without confusion.  
This phase includes everything necessary to launch a usable A/B platform.

---

## **3.1 Mandatory MVP Features**

### **✔ Listen Before Vote (Required Gate)**
- Reviewers must listen to **X%** of both tracks  
  BEFORE the vote buttons become active.

### **✔ Comment Required Before Voting**
- Minimum length (e.g., 20–40 characters)  
- Shows progress bar while typing  
- Enforced server-side  

### **✔ Artist Can Add a Guided Prompt**
Examples:  
- “Which vocal feels more emotional?”  
- “Does the intro feel too long?”  
- “Which mix sounds cleaner?”

Stored per room.

### **✔ Timecoded Comments**
- Reviewers tap: “Add timestamp”  
- Automatically inserts format `[2:05]`  
- Later clickable to jump the player  

### **✔ Artist Default Settings**
Stored in a `artist_defaults` table:
- Default access mode  
- Default feedback prompt  
- Default listening % threshold  
- Default comment requirement  
- Whether voting results are hidden until threshold reached  

Artist can override per-room.

### **✔ OG Meta Images for Social Sharing**
These ensure sharing looks **professional**:
- Twitter  
- Facebook  
- iMessage  
- Messenger  

### **✔ Clean Reviewer Queue**
Reviewers should never hit a dead end.  
If invited rooms are empty → show:

> “No private rooms available right now — but here are 3 public test rooms to try.”

### **✔ Admin Tools for Support**
- View raw users  
- View raw rooms  
- Disable/restore users  
- Debug comments  

### **✔ Basic Tip Jar**
Simple approach:
- “Tip the Artist” button  
- External link (PayPal/Ko-fi link stored on profile)  

No complex payment integration yet.

---

## **3.2 MVP UI Polishing**

### **✔ Ultra-Clean Room Page**
Only shows:
- A or B toggle  
- Big play button  
- Vote buttons (locked until allowed)  
- Comment box  
- Guided prompt  
- Timecode button  

### **✔ Dashboard for Artists**
Shows:
- Rooms created  
- Stats  
- Feedback summaries  

### **✔ Dashboard for Reviewers**
Shows:
- Rooms available to review  
- Completed rooms  
- Reviewer progress  

---

## **3.3 MVP Security**
- Enforce role checks everywhere  
- Server-side voting validation  
- Prevent multiple votes  
- Prevent skipping listen requirements  
- Rate limiting on comment posting  

---

## **3.4 MVP Deployment Checklist**
- Confirm all OAuth redirect URLs  
- Test on mobile  
- Test lossy networks  
- Test R2 quotas  
- Lighthouse performance checks  

---

**END OF SECTION 1.**

---

# 4. PHASE 2 — HIGH-IMPACT ENHANCEMENTS (VIRAL + TRUST + ARTIST VALUE)

**Goal:** After MVP is stable, add the features that make SongPig *spread* and make artists *love it even more*.  
These features increase retention, trust, and virality.

---

# 4.1 Reviewer Trust Score (Core of Phase 2)
This is the most important non-MVP feature.

### **4.1.1 What It Measures**
- % listened per track  
- Number of comments written  
- Average comment depth (not just “cool”)  
- Artist ratings of reviewer feedback  
- Vote reliability patterns  
- Completion rate of rooms  

### **4.1.2 Why It Matters**
Artists can eventually choose:
- “Only reviewers with trust score 50+”
- “Only reviewers with at least 5 completed reviews”
- “Only reviewers who don’t skip listening”

### **4.1.3 Trust Score Benefits**
- Reviewers feel proud → engagement rises  
- Increases feedback quality  
- Blocks trolls & low-effort reviews  
- Enables **tiered rooms** later

---

# 4.2 Enhanced Access Modes for Rooms

### **4.2.1 MVP Access Modes (Phase 1)**
- Public  
- Artists-only  
- Reviewers-only  
- Mixed (artists + reviewers)  
- Private (invite link only)

### **4.2.2 Phase 2 Enhanced Access**
Add trust-based gating:

- **“Only reviewers with trust score ≥ X”**  
- **“Only reviewers with at least Y reviews completed”**

---

# 4.3 Social Sharing Enhancements

### **4.3.1 Social Share Buttons**
- X/Twitter  
- Facebook  
- Messenger  
- Reddit  
- WhatsApp  
- Email share  

### **4.3.2 Perfect OG Cards**
Each room generates a beautiful preview card with:
- SongPig branding  
- Artist name  
- “Which is better: A or B?”  
- Room cover image  
- Automatic image generation if none uploaded  

### **4.3.3 Share Incentives**
For reviewers:
> “Share this room — earn +1 trust score when your friend reviews.”

For artists:
> “Share this battle — get more votes & better data.”

---

# 4.4 Artist Feedback Insights (Light Analytics)

### **4.4.1 What Artists Want to Know**
- Which version won  
- Why it won (comment clusters)  
- Where listeners dropped off  
- What timecodes kept being mentioned  

### **4.4.2 Phase 2 Analytics (Non-AI)**
- Word cloud of common adjectives  
- Chart of votes over time  
- Timecode hotspots  
- Comment themes manually grouped  
- Completion % for each reviewer  

### **4.4.3 Future AI Analytics (Phase 5)**
Not in this phase — but architecture should allow it.

---

# 4.5 Reviewer Reputation Badges (Optional)
Gamified—*but tasteful*.

Badges like:
- “Thoughtful Reviewer”  
- “Consistent Ear”  
- “Super Listener (90% avg listening)”  
- “Artist Favorite”  

Artists see badges → trust rises.

---

# 4.6 Artist “Profile Page” (Phase 2 Light)
A simple public profile:
- Artist name  
- Profile picture  
- Social links  
- Tip jar link  
- Their battles (public rooms only)  

This increases discoverability and encourages sharing.

---

# 4.7 Quick Review Queue Improvements
Phase 2 ensures:

- Reviewers always have something to review  
- Rooms are shown in smart order  
  - Trust-gated rooms shown first (if qualified)  
  - Public rooms next  
  - Previously completed rooms hidden  

---

# 4.8 Export Data for Artists
One-click:

- CSV of votes  
- CSV of comments  
- Download MP3 of winning version (optional)  

---

# 4.9 Notifications (Lightweight)

### Email notifications:
- “Your room reached 10 reviews!”  
- “You have new feedback from 3 reviewers.”  
- “Your room results are ready.”

No real-time push notifications yet.

---

# 4.10 Room Presets (Massive Artist Time-Saver)
Artists can create templates:

**Preset example:**
- Access mode: reviewers only  
- % listen required: 80%  
- Comments required  
- Guided question: “Which vocal feels cleaner?”  

Artists LOVE presets because it removes repetitive setup.

---

# 4.11 Tip Jar Enhancements
Allow artists to display:
- Ko-fi  
- PayPal  
- Venmo  
- CashApp  
- BuyMeACoffee  

Only links.  
No payments inside SongPig yet.

---

# 4.12 Anti-Spam Enhancements
- Maximum 3 rooms per reviewer per hour  
- Limit comment posting speed  
- Detect repeated text (“nice”, “cool”, “A is better”, etc.)  
- Soft warnings for low-effort comments  

---

# 4.13 Lightweight Leaderboards (Optional)
A private leaderboard:
- Top reviewers by trust  
- Top reviewers by completion  
- Top artists by participation  

Gamifies engagement without overwhelming new users.

---

**END OF SECTION 2.**

---

# 5. PHASE 3 — ENGAGEMENT & RETENTION SYSTEMS
**Goal:** Once MVP + Phase 2 are stable, we shift to features that keep users coming back and make SongPig part of the artist workflow.**

These features increase:
- Daily active reviewers  
- Artist retention  
- Viral shares  
- Feedback quality  
- Platform stickiness  

---

# 5.1 Reviewer Home Feed (The “Always Something New” System)

Reviewers are MUCH more likely to stay active if they always see fresh content.

### **Feed priorities:**
1. Rooms they are personally invited to  
2. Rooms they qualify for (based on trust)  
3. Public rooms needing reviewers  
4. “Practice rooms” to onboard new reviewers  
5. Rooms from artists they follow (later phase)

### **Objectives:**
- NEVER show an empty queue  
- Make the next room just “one click away”  
- Encourage longer review sessions  

---

# 5.2 Artist Dashboard Enhancements

### **Phase 3 adds:**
- Trending battles  
- Rooms that need more reviewers  
- Follow-up recommendations  
  - “Try a C version with brighter vocals.”  
  - “Consider re-uploading with volume normalization.”  
- Summaries of reviewer demographics (non-personal)  

Artists feel this is a *tool* — not just a voting toy.

---

# 5.3 Comment Experience Upgrade

### **Features:**
- Nested replies (artist-only)  
- Emojis or lightweight reactions  
- Highlighted “most helpful comment”  
- Upvote helpful comments (artists only)  

### **Goal:**
Make feedback feel deeper and more valuable without turning this into Reddit.

---

# 5.4 Artist Follow / Fanbase System (Light Version)

### **Users can follow artists:**
- Reviewers  
- Other artists  
- Anonymous visitors  

### **What happens when you follow:**
- Reviewer sees new rooms from artists they follow  
- Artists get analytics on follower counts  
- Sharing becomes more meaningful  

This is the bridge between private feedback and public visibility.

---

# 5.5 Celebration Moments

Small touches make the platform feel alive.

### Examples:
- Confetti animation when an artist gets their **first 10 reviews**  
- Tooltip: “🔥 This room is trending with reviewers”  
- Badge: “First Room Created!”  
- Celebration email: “Your battle reached 50 reviews!”  

Low cost.  
High emotional payoff.

---

# 5.6 Song Version History

Artists will eventually create multiple rounds of versions A/B.

### **Phase 3 stores:**
- Version history  
- What changed  
- Which version won previously  
- Reviewer highlights from each round  

This turns SongPig into an artist’s *development timeline*.

---

# 5.7 Reviewer Levels / Tier Unlocks

A FUN but simple system:

### **Levels:**
- **Level 0: Rookie Reviewer**  
  - 0–4 reviews  
- **Level 1: Solid Reviewer**  
  - 5–19 reviews  
- **Level 2: Trusted Ear**  
  - 20–49 reviews  
- **Level 3: Pro Reviewer**  
  - 50–199 reviews  
- **Level 4: Elite Reviewer**  
  - 200+ reviews  

### **Benefits:**
Higher levels unlock:
- More exclusive rooms  
- Ability to review priority rooms  
- Special badges  
- Early access to new features  

This rewards reviewers for consistency.

---

# 5.8 Cross-Room Reviewer Stats

Reviewers can see:
- Their accuracy (how often they pick the winning version)  
- Their listening habits (% listened)  
- Their comment quality score  
- Trust score breakdown  

People LOVE stats about themselves.  
This drives retention.

---

# 5.9 Artist-to-Artist Feedback Mode

Many artists want *peer-only* feedback.

### Add:
- “Artist Feedback Mode”  
- Only artists can comment  
- Comments show artist badges  
- Reviewers excluded  

Creates a **pro circle** environment.

---

# 5.10 “Reviewer Packs” for Artists

Artists can pay (Phase 4) or earn credits to:

- Boost their room to more reviewers  
- Invite high-trust reviewers  
- Get feedback from Top 5% reviewers  

NOT pay-for-votes.  
Pay-for-**reach**.

---

# 5.11 Smart Nudges (Non-annoying)

Light reminders:

- “You’ve listened to 70% — finish to unlock voting!”  
- “3 new reviewers commented on your room.”  
- “Your default settings haven’t been saved.”  

Nudges increase engagement but should remain invisible unless needed.

---

# 5.12 Quality Control for Reviews

### Tools:
- Auto-flag for too-short comments  
- Auto-detect copy/paste spam  
- Flag reviewers who skip too many rooms  

### Artist tools:
- Ability to mark a comment as “Not helpful”  
- Ability to filter comments by trust score  
- Ability to hide low-quality feedback  

---

# 5.13 Advanced Filtering on Reviewer Queue

Reviewers can choose:
- Genre preferences (optional)  
- Mood preferences  
- Whether to include explicit content  

Artists tag their songs lightly:
- Genre  
- Mood  
- Language  

This routes reviewers toward rooms they *want* to hear.

---

# 5.14 Room Lifecycle Automation

To reduce artist overhead:

### Automatic:
- “Close room after X reviewers”  
- “Keep room open for Y days”  
- “Notify artist when enough reviews are gathered”  
- “Archive completed rooms”  

This makes SongPig feel more like a professional tool.

---

# 5.15 The “Winner Reveal” Experience

A polished experience:

- When a room concludes, artist sees:
  - Winner (A or B)  
  - Confidence score  
  - Key reasons reviewers mentioned  
  - Vote timeline  
  - Heatmap of timecode mentions  
  - Comment highlights  

SongPig becomes more than voting — it becomes insight.

---

**END OF SECTION 3.**

---

Say **“next”** for Section 4.

# 6. PHASE 4 — SCALING, MONETIZATION & NETWORK EFFECTS
**Goal:** Once SongPig is stable, trusted, and engaging, the next phase is monetization — but WITHOUT limiting essential free features.**

Monetization must feel:
- Optional  
- Ethical  
- Valuable  
- Artist-focused  

---

# 6.1 Freemium Model (Base Is Always Free)

### **Free Tier Includes:**
- Create A/B rooms  
- Upload audio  
- Get unlimited reviews  
- Guided questions  
- Trust-scored reviewers  
- Basic analytics  

This keeps the platform accessible.

---

# 6.2 Premium Artist Subscriptions (SongPig Pro)

### **Possible Pro Features:**
- Advanced analytics  
- Unlimited presets  
- Priority reviewer distribution  
- Early access to elite reviewers  
- Ability to run **multi-version battles** (A/B/C/D)  
- Enhanced comment insights  
- Comment sentiment breakdown  
- Timecode heatmaps  
- Custom branded social cards  
- Download all comments as formatted PDF  
- Profile page customization  

Artists are willing to pay if they feel they’re getting professional actionable insight.

---

# 6.3 Reviewer Incentives & Optional Monetization

### **Reviewer Rewards (Non-cash):**
- Badge unlocks  
- Priority access to exclusive rooms  
- Entry into monthly raffles  
- Unlock feedback influence scores  

Optional in the future:
- Reviewers earn credits redeemable for:
  - SongPig Pro discounts  
  - Artist services  
  - Boosts  
(No direct money payout — avoids legal issues.)

---

# 6.4 Boosts (Paid Distribution for Artists)
Boosting a room pushes it to more high-quality reviewers.

### Types of boosts:
- **Standard Boost:** reach +10 reviewers  
- **Targeted Boost:** reach only reviewers in “Top 20% Trust Score”  
- **Genre Boost:** reach reviewers who review similar genres  
- **Speed Boost:** get 5 reviewers within the next hour  

This is similar to Fiverr “Promoted Gigs,” a reliable revenue stream.

---

# 6.5 Sponsored Rooms (Later Phase)
Labels, agencies, and studios might want:
- Guaranteed audience  
- Demographic segmentation  
- Trusted reviewers only  
- Deeper analytics  

Sponsored rooms allow serious creators to pay for premium insight.

---

# 6.6 Integrations With Music Platforms

### Phase 4 supported integrations:
- YouTube music videos  
- Spotify preview clips  
- SoundCloud embeds  
- TikTok links (auto-generate A/B comparison from 2 clips)  

But audio uploads remain the core feature.

---

# 6.7 Affiliate Layer (Optional)
Artists often need:
- Mastering  
- Mixing  
- Vocal tuning  
- Artwork  
- Music video editors  

SongPig can partner with:
- LANDR  
- DistroKid  
- CD Baby  
- Fiverr (music category)

Affiliate earnings become passive revenue.

---

# 6.8 Trust & Legal Infrastructure for Scaling

### Must be hardened in Phase 4:
- Terms of service  
- Content guidelines  
- Reporting tools  
- Abuse prevention  
- DMCA handling (automated)  
- Clear privacy and data rights  

This protects the platform as traffic grows.

---

# 6.9 Community Building

### Introduce:
- Monthly competitions  
- Best A/B battle of the month  
- Reviewer spotlight  
- Artist milestones  
- Leaderboards for most improved artists  

This transforms SongPig into a *community*, not just a tool.

---

# 6.10 B2B + Enterprise Add-On (Long Term)
For:
- Record labels  
- Music schools  
- Artist development agencies  
- Sync licensing companies  

Tools include:
- Bulk A/B tests  
- Team accounts  
- Reviewer panels  
- Export to PDF reports  

This is a major revenue stream once the platform matures.

---

# 6.11 Mobile App (Optional — Only when metrics prove demand)
Native app for:
- Faster reviewing  
- Offline listening modes  
- Push notifications  
- Deeper engagement  

But web-first is correct for now.

---

# 6.12 Scaling Infrastructure

### Requirements:
- CDN caching  
- Optimized audio delivery  
- Sharded tables if necessary  
- Separate comment/vote storage  
- Observability dashboards  
- Error reporting tools  

Goal: Support 100k+ monthly active users.

---

# 6.13 Viral Loops Implementation

### Each room becomes a viral node.
When someone shares:
- Reviewers join the platform  
- Reviewers become artists  
- Artists create more rooms  
- Rooms generate more shares  

This exponential loop fuels organic growth.

---

# 6.14 Trust & Review Integrity Systems (Advanced)
Later additions:
- Machine-learning spam detection  
- Voting pattern anomaly detection  
- Timecode cluster analysis  
- Reviewer fingerprinting (device + behavioral)  

This is necessary once scale reaches tens of thousands.

---

**END OF SECTION 4.**



# 7. PHASE 5 — ADVANCED FEATURES (OPTIONAL / LONG-TERM)
These are **power features** that are not needed for early growth but dramatically increase the platform’s value once the foundation is strong.

They should ONLY be added when:
- MVP is stable  
- Engagement metrics are strong  
- Growth justifies the complexity  

---

# 7.1 AI-Powered Feedback Summaries
Large-scale AI analysis of reviewer feedback.

### Outputs:
- “Top 5 themes reviewers mentioned”  
- “Summary: Version A is favored for emotional vocals; Version B wins on clarity.”  
- Sentiment scores  
- Mix notes  
- Suggested improvements  

### Artist Benefits:
- Removes the burden of reading 200+ comments  
- Shows actionable insights quickly  

---

# 7.2 AI-Assisted Mastering Comparisons
SongPig could partner with LANDR, iZotope, or internal tools to:
- Auto-create variant A/B mixes  
- Allow artists to compare mix versions  
- Suggest technical improvements  

Long-term revenue potential.

---

# 7.3 Multi-Round Battles
Not just A/B — but progressive battles with rounds:
- Round 1: A vs B  
- Round 2: winner vs C  
- Round 3: winner vs D  

Each round becomes a deeper refinement loop.

---

# 7.4 Automatic Timecode Heatmapping
AI identifies:
- Commonly referenced timecodes  
- Emotional moments  
- Drop-offs or skips  

Heatmap displayed visually across the waveform.

---

# 7.5 Playlist Battles (A/B for sequences)
Artists compare two different:
- Track orders  
- Playlist flows  
- Album sequence variations  

Useful for album planning.

---

# 7.6 Collaborative Rooms
Multiple artists or producers run:
- Team feedback rooms  
- Co-writing battles  
- Producer shootouts  

Useful for writing camps and producer collectives.

---

# 7.7 Reviewer Personality Profiles
Based on:
- Genre preferences  
- Reviewing style  
- Comment patterns  
- Historical consistency  

Allows artists to select reviewers whose profile matches their sound.

---

# 7.8 Audio Fingerprinting to Prevent Duplicate Uploads
Avoids:
- Duplicate songs  
- Plagiarism  
- Unintentional re-uploads  

Compares audio to existing database.

---

# 7.9 Full Mobile App (If Demand Is Strong)
Features:
- Push notifications  
- Offline listening  
- Fast swiping  
- In-app camera to record “A/B reactions” for TikTok  

This dramatically increases engagement but is a later investment.

---

# 7.10 Marketplace for Creative Services
A long-term ecosystem play.

Categories:
- Mix engineers  
- Mastering engineers  
- Vocal tuners  
- Graphic designers  
- Producers  
- Beatmakers  

SongPig takes a small marketplace fee.

---

# 7.11 Brand Partnerships
With:
- SoundCloud  
- Spotify for Artists  
- TikTok  
- Ableton  
- Roland  
- DistroKid  

If these companies see SongPig as a valuable A/B testing pipeline, partnerships follow.

---

# 7.12 API Access for Agencies & Record Labels
Labels can:
- Run hundreds of A/B tests  
- Use reviewer panels  
- Export reports  
- Integrate into A&R workflows  

This is a **serious enterprise revenue stream.**

---

# 8. DEFERRED / REJECTED IDEAS (DOCUMENTED FOR HISTORY)
These ideas were discussed but ruled out for MVP or early phases. They are preserved so the team remembers why they were excluded.

---

## 8.1 “Force Reviewers to Watch a Video Ad”
❌ Rejected.  
Reason: destroys trust and kills engagement.

---

## 8.2 “Require full song listens (100%)”
❌ Rejected as mandatory.  
Reason:  
- Long songs create friction  
- Causes reviewer dropout  
- 80% threshold is more practical  

Artists can raise it manually if needed.

---

## 8.3 “Public commenting like Reddit”
❌ Rejected.  
Reason:  
- Low-quality discourse  
- Troll risk  
- Platform becomes messy  
- Focus must stay on artists

---

## 8.4 “Scoring system with 1–10 numerical ratings”
❌ Rejected (at least for MVP).  
Reason:  
- Numbers distort voting  
- Artists prefer binary A/B decisions  
- Comments explain better than scores  

---

## 8.5 “Allow reviewing without listening at all”
❌ Absolutely rejected.  
CORE PRINCIPLE: listening must come before voting.

---

## 8.6 “Let reviewers vote without comments”
❌ Rejected.  
Reason:  
- Comments provide insight  
- Reviewers must contribute value  
- Prevents spammy, low-effort feedback  

---

## 8.7 “Forced genre tagging before listening”
❌ Rejected for MVP.  
Reason:  
- Slows down reviewing  
- Reviewers should jump in quickly  

Genre filtering will come later but not required upfront.

---

## 8.8 “Full multi-step onboarding wizard for new users”
❌ Rejected for MVP.  
Reason:  
- Adds friction  
- New users should be able to quickly:
  1. Click a room  
  2. Listen  
  3. Vote  
  4. Comment  

Later onboarding may be added once platform grows.

---

## 8.9 “Complex rating formulas for trust score”
❌ Rejected for early phases.  
Reason:  
- Trust score must begin with simple rules  
- Can evolve eventually  

---

# 9. WHY THESE WERE REJECTED
The guiding principle is always:

> “Does this increase feedback quality and reduce friction?”  

If not → delay or reject entirely.

---

**END OF SECTION 5.**

# 10. PRIORITIZATION FRAMEWORK
This framework determines **what gets built first**, and ensures the team doesn’t drift into complexity or lose sight of the goal:  
**A viral, artist-loved A/B testing platform.**

SongPig follows a 5-tier prioritization model.

---

# 10.1 Tier 1 — Must-Have for Core Functionality (Blockers)
These items prevent the platform from functioning at all.

Examples:
- Listen-before-vote enforcement  
- Comment-before-vote enforcement  
- Room access security  
- Authentication stability  
- Audio player stability  
- Reviewer queue never empty  
- Guided prompt support  

**Rule:**  
If any Tier 1 item is unstable → NOTHING ELSE gets built.

---

# 10.2 Tier 2 — High Leverage (10× Improvement for Minimal Effort)
These features dramatically improve the experience or retention with very little development time.

Examples:
- OG meta share cards  
- Artist default settings  
- Timecode comments  
- Reviewer progress indicators  
- Basic analytics (votes, completeness)  
- Social share buttons  

**Rule:**  
If a task <4 hours and makes the platform feel “finished,” it gets prioritized.

---

# 10.3 Tier 3 — Engagement Builders (Stickiness Features)
These features increase usage frequency and reviewer/artist retention.

Examples:
- Reviewer trust score  
- Reviewer stats page  
- Artist dashboards with insights  
- Follow artists  
- Celebration moments  
- Improved reviewer queue logic  
- Reviewer badges  

**Rule:**  
Only build Tier 3 after MVP is launched and stable.

---

# 10.4 Tier 4 — Growth Accelerators (Viral Expansion)
These features help the platform spread organically.

Examples:
- Share incentives  
- Room previews with dynamic OG images  
- Invite-only trust-gated rooms  
- Artist profiles  
- Notifications (email)  
- Boost systems  

**Rule:**  
Focus on these once you have a predictable user base.

---

# 10.5 Tier 5 — Advanced / Optional (Not Needed for MVP)
These are optional, often complex, and only worth building when:

- Revenue is solid  
- User base demands deeper features  
- Infrastructure is stable  

Examples:
- AI comment clustering  
- Multi-round battles  
- Audio fingerprinting  
- Marketplace integrations  
- Mobile app  
- Enterprise tools  

**Rule:**  
Tier 5 is built LAST and ONLY when justified by data.

---

# 10.6 How to Prioritize Daily Work (Simple Rule of Thumb)

### Every new feature must answer:
**1. Does this reduce friction?**  
**2. Does this increase artist value?**  
**3. Does this increase reviewer engagement?**  
**4. Does this help the platform grow?**

If the answer is “no” → de-prioritize.

---

# 10.7 “One Feature = One Session” Focus Rule
Any feature that cannot be completed in a single Cursor development session should be:

- Broken into smaller chunks  
- Assigned one chunk at a time  
- Released incrementally  

Avoid “giant features” that stall progress or create bugs.

---

# 10.8 Feature Risk Assessment
Every feature should be evaluated on:

- **User value** (high/medium/low)  
- **Complexity** (simple/moderate/high)  
- **Risk** (low/medium/high)  
- **Dependencies**  

Only high-value, low-risk items jump ahead.

---

# 10.9 Balancing Artist vs Reviewer Work
**Priority always flows artist → reviewer, not the reverse.**

Why?
- Artists create rooms  
- Artists share content  
- Artists drive traffic  
- Artists convert to paid plans  
- Artists bring reviewers  

Artists are the engine; reviewers are the fuel.

---

# 11. RELEASE CADENCE STRATEGY
This defines *how* new features are rolled out.

---

# 11.1 Cadence Recommended for SongPig

### **Weekly Micro-Releases (Ideal for Vercel + Supabase)**
- Small incremental features  
- Fast bug fixes  
- Continuous improvements  

### **Monthly Feature Packages**
- Collections of related features  
- E.g. “Reviewer Trust Score Update,” “Artist Insights Pack”  

### **Quarterly Major Milestones**
- Big system-level upgrades  
- Monetization features  
- Major UI redesigns  
- AI-powered features  

---

# 11.2 Release Levels

### **Level 0 — Hotfix**
- Urgent  
- Security or catastrophic bugs  
- Push immediately  

### **Level 1 — Patch**
- Small UX fixes  
- UI adjustments  
- Copy changes  
- Performance tweaks  

### **Level 2 — Feature Release**
- Add or revise a feature  
- Announce to users  

### **Level 3 — Major Release**
- New system (trust, presets, analytics, boosting)  
- Requires migration or major testing  

---

# 11.3 How to Validate New Features
Before release:

1. **Local Testing**  
2. **Staging Testing**  
3. **Real reviewer test (internal)**  
4. **Real artist test (internal)**  
5. **Gradual rollout**  
6. **Collect feedback**  
7. **Iterate**  

This mirrors the process used by:
- Spotify  
- SoundCloud  
- Google  

---

# 11.4 Post-Release Monitoring

For each release, track:

- User signups  
- Rooms created  
- Reviews submitted  
- Completion rate  
- Comment length  
- Share rate  
- Reviewer retention  
- Artist activity  
- Crash/error logs  
- Support tickets  

If metrics drop → roll back or adjust.

---

# 11.5 Growth Loop Awareness

Prioritize features that accelerate this loop:

**Artists create rooms → Reviewers join → Reviewers share → More artists join → More rooms → More reviews → More data → Better results → More sharing.**

This is the **engine of the platform**.

---

# 11.6 Avoiding Feature Bloat
To avoid clutter:

- If 10% of users don’t use a feature → consider removing it  
- If a feature causes confusion → simplify it  
- If a feature increases support requests → re-evaluate it  

Simplicity = growth.

---

# 11.7 When to Pause Feature Development
Pause and stabilize when:

- Bug reports spike  
- Engagement drops  
- Traffic surges unexpectedly  
- Database load spikes  
- Audio upload issues appear  

Stability ALWAYS overrides new features.

---

# 11.8 When to Accelerate Development
Accelerate when:

- Shares are increasing  
- Artists request upgrades  
- Reviewers are returning frequently  
- Music communities show interest  
- Influencers begin using the platform  

---

# 11.9 MVP → Pro Timeline (Suggested)
- **Month 1:** MVP polish + launch  
- **Month 2:** Trust score + artist defaults + share cards  
- **Month 3:** Insights + presets + reviewer stats  
- **Month 4:** Boosts + notifications + reviewer levels  
- **Month 5:** Profiles + enhanced analytics + follow system  
- **Month 6:** Monetization + advanced insights  
- **Month 7+:** AI systems, enterprise tools, mobile app  

---

# END OF ROADMAP DOCUMENT
This includes:
- Guiding principles  
- All phases (0 through 5)  
- Rejected ideas  
- Prioritization framework  
- Release cadence  
- Feature risk assessment  
- Long-term evolution plans  

SongPig now has a **clear, professional, investor-grade roadmap** aligning with the MVP handoff document.


