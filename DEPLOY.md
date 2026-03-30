Deployment Notes for SAS Academy (JWT-based auth)

Overview
- Migrated to a stateless, JWT-like authentication flow to work across Railway dynos.
- Frontend talks to backend via Authorization: Bearer <token> header for protected API routes.
- No in-memory token store; tokens are issued at login and verified on each request.

What changed
- Added server/authjwt.ts with signToken(userId) and verifyToken(token).
- server/routes.ts now uses the new JWT helpers; login returns a token.
- server/index.ts now includes a minimal CORS middleware to allow the frontend to call API endpoints from other origins.
- No changes required for frontend code beyond ensuring it stores the token and sends it in Authorization header.

How to test locally / on Railway
- Start server and log in via the app to obtain a token.
- Use the token to call a protected endpoint, e.g.: POST /api/income-records with header:
  Authorization: Bearer <token>
- Expected: 201 Created (or 200) depending on the endpoint and data.
- Test with an invalid/expired token to ensure 401 Unauthorized is returned.

Notes
- This approach is stateless and scales across multiple dynos, but if you want production-grade JWTs later, we can switch to jsonwebtoken with proper key management.
- If you need to restrict CORS more tightly, specify the allowed origin instead of '*'.
