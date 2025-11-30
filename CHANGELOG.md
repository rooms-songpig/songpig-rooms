# Changelog

All notable changes to Song Pig Listening Rooms will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha] - 2025-11-28

### Added
- Room creation and management system with draft/active/archived/deleted statuses
- Song comparison and A/B testing functionality
- Voting system to determine preferred song versions
- Win rate tracking and statistics
- Comment system with author tooltips showing role and bio
- User authentication with roles: Admin, Artist, Listener
- Guest access for viewing rooms without registration
- Invite code system for room sharing
- Profile management with bio editing
- Admin dashboard for user and room management
- Custom audio player with progress bar and volume controls
- Timezone-aware timestamps (displays in user's local timezone)
- Breadcrumb navigation
- Smart back button with navigation history
- Footer with version info and build date
- About page with feature documentation
- Mobile responsive design
- Toast notification system
- Scroll to top button
- Room status badges and management controls
- Song version 2 checkbox for automatic naming
- Text normalization for room and song titles
- Comment author tooltips with hover/click support

### Changed
- Room names now include artist name automatically
- Guest users auto-switch to Browse Mode (cannot vote)
- Profile save navigates back after successful update
- Invite code and Copy Room Link buttons only active when room status is 'active'
- Comment display: username on left with distinct styling, timestamp with timezone on right

### Fixed
- Room visibility bug - rooms now appear immediately after creation
- Guest mode loading hang - fixed by auto-switching to browse mode
- Audio playback - only one song plays at a time
- Vote state - only one "Prefer This Song" button can be selected
- Comment timestamps now show full date and time with timezone
- Profile page navigation - added breadcrumb and home button
- Double "by Artist" text removed from room display
- Bio display now shows directly below artist name

## [0.1.1-alpha] - 2025-11-30

### Added
- In-app feedback system with `feedback` table, API route, floating feedback button, and admin Feedback & Bug Reports panel
- Comment reactions (Like, Love, Insightful, Fire) with `comment_reactions` table and API, plus threaded replies via `CommentThread` component
- Artist dashboard on the home page showing per-artist stats (rooms, songs, votes, comments) and recent feedback on their songs
- Bulk select and bulk status change tools for rooms, users, and feedback in the admin dashboard
- Dev-only helpers: quick-fill login buttons for admin/artist/listener and configurable deployment banner (dev by default)
- Filters for feedback in admin (by type, status, and priority) with legend tooltip explaining statuses and priorities
- AI-assisted feedback triage endpoint with OpenAI primary + Anthropic fallback providers, plus admin UI controls to request/apply AI suggestions for status and priority

### Changed
- Improved mobile responsiveness across the app (header, compare mode layout, browse songs view, buttons, and spacing) to avoid overlaps and horizontal scrolling
- Admin rooms table now shows artist name instead of ID, with clearer invite code / room link copy controls
- Compare mode now loads and displays comments and replies for both songs, sharing the same comment/reaction system as the browse view
- Toast notifications improved for persistent error display and better copy-to-clipboard details
- Admin feedback cards now show AI provider, cost hint, reasoning, and allow applying or dismissing suggestions inline

### Fixed
- Admin “Copy room link” bug where the invite link did not work correctly
- Artist name not appearing correctly in the admin rooms list
- Various layout issues on iPhone (overlapping elements and sideways scrolling) in rooms and admin screens
- Join page invite-code flow so that `/join?code=...` auto-fills and attempts to join the correct room

[0.1.0-alpha]: https://github.com/yourusername/songpig-rooms/releases/tag/v0.1.0-alpha
[0.1.1-alpha]: https://github.com/yourusername/songpig-rooms/releases/tag/v0.1.1-alpha

