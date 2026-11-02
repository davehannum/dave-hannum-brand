# Connected workout release

Standalone website experience at `/garmin/`. No Vantage services, credentials or data. Live integration is disabled until explicitly configured. Three sample workouts and an illustrative activity remain available without an account.

## Deployment

Node 22, `npm run build`, output `dist`; Vercel serves `api/garmin.mjs` as a Function. `npm test` runs synthetic contract/security tests, not live Garmin acceptance. Homepage links to the experience. Deploy to the redesign preview before promoting production.

Create a dedicated Supabase project for this website; apply `server/garmin-schema.sql` through its SQL editor or migration pipeline. The schema has server-only RLS and service-role grants. It has not been applied automatically. Do not use a Vantage database. Keep service credentials exclusively in Vercel server environment variables.

Set these variables in the intended deployment environment (never in browser JavaScript or git):

- `GARMIN_ENABLED`: leave unset until acceptance testing; set `true` in the isolated test deployment when ready.
- `GARMIN_CLIENT_ID`, `GARMIN_CLIENT_SECRET`: the approved website application.
- `GARMIN_APP_ORIGIN`: canonical HTTPS origin with no path or trailing slash.
- `GARMIN_DATA_URL`, `GARMIN_DATA_SERVICE_KEY`: dedicated project's URL and service-role key.
- `GARMIN_ENCRYPTION_KEY`: base64 encoding of 32 cryptographically random bytes, retained securely for decryption.
- `GARMIN_WEBHOOK_TOKEN`: independently generated random secret, at least 32 bytes.
- `CRON_SECRET`: separate random secret for Vercel's authenticated scheduled worker.

Register the exact callback `<origin>/api/garmin?action=callback` with Garmin. Configure push endpoints for activities, activityDetails, manuallyUpdatedActivities, deregistrations and userPermissionsChange to `<origin>/api/garmin?action=webhook&key=<GARMIN_WEBHOOK_TOKEN>`. Verify Garmin API Tools preserves and sends the configured secret query. Do not expose this URL or its query in logs, screenshots or docs. Confirm platform log access/retention before enabling it. New domain approval may be required.

Enable Workout Import and Activity Export permissions. This release does not request health or courses data. The worker runs daily, and authenticated activity refreshes also process the durable inbox. Expected updates occur after Garmin Connect/device sync, not live streaming. No automatic historical backfill.

## Live acceptance gates

1. Apply schema and verify anon/authenticated roles cannot read tables; service role can invoke the budget RPC.
2. Validate OAuth consent, denial, expired state, callback replay, refresh-token rotation and reconnect on the exact canonical domain.
3. Confirm actual create-workout endpoint `/workoutportal/workout/v2` and schedule endpoint `/training-api/schedule/` against the app's enabled Garmin API version. Payloads follow the supplied Training API V2 2.0 document; no live send has been made.
4. Send each of the three workouts once, confirm the Garmin Connect calendar, then sync a compatible watch and confirm steps. An ambiguous response must not create an automatic duplicate.
5. Complete a short test activity and sync. Verify push receipt, private metrics and samples, Garmin/device attribution, delayed-summary/detail deduplication, notes and cross-session isolation.
6. Test denied activity permission, Garmin-side permission removal/deregistration, local disconnect, sign-out and database failure retries. Disconnect removes local linked records; a revoked token (401) does not prevent local deletion.
7. Confirm cron authorization and retention. Activities are available for 30 days, with expired rows removed on daily cleanup; queue entries are removed after processing or after seven days. Disconnect removes linked records immediately; sanitized encrypted inbox events expire separately.
8. Complete Garmin's required review and branding checks before enabling public connections. Only then promote production and enable live mode.

## Data boundaries

Tokens, activity contents and notes are encrypted with AES-256-GCM. Cookies are Secure, HttpOnly, SameSite=Lax with hashed server-side session IDs. Activity queries derive ownership from the session. POST actions validate Origin plus a custom header. GPS, routes and unrelated fields are stripped before inbox storage. No AI service receives Garmin data. The supplied Garmin license has AI restrictions; any future AI use needs separate clarification and appropriate permission.

## Current status

UI and backend implementation supplied; synthetic tests included. Dedicated database, credentials, Garmin portal registration, real-device delivery, live webhook acceptance and production activation are still required. Samples must never be presented as synced Garmin data.
