# UCme — Stage 1 (foundation) — UNTESTED
1. `npm install`
2. `cp .env.example .env` → set DATABASE_URL (PostgreSQL) and SESSION_SECRET (`openssl rand -base64 32`)
3. `npx prisma migrate dev --name init`
4. `npm run dev` → http://localhost:3000
Demo only: signup checks the UC ID *format*, not an official database. No photo storage is configured yet.
Not built yet (Stage 2+): all other routes in the spec (links in the sidebar will 404 until then).
