# DAHA Updated v5

This version focuses on a clean empty catalogue, reliable client/server requests, signup cleanup, and mobile spacing.

## Changes

- Fixed the API request helper so JSON request bodies are stringified correctly and are not overwritten before `fetch()`.
- Added clearer backend connection/network error messages in the frontend.
- Signup no longer asks for or submits a mobile number.
- Backend registration no longer expects a phone number.
- Removed hardcoded Men/Women/Kids category artwork and fallback catalogue data from the homepage.
- No demo product catalogue is hardcoded in the frontend. Products render only when returned by the MongoDB-backed API.
- Starter category seeding no longer inserts Unsplash clothing images.
- Added `npm run catalogue:clear-demo` to remove development demo products and clear legacy starter category images without targeting Admin-created products.
- Added `server/.env.example` as the primary backend environment template.
- Added `client/.env.example` for public client configuration.
- Backend environment loading now prefers `server/.env` and keeps a root `.env` fallback for older copies.
- Backend startup now gives clear messages when `MONGODB_URI` or `JWT_SECRET` is missing.
- Removed the mobile top spacer that was incorrectly creating a large blank gap below the header on every page.
- Reserved space for the fixed mobile bottom navigation at the bottom of the layout instead.
- Login, Register, Forgot Password and Reset Password cards now sit close to the header on mobile and remain vertically balanced on desktop.
- Fixed a missing `api` import in the Cart route.

## One-time cleanup for an older database

If an older DAHA version already inserted demo catalogue data, run:

```bash
npm run catalogue:clear-demo
```

This targets development demo products and the old starter category artwork. Admin-created products are not targeted by this cleanup script.

## Environment setup

Copy:

```bash
server/.env.example -> server/.env
client/.env.example -> client/.env
```

Then fill in the real MongoDB Atlas, JWT, Cloudinary, Google and email values as needed.
