# Roadmap

## In progress — audit fixes (highest priority only)
- [ ] P1 Admin leak: no admin wording/links for normal users; route-level admin gate on /admin; new signups never auto-admin
- [ ] P2 Analytics: lesson completion event name matches DB constraint
- [ ] P3 Locked lessons: enforce unlock at completion/progress save, not only UI
- [ ] P4 Auth: "Forgot password?" on sign-in; reset-password handles recovery session events
- [ ] P5 Password change: really verify current password

## Deferred (from audit, not requested now)
- Cloud sync of progress (user_progress unused)
- Admin panels not mounted (Settings/Content/Levels)
- Site settings not applied to public site
- Streak uses UTC date; repeat-lesson "+XP" toast; XP can go negative
- Theme flash, hydration flash, PWA, SEO canonical/og:image
