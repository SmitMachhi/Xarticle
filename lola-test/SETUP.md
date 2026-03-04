# Lola — How to Run Tests (Step by Step)

This guide takes you from zero to a fully running backend + web app + test suite.
Follow every step in order. Do not skip ahead.

---

## What you need before starting

- A Mac (you already have this)
- A terminal (use the built-in Terminal app or VS Code terminal)
- A browser (Chrome)
- Two Google accounts for testing (even two Gmail accounts you already have work fine)

---

## Part 1 — Install the tools

### 1.1 Install Node.js (if you haven't already)

Go to [https://nodejs.org](https://nodejs.org) and download the LTS version. Install it. That's it.

Verify it worked:

```bash
node --version
# should print v20 or higher
```

### 1.2 Install Wrangler (Cloudflare's CLI)

```bash
npm install -g wrangler
```

Verify:

```bash
wrangler --version
```

### 1.3 Install Supabase CLI

```bash
brew install supabase/tap/supabase
```

If you don't have Homebrew, first run:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 1.4 Install Bruno (replaces Postman)

Go to [https://www.usebruno.com](https://www.usebruno.com) and download the Mac app. Install it like any other app.

### 1.5 Install project dependencies

In your terminal, navigate to this project and run:

```bash
npm install
```

---

## Part 2 — Set up Supabase (your database)

### 2.1 Create a Supabase account and project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up with GitHub or email
3. Click **New project**
4. Fill in:
  - **Name**: `lola-backend` (or whatever you want)
  - **Database password**: something strong — save it somewhere, you'll need it later
  - **Region**: pick the one closest to you
5. Click **Create new project**
6. Wait ~2 minutes for it to spin up (you'll see a loading screen)

### 2.2 Run the database migrations

This creates all the tables Lola needs.

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/sql/001_schema.sql` from this project, copy ALL of its contents, paste into the SQL editor, click **Run**
4. Repeat for each file, **in this exact order**:
  - `supabase/sql/002_rls.sql`
  - `supabase/sql/003_realtime.sql`
  - `supabase/sql/004_score_tracking.sql`
  - `supabase/sql/005_auth_trigger.sql`

Each one should say "Success. No rows returned" when it works.

### 2.3 Create storage buckets

This is where Lola stores conversation transcripts and memory.

1. In Supabase, click **Storage** in the left sidebar
2. Click **New bucket**
  - Name: `lola-transcripts`
  - Public bucket: OFF (leave unchecked)
  - Click Save
3. Create a second bucket the same way:
  - Name: `lola-memory`
  - Public bucket: OFF

### 2.4 Copy your Supabase keys

You'll need these in the next steps.

1. In Supabase, click **Project Settings** (gear icon, bottom left)
2. Click **API** in the settings menu
3. Copy and save these three values somewhere (Notes app is fine):
  - **Project URL** — looks like `https://abcxyz.supabase.co`
  - **anon public key** — long string starting with `eyJ...`
  - **service_role key** — another long string starting with `eyJ...` (keep this secret, never put it in the frontend)

---

## Part 3 — Set up Google Sign-In

### 3.1 Create a Google OAuth app

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
  - Name: `Lola`
  - Click Create
3. Make sure the new project is selected in the dropdown
4. In the search bar at the top, search for **"APIs & Services"** → click it
5. Click **OAuth consent screen** on the left
  - User Type: **External** → click Create
  - App name: `Lola`
  - User support email: your email
  - Developer contact email: your email
  - Click **Save and Continue** through all the steps (you can skip optional fields)
6. Click **Credentials** on the left → **+ Create Credentials** → **OAuth client ID**
  - Application type: **Web application**
  - Name: `Lola Web`
  - Authorized redirect URIs — click **+ Add URI** and add:
  `https://YOUR_SUPABASE_REF.supabase.co/auth/v1/callback`
  (replace `YOUR_SUPABASE_REF` with the part before `.supabase.co` in your Supabase URL)
  - Click Create
7. A popup shows your **Client ID** and **Client Secret** — copy both

### 3.2 Connect Google to Supabase

1. In Supabase → **Authentication** → **Providers**
2. Find **Google** and click to expand it
3. Toggle it ON
4. Paste in your **Client ID** and **Client Secret** from the step above
5. Click Save

### 3.3 Set allowed redirect URLs in Supabase

1. In Supabase → **Authentication** → **URL Configuration**
2. In **Site URL**, enter: `http://localhost:5173`
3. In **Redirect URLs**, click Add URL and add:
  - `http://localhost:5173/auth/callback`
4. Click Save

---

## Part 4 — Set up OpenRouter (Lola's AI brain)

1. Go to [https://openrouter.ai](https://openrouter.ai) and sign up
2. Click your profile → **API Keys** → **Create Key**
3. Name it `lola-dev`, copy the key (starts with `sk-or-...`)
4. Make sure you have credits — add $5 to start (Kimi K2.5 is cheap, ~$0.15 per million tokens)

---

## Part 5 — Configure the backend

### 5.1 Create the local secrets file

This file holds all your secrets for local development. It is NOT committed to git.

In the project root, create a new file called `.dev.vars` (note the dot at the start).

Paste this into it and replace every `REPLACE_ME`:

```
SUPABASE_URL=REPLACE_ME
SUPABASE_ANON_KEY=REPLACE_ME
SUPABASE_SERVICE_ROLE_KEY=REPLACE_ME
OPENROUTER_API_KEY=REPLACE_ME
OPENROUTER_MODEL=moonshot/kimi-k2.5
APNS_KEY_ID=dev
APNS_TEAM_ID=dev
APNS_PRIVATE_KEY=dev
APP_BUNDLE_ID=com.lola.app
REVENUECAT_WEBHOOK_SECRET=test_secret
APP_ENV=development
INVITE_CODE_SALT=any_random_string_you_make_up
AGENT_EVENT_COPY_ENABLED=false
AGENT_REALIZER_ENABLED=false
AGENT_COPY_ENFORCEMENT_ENABLED=false
```

> Note: `APNS_*` keys are set to `dev` placeholder on purpose — the APNs mock is active when `APP_ENV=development`, so no real Apple keys are needed yet.

> Note: `INVITE_CODE_SALT` can be literally any random string — type some random characters. It's used to salt invite codes.

### 5.2 Log in to Cloudflare (one-time)

```bash
wrangler login
```

This opens a browser window. Click Allow. You need a free Cloudflare account — sign up at cloudflare.com if you haven't.

### 5.3 Start the backend

```bash
npm run dev
```

You should see something like:

```
⛅ wrangler 4.x.x
------------------
[mf:inf] Ready on http://localhost:8787
```

### 5.4 Verify it's alive

Open a new terminal tab and run:

```bash
curl http://localhost:8787/health
```

Should return: `{"status":"ok"}` or similar. If it does, your backend is running.

---

## Part 6 — Configure the frontend

### 6.1 Create the frontend env file

In `frontend/web-frontend/`, create a file called `.env`:

```
VITE_SUPABASE_URL=REPLACE_ME
VITE_SUPABASE_ANON_KEY=REPLACE_ME
VITE_API_URL=http://localhost:8787
```

- `VITE_SUPABASE_URL` = your Supabase Project URL (same as above)
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key (same as above)
- `VITE_API_URL` = leave as `http://localhost:8787` (your local backend)

### 6.2 Install frontend dependencies

```bash
cd frontend/web-frontend
npm install
```

### 6.3 Start the frontend

```bash
npm run dev
```

You should see:

```
  VITE v7.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

### 6.4 Open it in Chrome

Go to [http://localhost:5173](http://localhost:5173) in Chrome.

You should see the Lola sign-in screen with a "Continue with Google" button.

---

## Part 7 — Do a quick manual test (before Bruno)

Before running the automated tests, manually verify the core flow works.

**Window 1 (Chrome normal mode) — User 1 / Admin:**

1. Go to [http://localhost:5173](http://localhost:5173)
2. Click "Continue with Google" — sign in with Google Account A
3. You get redirected to `/onboard`
4. Click "Create a household" — type any name like "Test Home" — click Create
5. You land on `/home` — you should see a home score of 50 and a "Ask Lola anything" button
6. Go to Settings (bottom nav, gear icon) — you should see your invite code (8 characters)

**Window 2 (Chrome Incognito mode, Cmd+Shift+N) — User 2 / Member:**

1. Go to [http://localhost:5173](http://localhost:5173)
2. Sign in with Google Account B
3. You get redirected to `/onboard`
4. Click "Join with invite code"
5. Type the invite code from Window 1 — click Join
6. You land on `/home`

**Both windows:**

- Go to `/tasks` in either window — should be empty for now
- Go to `/lola` in Window 1 — type "hi lola" and send
- You should see a streaming response appear word by word

If all of this works, your backend is 100% operational. Move to the automated tests.

---

## Part 8 — Run the automated Bruno tests

### 8.1 Open Bruno

Launch the Bruno app you installed in Step 1.4.

### 8.2 Load the test collection

1. In Bruno, click **Open Collection**
2. Navigate to your project folder → `tests/bruno`
3. Click Open

You should see a list of 20+ requests in the left sidebar.

### 8.3 Set up the environment

1. In Bruno, at the top right, click the environment dropdown (shows "No Environment")
2. Click **Environments** → select `local`
3. Click the edit (pencil) icon next to `local`
4. Fill in the values:
  - `SUPABASE_URL` → your Supabase project URL
  - `SUPABASE_ANON_KEY` → your Supabase anon key
  - `SUPABASE_SERVICE_KEY` → your Supabase **service_role** key
  - `REVENUECAT_WEBHOOK_SECRET` → `test_secret` (must match what's in `.dev.vars`)
  - Leave `TEST_EMAIL_1` and `TEST_EMAIL_2` as is (or change to real emails you can receive)
5. Click Save

### 8.4 About the magic link tests (tests 01-03)

The Bruno tests use email magic links instead of Google OAuth because Google requires a browser. Here's how it works:

1. Run test **01** — it sends a magic link to `TEST_EMAIL_1`'s inbox
2. Check that email inbox — you'll get a "Sign in to Lola" email
3. Copy the 6-digit OTP code from the email
4. Open test **01b** in Bruno, replace `PASTE_OTP_FROM_EMAIL` in the body with that code
5. Run test **01b** — you'll get a JWT back. Bruno saves it automatically.
6. Same process for tests 03 and 03b for User 2's email

> Important: Magic links expire in 10 minutes. Run the verify step quickly after getting the email.

> For this to work, Supabase needs to be able to send email. By default it uses a built-in dev SMTP. You can also use Resend (free tier) — go to Supabase → Authentication → SMTP Settings.

### 8.5 Run all tests in sequence

After getting both JWTs (steps 01-03), run the rest in order:

For each test file (04 through 20):

1. Click on it in the left sidebar
2. Click **Run** (the arrow button)
3. Verify it shows green / 200 status
4. If it fails, check the error message — most failures are missing variables from a previous step

**Test 14 (simulate inactivity)** is a special case. Instead of running it in Bruno, go to your Supabase dashboard:

1. Click **Table Editor** → `households`
2. Find your test household row
3. Click the row to edit it
4. Set `catchup_pending` = `true`
5. Save

Then continue with test 15.

### 8.6 CLI run (all at once, no browser needed)

Once you've verified the magic link flow manually, you can run all tests sequentially from terminal:

```bash
npx @usebruno/cli run tests/bruno/lola --env local
```

This runs all 20 tests in order and prints pass/fail for each.

---

## Part 9 — Test the Supabase edge functions

After the 20 Bruno tests pass, test each cron function manually.

First, link your local project to Supabase:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

(Your project ref is in your Supabase URL: `https://YOUR_REF.supabase.co`)

Then invoke each function:

```bash
supabase functions invoke home-score-calc --no-verify-jwt
supabase functions invoke catchup-detector --no-verify-jwt
supabase functions invoke streak-checker --no-verify-jwt
supabase functions invoke ring-reset --no-verify-jwt
supabase functions invoke weekly-recap --no-verify-jwt
```

Check the output for errors. Then go to your Supabase Table Editor and verify:

- `home-score-calc` → `households.home_score` changed
- `catchup-detector` → should have sent Lola a message (check `lola_messages` table)

---

## Part 10 — Watch what Lola's doing (logs)

In a new terminal tab while the backend is running:

```bash
wrangler tail
```

This shows real-time logs. When you complete a task, you should see:

```
[APNs mock] push skipped in dev: { token: ..., payload: ... }
```

This confirms push notification logic is working — it's just not actually sending to Apple yet (because you don't have the Apple Dev account yet). The log shows exactly what *would* have been sent.

---

## Summary of what you'll have running


| What         | Where                                          | How to start                              |
| ------------ | ---------------------------------------------- | ----------------------------------------- |
| Backend API  | [http://localhost:8787](http://localhost:8787) | `npm run dev` in project root             |
| Web frontend | [http://localhost:5173](http://localhost:5173) | `npm run dev` in `frontend/web-frontend/` |
| Logs         | Terminal                                       | `wrangler tail` in a third tab            |
| Supabase     | Cloud (your project)                           | Already running, nothing to start         |


---

## Common problems

**"Missing environment variable" error when starting backend**
→ Make sure `.dev.vars` exists in the project root with all values filled in.

**Google sign-in shows error or won't redirect back**
→ Double-check the redirect URL in Google Cloud Console matches exactly: `https://YOUR_REF.supabase.co/auth/v1/callback`
→ Also check Supabase → Authentication → URL Configuration has `http://localhost:5173/auth/callback` in the list.

**Magic link email never arrives**
→ Check spam folder. Or in Supabase dashboard → Authentication → Users — you should see the user attempt logged there even if email didn't arrive. Try using a real email provider in Supabase SMTP settings (Resend.com has a free tier, takes 5 minutes to set up).

**"INVITE_NOT_FOUND" when User 2 tries to join**
→ Make sure the invite code is uppercase. The input field auto-uppercases it, but check anyway.

**wrangler dev starts but /health returns an error**
→ Your `.dev.vars` is missing a required variable. The error message will tell you which one. Check all values are filled in (no `REPLACE_ME` remaining).

**Bruno test fails at step 04 or later**
→ Usually means JWT_1 is missing. Go back to step 01b and re-run it. JWTs expire after ~1 hour.

---

## When your Apple Dev account arrives (4 days)

Only then:

1. Go to developer.apple.com → Certificates, IDs & Profiles → Keys → Create Key → enable APNs
2. Download the `.p8` file — copy its entire contents (including the header/footer lines)
3. Update `.dev.vars`: fill in `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY`, `APP_BUNDLE_ID`
4. In `src/lib/apns.ts`, delete lines 17-20 (the 3-line mock block)
5. Restart `npm run dev`

That's it. Pushes will now actually send.