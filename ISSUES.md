# Code Review Findings

This list records issues confirmed by inspecting the repository source. It is not a guarantee that every runtime or deployment issue has been found.

## Critical

1. **Unauthenticated password reset permits account takeover**
   - **Files:** `backend/routes/authRouter.js:16`, `backend/controllers/authController.js:124`
   - `POST /api/auth/forgot-password` is public and accepts an email plus a new password. The handler changes the matching account's password without a reset token, email verification, or current-password check.
   - **Impact:** Anyone who knows a user's email can take over that account.
   - **Recommended fix:** Require a short-lived, single-use reset token delivered through a verified channel; do not accept a new password until the token is validated.

## High

2. **Authenticated sockets can subscribe to any business booking room**
   - **File:** `backend/config/socket.js:46`
   - The `join:business` handler joins the requested room without checking that the authenticated user owns or is authorized for that business. The server broadcasts booking reference, customer name, service name, date, time, and status to these rooms (`backend/services/notificationService.js:301`).
   - **Impact:** Any authenticated user can subscribe to another business's booking notifications.
   - **Recommended fix:** Validate business membership/ownership on the server before joining; reject unauthorized room requests.

## Medium

3. **CORS only permits localhost**
   - **File:** `backend/server.js:43`
   - The HTTP API allows only `http://localhost:5173`, even though the project has a `CLIENT_URL` environment setting and Socket.IO uses it separately.
   - **Impact:** A frontend hosted at a different origin cannot call the API from a browser.
   - **Recommended fix:** Configure the allowed HTTP origin from a validated environment setting, with local development behavior documented separately.

4. **Catch-all middleware prevents the standard error handler from handling route errors**
   - **File:** `backend/server.js:84`
   - The middleware after the routes responds to every forwarded error and does not call `next(err)`. Consequently, the later `errorHandler` is bypassed for route errors, including its Mongoose validation, duplicate-key, and JWT status mapping.
   - **Impact:** Errors may return incorrect `500` statuses, and raw internal error messages may be exposed to clients.
   - **Recommended fix:** Handle upload-specific errors explicitly and forward other errors to `errorHandler`; avoid returning internal error messages in production.

5. **Booking availability and uniqueness ignore the selected staff member**
   - **Files:** `backend/services/slotService.js:57`, `backend/models/Booking.js:129`
   - Availability checks consider every active booking for the business, and the unique booking index is keyed by business, date, and start time—not staff. Although bookings store `staffId`, two different staff members cannot be booked at the same start time, and availability is blocked across all staff.
   - **Impact:** If a business expects staff to serve customers in parallel, available capacity is incorrectly reduced and valid bookings are rejected.
   - **Recommended fix:** If bookings are staff-specific, filter availability by the selected staff member and use a uniqueness/overlap strategy that accounts for staff. If the business intentionally has one booking capacity, clarify that constraint in the UI and domain rules.

## Validation note

The requested frontend lint, frontend build, and backend syntax-check commands were not run because execution permission was denied. Findings above are based on direct source inspection.
