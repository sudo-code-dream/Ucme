# UCme hardening checklist

## 1. Rate limits (done in code)
| Action | Limit | Scope |
|---|---|---|
| Sign up | 20 / hour | per network (IP) |
| Sign in | 200 / 15 min | per network (IP), plus the existing 5 failed tries per UC ID |
| Forgot password | 20 / hour | per network (IP), plus 3 / hour per account |
| Submit a report | 10 / hour | per user |
| Submit a claim | 5 / hour | per user |
| Flag a post | 10 / hour | per user |

Network limits are deliberately high because many students share the campus Wi-Fi address. If you see
legitimate users blocked, raise the numbers in the three action files. Old rate-limit rows, login
attempts and used tokens are deleted by the daily job.

## 2. Error tracking (Sentry) - you do this, ~20 minutes
1. Create a free account at sentry.io and a project of type **Next.js**.
2. In your project folder run: `npx @sentry/wizard@latest -i nextjs` and follow the prompts. It installs the
   package and creates the config files for your exact Next.js version. Commit the result.
3. In Vercel add the variables the wizard names (the DSN, and an auth token for readable stack traces). Redeploy.
4. Keep personal data out: leave "send default PII" OFF, and do not attach user emails or UC IDs to events.
5. Add Sentry to the list of service providers in the privacy notice (`src/app/privacy/page.tsx`) and tell
   the Data Protection Officer. Error reports can contain page addresses and request details.
6. In Sentry, create an alert rule that emails you on new issues. Test with a deliberate error on a preview deploy.
Until then, errors are visible in Vercel > your project > Logs (filter: Error).

## 3. Neon backups - check these in the Neon console
- Open your project > Settings and find the **restore window / history retention** for your plan. Plans differ, and the
  free plan's window is short, so confirm the real number on Neon's pricing page and decide if it is enough for office records.
- Test a restore once, using a Neon **branch** from an earlier point in time, before you need it.
- Keep your own copy as well. From a computer with PostgreSQL tools installed (use the DIRECT connection string):
  `pg_dump "$DIRECT_URL" --format=custom --file=ucme-$(date +%F).dump`
  Run it weekly. The file contains personal data: encrypt it, store it somewhere access-controlled, and delete old copies.
- Use a Neon branch (not the live database) when you test risky migrations.

## 4. Next.js upgrade plan (do after the pilot, not during it)
Currently on 14.2.35, the patched release of an older line. Before upgrading, read the current upgrade
guide and support policy at nextjs.org/docs (look for "Upgrading" and the latest major's guide).
1. Make a git branch. Never upgrade on main.
2. Use a Neon branch database and a Vercel preview deployment for testing.
3. Run the official codemod from the guide: `npx @next/codemod@canary upgrade latest`.
4. Expect work in these places (they use APIs that changed in newer versions):
   - `cookies()` and `headers()` (src/lib/session.ts, src/lib/ratelimit.ts)
   - `params` and `searchParams` props in pages (they become promises)
   - `useFormState` (renamed in React 19) in several form components
   - `middleware.ts` (newer versions may rename or change it)
5. Run `npm run build`, then repeat the full test pass (sign up, verify, report, drop-off, claim, return,
   edit/delete, flags, suspension, reset, push, email) on the preview before merging.
6. Keep a rollback ready: Vercel can instantly re-promote the previous deployment.
