# Song Pig Listening Rooms - Roadmap Status

**Last Updated:** December 1, 2025

---

## ✅ COMPLETED FEATURES

### Core Platform (v0.1.0-alpha)
- ✅ Room creation and management (draft/active/archived/deleted)
- ✅ Song comparison and A/B testing
- ✅ Voting system with win rate tracking
- ✅ Comment system with author tooltips
- ✅ User authentication (Admin, Artist, Listener roles)
- ✅ Guest access for viewing rooms
- ✅ Invite code system for room sharing
- ✅ Profile management with bio editing
- ✅ Admin dashboard for user and room management
- ✅ Custom audio player with progress/volume controls
- ✅ Timezone-aware timestamps
- ✅ Breadcrumb navigation
- ✅ Mobile responsive design
- ✅ Toast notification system
- ✅ Scroll to top button

### Enhanced Features (v0.1.1-alpha)
- ✅ In-app feedback system with admin panel
- ✅ Comment reactions (Like, Love, Insightful, Fire)
- ✅ Threaded comment replies
- ✅ Artist dashboard with stats (rooms, songs, votes, comments)
- ✅ Recent feedback display on home page
- ✅ Bulk select and bulk status changes (rooms, users, feedback)
- ✅ AI-assisted feedback triage (OpenAI + Anthropic fallback)
- ✅ Feedback filters (type, status, priority)

### Cloudflare R2 Audio Hosting (Recent)
- ✅ Cloudflare R2 bucket setup and configuration
- ✅ R2 API integration with pre-signed URLs
- ✅ File upload UI with progress tracking
- ✅ Per-artist storage caps (default: 6 cloud songs)
- ✅ Admin controls for enabling/disabling uploads per user
- ✅ Terms & Conditions checkbox for uploads
- ✅ Storage upgrade request API endpoint
- ✅ Song deletion with R2 file cleanup
- ✅ Database migration for storage tracking

### Mobile & UI Improvements (Recent)
- ✅ Fixed horizontal scrolling issues
- ✅ Improved mobile layout and spacing
- ✅ Fixed duplicate titles
- ✅ Archive/Delete button layout improvements
- ✅ Comment form overflow fixes
- ✅ Enhanced Delete confirmation dialog
- ✅ Page labels for debugging (temporary)

---

## 🚧 IN PROGRESS / PARTIALLY COMPLETE

### Storage Management
- ⚠️ **Storage upgrade request admin UI** - API exists (`/api/support/storage-upgrade`), but no admin UI to view/manage requests yet
- ⚠️ **Storage usage tracking** - Database fields exist (`storage_used_bytes`, `storage_limit_bytes`), but not automatically updated on upload/delete
- ⚠️ **Storage quota enforcement** - Basic song count limit works, but byte-based limits not enforced

---

## 📋 PENDING FEATURES

### From README "Upcoming Features"
- ❌ **Reviewer points + leaderboard system** - Reward listeners/guest artists for thoughtful feedback
- ❌ **Room name format refinement** - Change from "Room Name - Artist Name" to "Room Name by Artist Name"
- ❌ **Admin user creation panel** - Create users directly from admin dashboard (Note: Basic create user form exists, may need enhancement)
- ❌ **Improved deployment configuration** - Better CI/CD and deployment setup

### From Conversation History / Feature Requests
- ❌ **Profile pictures** - Add profile pictures for artists and listeners (optional, not required)
- ❌ **Beta tester leaderboard** - Leaderboard system for beta testers
- ❌ **Exact location comments** - Comments tied to specific timestamps in songs (heat map feature)
- ❌ **Artist response to comments** - Artists can reply to comments and have messaging system
- ❌ **Data usage tracking dashboard** - Track platform data usage and identify abusers
- ❌ **Admin UI for storage upgrade requests** - View and manage storage upgrade requests from artists
- ❌ **Admin UI for total platform storage** - Dashboard showing total storage used across platform
- ❌ **Admin UI for per-artist storage limits (MB)** - Set storage limits in MB per artist
- ❌ **Admin UI for song play counts** - Track and display play counts per song
- ❌ **Global safety switch** - `CLOUDFLARE_UPLOADS_ENABLED` environment variable to disable uploads globally
- ❌ **Terms page content** - Actual `/terms` page with terms of use content (currently just a link)

### Technical Debt / Improvements
- ❌ **Automated changelog updates** - Systematically update changelog and revisions
- ❌ **Systematic revision tracking** - Better tracking of app revisions
- ❌ **Profanity filter** - Advanced comment moderation
- ❌ **Email notifications** - Notify users of updates, comments, etc.
- ❌ **Room access improvements** - Better handling of private rooms, invited artists, etc.

---

## 📊 COMPLETION STATISTICS

**Core Features:** ~95% Complete
- All essential room/song/voting/comment features working
- Admin dashboard functional
- Mobile responsive

**Cloudflare R2 Integration:** ~85% Complete
- Upload/download working
- Admin controls working
- Missing: Admin UI for upgrade requests, automatic storage tracking

**Enhancement Features:** ~30% Complete
- Feedback system ✅
- Comment reactions ✅
- Artist dashboard ✅
- Missing: Profile pictures, leaderboard, exact-location comments, messaging

**Admin Tools:** ~70% Complete
- User management ✅
- Room management ✅
- Feedback management ✅
- Missing: Storage upgrade requests UI, data usage dashboard, play count tracking

---

## 🎯 PRIORITY RECOMMENDATIONS

### High Priority (Core Functionality)
1. **Storage upgrade request admin UI** - Artists can request upgrades, but admins can't review them
2. **Automatic storage tracking** - Update `storage_used_bytes` when songs are uploaded/deleted
3. **Terms page content** - Legal requirement for uploads

### Medium Priority (User Experience)
4. **Profile pictures** - Makes profiles more engaging
5. **Room name format refinement** - Better readability
6. **Email notifications** - Keep users engaged

### Low Priority (Nice to Have)
7. **Leaderboard system** - Gamification
8. **Exact location comments** - Advanced feature
9. **Messaging system** - Artist-listener communication

---

## 📝 NOTES

- Most core functionality is complete and working
- Cloudflare R2 integration is functional but needs admin UI polish
- Mobile experience has been significantly improved
- Many enhancement features are documented but not yet implemented
- The app is in a usable state for beta testing

