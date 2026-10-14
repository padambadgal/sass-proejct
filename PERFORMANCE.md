# Improving Project Performance

This guide lists practical ways to improve runtime performance and development feedback time in this repository. Prioritize changes using measurements rather than optimizing by intuition.

## Recommended order

### 1. Measure before changing code

- Record API response times and database query durations for dashboard, booking-list, and slot-availability endpoints.
- Use browser DevTools Network and Performance panels to identify slow requests, oversized responses, and expensive rendering.
- Compare representative timings before and after each change.
- Avoid logging customer data, tokens, or other sensitive request details while profiling.

### 2. Keep booking-slot cache correct

`backend/services/slotService.js` caches availability results in Redis for up to two minutes. `backend/config/redis.js` has a `cacheDel` helper, but no current callers invalidate slot results after booking or availability changes.

- Invalidate affected slot keys after a booking is created, cancelled, rescheduled, or changes status, and after availability or service-duration changes.
- Alternatively, keep the short TTL and document that recently changed availability can remain stale briefly.
- Include every input that affects availability in the cache key (for example staff, if availability becomes staff-specific).
- Add a test that changes availability or creates a booking and verifies the next slot lookup reflects the change.

### 3. Limit database work and response sizes

- Keep pagination limits bounded and validate page/limit parameters before using them in `skip()` and `limit()`. Booking list endpoints currently accept query-string limits directly.
- Select only the fields each screen needs; populate only required fields.
- Review query plans with MongoDB `explain("executionStats")` before adding or changing indexes.
- For dashboard totals that scan all historical bookings, measure aggregation cost as data grows. If it becomes a bottleneck, maintain derived totals safely or scope queries to the requested date range.
- Keep compound indexes aligned with actual filters and sorts, and verify their impact on writes as well as reads.

### 4. Reduce dashboard startup requests

`frontend/src/pages/Dashboard/Dashboard.jsx` first fetches businesses, services, staff, and availability, then fetches dashboard metrics in a separate effect.

- Consider returning setup progress together with the overview so the dashboard needs fewer round trips.
- Keep independent requests parallel with `Promise.all`, as the current screen does.
- Avoid fetching full service, staff, or availability records when only a boolean setup indicator is needed.
- Add loading, error, and empty-state handling when changing the request shape.

### 5. Keep images lightweight

- Continue using resized/optimized Cloudinary transformations for uploaded assets.
- Use appropriately sized thumbnails on list and card views; load full-size images only where needed.
- Add lazy loading to below-the-fold image lists and prevent large images from shifting layout by reserving their dimensions.

## Faster development feedback

- Frontend: run `npm run lint` in `frontend` for code checks and `npm run build` for a production build.
- Backend: run `npm run start` in `backend` for the application; add targeted automated tests for controllers and services before broad refactors.
- Validate only the changed area first, then run broader checks before release.
- Avoid repeatedly fetching large datasets during local UI work; use small representative seed data where available.

## Before release

- Verify performance changes with before/after timings and representative data volumes.
- Confirm cache invalidation and booking correctness, not just lower latency.
- Check that indexes are present in the target database; declaring a Mongoose index does not prove that an existing production database has built it.
- Recheck authorization, error behavior, and response shapes whenever combining endpoints or changing cached data.
