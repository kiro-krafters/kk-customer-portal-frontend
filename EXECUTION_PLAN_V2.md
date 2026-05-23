# Execution Plan V2 — Kiro Krafters
## AI-Enabled Contact Center Solution (Amazon Connect)

**Domain:** Insurance Customer Portal
**Team:** Saveen Poonia (Lead), Jaynish Chhabhaiya (DevOps), Darshan Kalathiya (Connect Dev), Bhautik Navdariya (Connect Dev), Himanshu Parmar (Full Stack), Mehul Parmar (Full Stack), Ayush Anghan (Full Stack)
**Time Budget:** 6 hours
**Naming Convention:** `kk_ResourceName_dev`

---

# Project Summary

## Objective
Build a demonstrable AI-enabled Contact Center for an **Insurance company** using Amazon Connect — featuring a public customer chat portal, a single role-aware CCP web app for agents/supervisors/managers, Lex bot automation, Contact Lens analytics, and multilingual routing, all deployable via CI/CD.

## End Users
| Role | App | Description |
|---|---|---|
| Customer | Customer Portal | Insurance policyholders seeking support via chat |
| Agent | Custom CCP App | Handles incoming voice/chat contacts |
| Supervisor | Custom CCP App | Monitors queues, evaluates agents |
| Manager | Custom CCP App | Configures queues, routing, and settings |

---

# How Many Web Apps?

**Answer: 2 web apps.** This is what the project statement requires.

| # | App | Audience | Auth | Hosting |
|---|---|---|---|---|
| 1 | **Customer Portal** (`kk-portal-dev`) | Public customers | None (public) | S3 + CloudFront |
| 2 | **Custom CCP App** (`kk-ccp-dev`) | Agents + Supervisors + Managers | Cognito + Amplify Hosted UI | S3 + CloudFront |

The Custom CCP App shows **different views based on the user's Cognito group** — one app, three role-based experiences.

---

# Authentication Decision

## Chosen: Amazon Cognito + Amplify Hosted UI

### Why Cognito + Amplify Hosted UI

Using Amplify's pre-built Hosted UI means Cognito setup is ~25–30 minutes and gives a clean, professional login page with zero custom auth code. Amplify handles token storage, refresh, and the OAuth redirect flow automatically. Role detection is done from the JWT `cognito:groups` claim — no custom backend needed.

### How It Works

```
User visits kk-ccp-dev URL
        ↓
Amplify checks for valid session (localStorage)
        ↓  (no session)
signInWithRedirect() → redirect to Cognito Hosted UI
        ↓
User logs in at: kk-auth-dev.auth.us-east-1.amazoncognito.com
        ↓
Cognito redirects back to: https://kk-ccp-dev.cloudfront.net/callback
        ↓
Amplify exchanges auth code for tokens (PKCE)
        ↓
fetchAuthSession() → read idToken.payload['cognito:groups']
        ↓
  ['kk_agents_dev']      →  Agent View
  ['kk_supervisors_dev'] →  Supervisor View
  ['kk_managers_dev']    →  Manager View
```

### AWS Resources Required (all in CloudFormation)

| Resource | Name |
|---|---|
| Cognito User Pool | `kk_userpool_dev` |
| User Pool Groups | `kk_agents_dev`, `kk_supervisors_dev`, `kk_managers_dev` |
| App Client (no secret, SPA) | `kk_appclient_dev` |
| Cognito Domain (Hosted UI) | `kk-auth-dev.auth.us-east-1.amazoncognito.com` |

### Test Users (created by Jaynish)

| Username | Password | Group | Role in App |
|---|---|---|---|
| `agent1@demo.com` | `Demo@1234` | `kk_agents_dev` | Agent View |
| `super1@demo.com` | `Demo@1234` | `kk_supervisors_dev` | Supervisor View |
| `manager1@demo.com` | `Demo@1234` | `kk_managers_dev` | Manager View |

### Code — Amplify Config (`src/amplify-config.js`)

```js
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [import.meta.env.VITE_REDIRECT_SIGN_IN],
          redirectSignOut: [import.meta.env.VITE_REDIRECT_SIGN_OUT],
          responseType: 'code',   // PKCE — no client secret needed
        }
      }
    }
  }
});
```

### Code — Role Detection (`src/hooks/useRole.js`)

```js
import { fetchAuthSession } from 'aws-amplify/auth';

export async function getUserRole() {
  const session = await fetchAuthSession();
  const groups = session.tokens?.idToken?.payload?.['cognito:groups'] ?? [];
  if (groups.includes('kk_managers_dev'))    return 'manager';
  if (groups.includes('kk_supervisors_dev')) return 'supervisor';
  if (groups.includes('kk_agents_dev'))      return 'agent';
  return null; // not assigned — show error
}
```

### Code — Protected Route (`src/App.jsx` sketch)

```jsx
import { signInWithRedirect, signOut } from 'aws-amplify/auth';

function App() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserRole()
      .then(setRole)
      .catch(() => signInWithRedirect())   // no session → go to Hosted UI
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (role === 'agent')      return <AgentView />;
  if (role === 'supervisor') return <SupervisorView />;
  if (role === 'manager')    return <ManagerView />;
  return <UnauthorizedPage />;
}
```

### Hosted UI Callback URL Setup
- Add to Cognito App Client **Allowed callback URLs**: `https://kk-ccp-dev.cloudfront.net/callback`
- Add to **Allowed sign-out URLs**: `https://kk-ccp-dev.cloudfront.net/`
- Also add `http://localhost:5173/callback` for local dev

### Connect Metrics API Authentication
After Cognito login, use the Cognito Identity Pool (or a Lambda proxy) to call Connect APIs with IAM credentials:
- Attach an IAM policy with `connect:GetCurrentMetricData`, `connect:GetCurrentUserData`, `connect:UpdateQueueHoursOfOperation` to the Cognito authenticated role
- In React, use `fetchAuthSession()` to get temporary AWS credentials via Amplify, then pass them to the AWS SDK

### Setup Time Estimate
| Step | Owner | Time |
|---|---|---|
| CloudFormation: User Pool + Groups + App Client + Domain | Jaynish | 20 min |
| Create test users + assign to groups | Jaynish | 5 min |
| Add Amplify package + config to CCP app | Mehul | 10 min |
| Wire `signInWithRedirect` + role detection | Mehul | 15 min |
| **Total** | | **~50 min** |

---

# Application Breakdown

## App 1 — Customer Portal (`kk-portal-dev`)

**Purpose:** Public-facing insurance portal. Customers can browse plans, read about coverage, and start a live chat or request a callback.

**Pages / Routes:**
| Route | Page | Description |
|---|---|---|
| `/` | Home | Hero, features, quick-access links |
| `/claims` | Claims | Stub: file a claim CTA, chat widget |
| `/policy` | Policy Info | Stub: policy details CTA, chat widget |

**Key Components:**
- Insurance-themed header (logo, nav, login link)
- Hero section with CTA buttons
- Feature highlights (AI bot, voice/chat, multilingual, callback)
- Coverage plan cards
- **Floating chat button** (bottom-right) → opens pre-chat form → Amazon Connect Chat Widget
- Pre-chat form collects: `customerName`, `policyNumber`, `topic` → passed as contact attributes
- Footer

**No authentication.** Public access only.

**Connect Integration:**
- Embed the Amazon Connect Chat Widget JS snippet
- Point it to `kk_chatflow_dev` contact flow
- Pass pre-chat form fields as contact attributes

---

## App 2 — Custom CCP App (`kk-ccp-dev`)

**Purpose:** Role-aware web app for all internal users. One URL, one login — three different experiences rendered based on Connect security profile.

### Login Flow
```
/ → Amplify checks session → no session → signInWithRedirect()
  → Cognito Hosted UI (kk-auth-dev.auth.us-east-1.amazoncognito.com)
  → User logs in → redirect to /callback
  → Amplify exchanges code → stores tokens
  → getUserRole() reads cognito:groups from JWT
  → render Agent / Supervisor / Manager view
```
- No custom login form to build — Cognito Hosted UI provides the login page
- Amplify handles PKCE, token storage, and refresh automatically
- On success, read `cognito:groups` from the ID token and render the correct view

### Role-Based Views

#### Agent View (`/agent`)
Visible to: `kk_sp_agent_dev`

| Section | Content |
|---|---|
| Left sidebar | Agent name, status selector (Available / Break / Lunch / Offline), today's stats (contacts handled, CSAT, handle time), assigned queues |
| Main panel | Active contact: customer name, policy number, queue, channel (chat/voice), live timer |
| Chat panel | Full chat transcript, message input, send button |
| Right panel | 6 contact controls (Accept, End, Hold/Resume, Transfer, Mute, Add Note), Quick Connect transfer dropdown, Contact Lens sentiment score |
| Bottom | Contact history for this customer (last 3 interactions) |

#### Supervisor View (`/supervisor`)
Visible to: `kk_sp_supervisor_dev`
Includes everything in Agent View PLUS:

| Section | Content |
|---|---|
| Dashboard tab | Real-time metric cards: Contacts in Queue, Agents Available, Oldest Contact Age, Service Level % — refreshed every 30s via `GetCurrentMetricData` |
| Agents tab | Live agent status table: name, status, current queue, handle time, contacts today, CSAT — data from `GetCurrentUserData` |
| Contact Lens tab | Sentiment distribution, transcript viewer link, flagged contacts |
| Alerts panel | SLA warnings, queue threshold alerts |

#### Manager View (`/manager`)
Visible to: `kk_sp_manager_dev`
Includes everything in Supervisor View PLUS:

| Section | Content |
|---|---|
| Queue Config | Toggle queue open/closed (`UpdateQueueHoursOfOperation`), view queue stats |
| Routing Profiles | Assign agents to routing profiles, adjust queue priorities |
| Agent Skills | Set proficiency levels (1–5) for `InsuranceClaims` skill |
| Lex Bot | View bot intents, hit counts per locale (EN / ES) |
| Contact Lens Settings | Enable/disable analytics per flow |

---

# Technical Architecture

## High-Level Diagram

```
CUSTOMER BROWSER                    AGENT / SUPERVISOR / MANAGER BROWSER
        |                                           |
        v                                           v
[React: kk-portal-dev]               [React: kk-ccp-dev]
[Connect Chat Widget SDK]            [Connect Streams SDK]
        |                                 |        |
        |                          (hidden iframe) (Connect APIs)
        +----------------+-----------------+        |
                         |                          |
               [Amazon Connect: kk-connect-dev]     |
                         |                          |
          +--------------+-----------+              |
          |              |           |              |
     [Lex Bot]    [Contact Lens]  [CloudWatch] <----+
   kk_lexbot_dev      |               |
          |        [S3 Logs]    [Connect Metrics API]
     [Lambda]
  kk_fn_callback_dev
```

## Component Registry

| Component | AWS Service | Resource Name |
|---|---|---|
| Connect Instance | Amazon Connect | `kk-connect-dev` |
| Customer Portal | S3 + CloudFront | `kk-portal-dev` |
| CCP Web App | S3 + CloudFront | `kk-ccp-dev` |
| Cognito User Pool | Amazon Cognito | `kk_userpool_dev` |
| Cognito App Client | Amazon Cognito | `kk_appclient_dev` |
| Cognito Hosted UI Domain | Amazon Cognito | `kk-auth-dev.auth.us-east-1.amazoncognito.com` |
| Cognito Group — Agents | Amazon Cognito | `kk_agents_dev` |
| Cognito Group — Supervisors | Amazon Cognito | `kk_supervisors_dev` |
| Cognito Group — Managers | Amazon Cognito | `kk_managers_dev` |
| Lex Bot | Amazon Lex v2 | `kk_lexbot_dev` |
| Chat Contact Flow | Connect Flow | `kk_chatflow_dev` |
| Voice Contact Flow | Connect Flow | `kk_voiceflow_dev` |
| Callback Flow | Connect Flow | `kk_callbackflow_dev` |
| General Queue | Connect Queue | `kk_queue_general_dev` |
| Claims Queue | Connect Queue | `kk_queue_claims_dev` |
| Agent Routing Profile | Connect | `kk_rp_agent_dev` |
| Supervisor Routing Profile | Connect | `kk_rp_supervisor_dev` |
| Agent Security Profile | Connect | `kk_sp_agent_dev` |
| Supervisor Security Profile | Connect | `kk_sp_supervisor_dev` |
| Manager Security Profile | Connect | `kk_sp_manager_dev` |
| Callback Lambda | AWS Lambda | `kk_fn_callback_dev` |
| IaC Stack | CloudFormation | `kk_stack_dev` |
| CI/CD Pipeline | GitHub Actions | `kk-deploy-dev` |

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS | Fast scaffold, component reuse |
| Auth | Amazon Cognito + Amplify Hosted UI | Clean login UI, no custom auth code, PKCE out-of-box |
| Role Detection | Cognito Groups → JWT `cognito:groups` claim | Simple, no backend lookup needed |
| CCP Embed | Amazon Connect Streams SDK | Official SDK for softphone + contact events |
| Chat Widget | Amazon Connect Chat Widget JS | Official hosted widget, zero backend |
| IaC | AWS CloudFormation (YAML) | Native, no extra tooling |
| CI/CD | GitHub Actions | Free, integrates with S3 |
| Hosting | S3 + CloudFront | Serverless, fast |
| Backend | AWS Lambda (Python 3.12) | Callback flow only |
| Bot | Amazon Lex v2 (EN + ES) | Built into Connect |
| Metrics | Connect Metrics API + CloudWatch | Native, no extra cost |

---

# Requirement Coverage

| ID | Requirement | App | Status |
|---|---|---|---|
| R01 | Customer portal with chat widget | Portal | ✅ In Scope |
| R02 | Custom CCP web app (agent view) | CCP App | ✅ In Scope |
| R03 | Reporting & dashboard (supervisor) | CCP App | ✅ In Scope |
| R04 | Configurable settings (manager) | CCP App | ✅ In Scope |
| R05 | Voice channel | Connect | ✅ In Scope |
| R06 | Chat channel | Connect + Portal | ✅ In Scope |
| R07 | Callback functionality | Connect + Lambda | ✅ In Scope |
| R08 | Voicemail | Connect | ⚠️ Stub only |
| R09 | AI / Lex Bot (2+ intents) | Connect | ✅ In Scope |
| R10 | Multilingual (EN + ES) | Connect + Lex | ✅ In Scope |
| R11 | Role-based access (Agent/Super/Mgr) | CCP App | ✅ In Scope |
| R12 | Agent evaluation & monitoring | Connect + CCP | ✅ In Scope |
| R13 | Quick Connect configurations | Connect | ✅ In Scope |
| R14 | Proficiency-based routing | Connect | ✅ In Scope |
| R15 | Queue-based routing | Connect | ✅ In Scope |
| R16 | Contact Lens integration | Connect | ✅ In Scope |
| R17 | Outbound campaigns | — | ⚠️ Doc only |
| R18 | CI/CD pipeline | GitHub Actions | ✅ In Scope |
| R19 | IaC | CloudFormation | ✅ In Scope |
| R20 | QA test cases | Docs | ✅ In Scope |
| R21 | User guide / documentation | Docs | ✅ In Scope |

---

# Work Distribution

## Stream A — DevOps & Infrastructure (Jaynish)

**Tasks:**
1. Create GitHub repo `kiro-krafters/kk-contact-center`, monorepo: `/portal`, `/ccp`, `/infra`
2. GitHub Actions workflow: lint → build → `aws s3 sync` → CloudFront invalidate
3. CloudFormation stack `kk_stack_dev`:
   - S3 buckets + CloudFront for `kk-portal-dev` and `kk-ccp-dev`
   - Cognito User Pool `kk_userpool_dev` with password policy
   - Cognito Groups: `kk_agents_dev`, `kk_supervisors_dev`, `kk_managers_dev`
   - Cognito App Client `kk_appclient_dev` (no secret, PKCE, SPA)
   - Cognito Domain: `kk-auth-dev` (prefix → Hosted UI URL)
   - App Client callback URL: `https://<kk-ccp-dev-cloudfront>/callback`
   - App Client sign-out URL: `https://<kk-ccp-dev-cloudfront>/`
   - Also add `http://localhost:5173/callback` for local dev
4. Create test users via AWS CLI after stack deploys:
   ```bash
   aws cognito-idp admin-create-user --user-pool-id <ID> --username agent1@demo.com --temporary-password Demo@1234
   aws cognito-idp admin-add-user-to-group --user-pool-id <ID> --username agent1@demo.com --group-name kk_agents_dev
   # repeat for super1@demo.com → kk_supervisors_dev
   # repeat for manager1@demo.com → kk_managers_dev
   ```
5. Output `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID`, `VITE_COGNITO_DOMAIN` as CloudFormation outputs → store as GitHub Secrets for CI/CD

**Deliverables:** Repo + CI/CD pipeline + 2 CloudFront URLs + Cognito pool with 3 test users
**Time:** Hours 0–2

---

## Stream B — Amazon Connect Setup (Darshan)

**Tasks:**
1. Create Connect instance `kk-connect-dev`, enable voice + chat + Contact Lens
2. Claim US phone number
3. Create queues: `kk_queue_general_dev`, `kk_queue_claims_dev`
4. Create routing profiles: `kk_rp_agent_dev`, `kk_rp_supervisor_dev`
5. Create security profiles: `kk_sp_agent_dev`, `kk_sp_supervisor_dev`, `kk_sp_manager_dev`
6. Create Connect users: `agent1`, `super1`, `manager1` — assign profiles
7. Add proficiency skill `InsuranceClaims` (levels 1–5), assign level 4 to `agent1`
8. Add `kk-ccp-dev` CloudFront URL to **Approved Origins**
9. Enable Contact Lens + create evaluation form `kk_evalform_dev`
10. Configure Quick Connects: `kk_qc_claims_dev`, `kk_qc_general_dev`

**Deliverables:** Fully configured Connect instance
**Time:** Hours 0–2.5

---

## Stream C — Lex Bot & Contact Flows (Bhautik)

**Tasks:**
1. Create Lex v2 bot `kk_lexbot_dev`, locales: `en_US`, `es_US`
2. Build intents: `ClaimStatus` (EN+ES), `PolicyInfo` (EN+ES), `FallbackIntent`
3. Publish bot alias `kk_lexalias_dev`
4. Create Chat Flow `kk_chatflow_dev`: Contact Lens → Lex → queue
5. Create Voice Flow `kk_voiceflow_dev`: IVR prompt → branch → Lex → proficiency queue
6. Create Callback Flow `kk_callbackflow_dev`: queue check → offer callback → invoke Lambda
7. Deploy Callback Lambda `kk_fn_callback_dev` (Python, calls `start_outbound_voice_contact`)
8. Assign flows to phone number and chat channel
9. Configure multilingual: detect locale attribute → route to ES Lex bot

**Deliverables:** Working bot + all 3 flows published
**Time:** Hours 0–3

---

## Stream D — Customer Portal (Himanshu)

**Tasks:**
1. Scaffold: `npm create vite@latest portal -- --template react`, install Tailwind
2. Pages: `HomePage`, `ClaimsPage` (stub), `PolicyPage` (stub)
3. Insurance-themed header, hero, feature grid, plans section, footer
4. Floating chat button → pre-chat form (name, policy number, topic)
5. Embed Amazon Connect Chat Widget script, wire to `kk_chatflow_dev`
6. Pass pre-chat fields as contact attributes
7. Add CORS origin in Connect (portal CloudFront URL)
8. Deploy via CI/CD to `kk-portal-dev` CloudFront

**Deliverables:** Live portal with working chat widget
**Time:** Hours 0.5–4

---

## Stream E — Custom CCP App (Mehul + Ayush)

### Mehul — Core CCP + Agent View
**Tasks:**
1. Scaffold: `npm create vite@latest ccp -- --template react`, install Tailwind + `amazon-connect-streams` + `aws-amplify`
2. Create `src/amplify-config.js` — configure Amplify with User Pool ID, Client ID, Cognito Domain, callback URLs from `.env`
3. In `main.jsx`: import and run `amplify-config.js` before rendering app
4. Root route `/`: call `fetchAuthSession()` → if no session, call `signInWithRedirect()` → redirects to Cognito Hosted UI
5. Callback route `/callback`: Amplify handles token exchange automatically (just render a spinner)
6. After auth: call `getUserRole()` → read `cognito:groups` from JWT → route to correct view
7. **Agent View:**
   - Sidebar: status selector, queue stats, quick connects
   - Contact panel: customer name/policy/queue, live timer, chat transcript, message input
   - Controls: Accept, End, Hold, Transfer, Mute, Notes
   - Transfer dropdown (Quick Connects)
   - Contact Lens sentiment display

### Ayush — Supervisor + Manager Views
**Tasks:**
1. **Supervisor View** (extends Agent View with extra tabs):
   - Real-time metrics tab: call `GetCurrentMetricData` every 30s for both queues
   - Metric cards: Contacts in Queue, Agents Available, Oldest Contact, Service Level
   - Agent status table: `GetCurrentUserData` → name, status, queue, duration, CSAT
   - Contact Lens tab: sentiment distribution, link to transcripts
   - Alerts panel: SLA warnings, queue threshold breaches
2. **Manager View** (extends Supervisor View with config tabs):
   - Queue toggle: `UpdateQueueHoursOfOperation` (open/close)
   - Routing profile assignment: change agent routing profile via Connect API
   - Proficiency level editor (1–5 per agent per skill)
   - Lex bot intent overview (read-only stats)
   - Contact Lens settings toggles
3. Deploy both views via CI/CD to `kk-ccp-dev` CloudFront

**Deliverables:** CCP app live with all 3 role views working
**Time:** Hours 0.5–5

---

## Stream F — QA, Docs & Demo Prep (Saveen)

**Tasks:**
1. Write `QA_TEST_CASES.md` (15+ test cases covering all features)
2. Write `USER_GUIDE.md` (Customer, Agent, Supervisor, Manager sections)
3. Write `ARCHITECTURE.md` with diagram
4. Write `DEPLOYMENT.md` with step-by-step deploy instructions
5. Prepare 5-minute demo script
6. Prepare architecture diagram (draw.io or ASCII)
7. Demo rehearsal at Hour 5.5

**Time:** Hours 0–6 (continuous)

---

# 6-Hour Execution Timeline

| Time | Owner | Task | Output |
|---|---|---|---|
| 0:00–0:15 | All | Kickoff: assign tasks, share AWS creds, create GitHub repo | Repo live |
| 0:15–0:45 | Jaynish | S3 + CloudFront + Cognito User Pool + Groups + App Client CFN stack | 2 CloudFront URLs + Cognito pool |
| 0:15–0:45 | Darshan | Create Connect instance, claim phone number | Instance active |
| 0:15–0:45 | Bhautik | Build Lex bot intents (EN + ES) | Bot draft ready |
| 0:15–0:45 | Himanshu | Scaffold Customer Portal | Local dev running |
| 0:15–0:45 | Mehul | Scaffold CCP app + Streams SDK init | Local dev running |
| 0:15–0:45 | Ayush | Scaffold Supervisor + Manager view shells | View routing working |
| 0:15–0:45 | Saveen | QA test cases + demo script outline | Draft docs |
| 0:45–1:30 | Darshan | Queues, routing profiles, security profiles, users, approved origins | Connect fully configured |
| 0:45–1:30 | Bhautik | Voice + chat + callback contact flows | Flows published |
| 0:45–1:30 | Jaynish | GitHub Actions CI/CD YAML | Pipeline green |
| 0:45–1:30 | Himanshu | Landing page UI + pre-chat form | Portal UI done |
| 0:45–1:30 | Mehul | Amplify config + signInWithRedirect + cognito:groups role routing | Cognito login + role routing works |
| 0:45–1:30 | Ayush | Connect Metrics API call + metric cards | Live metrics display |
| 1:30–2:30 | Darshan | Contact Lens on, evaluation form, proficiency skills | Contact Lens active |
| 1:30–2:30 | Bhautik | Callback Lambda deploy + test | Lambda invokable |
| 1:30–2:30 | Himanshu | Embed chat widget + CORS config | Widget loads |
| 1:30–2:30 | Mehul | Agent contact controls (Accept/Hold/End/Transfer) | Controls working |
| 1:30–2:30 | Ayush | Agent status table + Contact Lens panel | Supervisor view done |
| 2:30–3:30 | Himanshu | Deploy portal via CI/CD | Portal live on HTTPS |
| 2:30–3:30 | Mehul | Deploy CCP app via CI/CD | CCP live on HTTPS |
| 2:30–3:30 | Ayush | Manager config (queue toggle + routing assignment) | Manager view done |
| 2:30–3:30 | Darshan | Proficiency routing E2E test | Routing verified |
| 2:30–3:30 | Bhautik | Lex bot EN + ES testing in flows | Bot verified |
| 2:30–3:30 | Jaynish | IaC CFN YAML + CloudFormation docs | Stack YAML pushed |
| 3:30–4:30 | All Dev | Full chat E2E: customer → bot → agent accept | Chat E2E working |
| 3:30–4:30 | Saveen | Architecture diagram + presentation slide | Diagram done |
| 4:30–5:30 | All Dev | Voice E2E: PSTN → IVR → queue → agent, callback test | Voice E2E working |
| 4:30–5:30 | Saveen | Complete USER_GUIDE.md + QA evidence | Docs complete |
| 5:30–6:00 | All | Demo rehearsal, freeze env, confirm all URLs + credentials | Demo-ready ✅ |

---

# Critical Path

```
[Connect Instance]
    → [Queues + Security Profiles + Users]     ← needed for Streams SDK auth
    → [Streams SDK auth → role routing]
    → [Agent / Supervisor / Manager Views]
    → [Integration Testing]

[Lex Bot]
    → [Contact Flows]
    → [Chat Widget wired to flow]
    → [Integration Testing]

[S3 + CloudFront]
    → [CI/CD Pipeline]
    → [Portal Deploy]
    → [CCP Deploy]
    → [CORS + Approved Origins config]
```

**Absolute hard blocker:** Cognito User Pool + test users must exist before CCP login can be tested. CloudFront URL must be known before Cognito App Client callback URLs can be configured.

---

# Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Cognito callback URL mismatch | High | Jaynish adds both CloudFront URL and `localhost:5173` to App Client callback list at stack creation |
| Cognito domain already taken | Low | Use unique prefix `kk-auth-dev-<account-id>` if `kk-auth-dev` is taken |
| `cognito:groups` claim missing from token | Medium | Confirm user is added to a group before testing; check in JWT debugger |
| Connect Approved Origins not set | High | Darshan adds CCP CloudFront URL to Connect Approved Origins as soon as URL is known (Hour 1) |
| Connect Metrics API 403 error | Medium | Attach `connect:GetCurrentMetricData`, `connect:GetCurrentUserData` to Cognito authenticated IAM role |
| Chat widget CORS rejection | High | Add `*` wildcard temporarily during demo; tighten post-demo |
| Lex bot not responding | Medium | Add hardcoded fallback response in contact flow |
| Outbound campaigns not enabled | High | Document architecture only; skip live demo |
| Voicemail not implemented | Low | Stub page with architecture note; not required for pass |

---

# Demo Script (5 Minutes)

| Step | Who | What |
|---|---|---|
| 1 | Presenter | Open Customer Portal → hero page → click "Start a Chat" |
| 2 | Presenter | Fill pre-chat form (name, policy number, topic=Claims) → start chat |
| 3 | Presenter | Type "check my claim" → Lex bot responds with ClaimStatus intent |
| 4 | Presenter | Type "agent" → bot transfers to `kk_queue_claims_dev` |
| 5 | Agent tab | Open CCP app → auto-redirect to Cognito Hosted UI → log in as `agent1@demo.com` → Agent View loads → see incoming chat → Accept |
| 6 | Agent tab | Exchange messages with customer → show contact attributes, sentiment |
| 7 | Agent tab | End contact |
| 8 | Super tab | Log in as `super1@demo.com` → Cognito Hosted UI → Supervisor view loads → show live queue metrics |
| 9 | Super tab | Show agent status table, Contact Lens sentiment, alerts |
| 10 | Manager tab | Log in as `manager1@demo.com` → Manager view loads → toggle Claims queue closed → toggle back |
| 11 | Presenter | Show CI/CD pipeline green in GitHub Actions |
| 12 | Presenter | Call voice number → IVR menu → press 1 → agent answers |

---

# Final Demo Checklist

## Must Work
- [ ] Customer opens portal and starts a chat
- [ ] Lex bot responds with ClaimStatus or PolicyInfo
- [ ] Customer transferred to queue when typing "agent"
- [ ] Agent logs in via Cognito Hosted UI → redirected back to Agent View
- [ ] Agent accepts chat, exchanges messages, ends contact
- [ ] Supervisor view shows live queue metrics (auto-refresh)
- [ ] Manager can toggle queue open/closed
- [ ] Voice call reaches Connect IVR
- [ ] Contact Lens transcript visible after a call
- [ ] CI/CD pipeline is green

## Optional (If Time Allows)
- [ ] Spanish Lex bot responding to ES utterances
- [ ] Callback flow demonstrated live
- [ ] Proficiency routing with 2 agents at different skill levels
- [ ] Agent evaluation form filled post-call

## Known Limitations to State in Demo
- Voicemail: architecture designed, not implemented (Lambda + S3 pipeline)
- Outbound campaigns: not live (requires account-level feature enablement by AWS)
- Production environment: IaC ready, `_prod` not deployed within contest window
- QA: manual test cases only, no automated test suite

---

# Task Board

---

**[TASK-001]**
**Title:** GitHub Repository Setup & CI/CD Pipeline
**Owner:** Jaynish Chhabhaiya
**Estimate:** 45 minutes
**Steps:**
1. Create GitHub org repo `kiro-krafters/kk-contact-center`
2. Create branches: `main`, `dev`, `feature/*` — document branch strategy in `CONTRIBUTING.md`
3. Create monorepo structure:
   ```
   /portal        ← Customer Portal (React app)
   /ccp           ← Custom CCP App (React app)
   /infra         ← CloudFormation YAML, Lambda code
   /docs          ← QA, user guide, architecture
   ```
4. Write GitHub Actions workflow `.github/workflows/deploy-dev.yml`:
   - Trigger: push to `dev` branch
   - Jobs: install → lint → build (both apps) → `aws s3 sync` → CloudFront invalidate
   - Use `working-directory` per app to run separate builds
5. Store secrets in GitHub: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `PORTAL_CLOUDFRONT_ID`, `CCP_CLOUDFRONT_ID`
6. Store Cognito env vars as GitHub Secrets: `VITE_USER_POOL_ID`, `VITE_USER_POOL_CLIENT_ID`, `VITE_COGNITO_DOMAIN`, `VITE_REDIRECT_SIGN_IN`, `VITE_REDIRECT_SIGN_OUT`
7. Test pipeline with dummy `index.html` in each app folder — confirm files appear on S3
**Definition of Done:** Push to `dev` triggers pipeline; both portal and CCP files appear on their respective S3/CloudFront URLs with no errors.

---

**[TASK-002]**
**Title:** AWS Foundation Stack — S3, CloudFront, Cognito
**Owner:** Jaynish Chhabhaiya
**Estimate:** 50 minutes
**Steps:**
1. Write CloudFormation YAML `infra/kk_stack_dev.yml` with the following resources:
2. **S3 Buckets** (static website hosting, block public access, OAC policy):
   - `kk-portal-dev-<account-id>` — Customer Portal
   - `kk-ccp-dev-<account-id>` — CCP App
3. **CloudFront Distributions** (OAC → S3, HTTPS only, default root object `index.html`, custom error 403/404 → `/index.html` for SPA routing):
   - `kk-portal-dev` distribution
   - `kk-ccp-dev` distribution
4. **Cognito User Pool** `kk_userpool_dev`:
   - Password policy: min 8 chars, uppercase, lowercase, number
   - MFA: OFF (speed)
   - Auto-verified attributes: email
   - Username: email
5. **Cognito User Pool Groups**: `kk_agents_dev`, `kk_supervisors_dev`, `kk_managers_dev`
6. **Cognito App Client** `kk_appclient_dev`:
   - No client secret (SPA / PKCE)
   - Auth flows: `ALLOW_USER_SRP_AUTH`, `ALLOW_REFRESH_TOKEN_AUTH`
   - OAuth grant: Authorization Code + PKCE
   - Scopes: `openid`, `email`, `profile`
   - Callback URLs: `https://<kk-ccp-dev-cloudfront>/callback`, `http://localhost:5173/callback`
   - Sign-out URLs: `https://<kk-ccp-dev-cloudfront>/`, `http://localhost:5173/`
7. **Cognito Domain**: `kk-auth-dev` (becomes `kk-auth-dev.auth.<region>.amazoncognito.com`)
8. Deploy: `aws cloudformation deploy --stack-name kk_stack_dev --template-file infra/kk_stack_dev.yml --capabilities CAPABILITY_IAM`
9. Note all outputs and share with team: Portal CloudFront URL, CCP CloudFront URL, User Pool ID, App Client ID, Cognito Domain
10. Create test users via CLI:
    ```bash
    for user in "agent1@demo.com:kk_agents_dev" "super1@demo.com:kk_supervisors_dev" "manager1@demo.com:kk_managers_dev"; do
      email=$(echo $user | cut -d: -f1)
      group=$(echo $user | cut -d: -f2)
      aws cognito-idp admin-create-user --user-pool-id $POOL_ID --username $email \
        --temporary-password "Temp@1234" --message-action SUPPRESS
      aws cognito-idp admin-set-user-password --user-pool-id $POOL_ID \
        --username $email --password "Demo@1234" --permanent
      aws cognito-idp admin-add-user-to-group --user-pool-id $POOL_ID \
        --username $email --group-name $group
    done
    ```
**Definition of Done:** Both CloudFront URLs return 200, Cognito Hosted UI loads at `kk-auth-dev.auth.<region>.amazoncognito.com/login`, all 3 test users can log in.

---

**[TASK-003]**
**Title:** Amazon Connect Instance Setup
**Owner:** Darshan Kalathiya
**Estimate:** 30 minutes
**Steps:**
1. In AWS Console → Amazon Connect → Create instance
   - Identity management: **Connect-managed** (fastest option)
   - Instance alias: `kk-connect-dev`
   - Enable inbound/outbound calling: YES
   - Enable contact lens: YES
2. Claim a US DID phone number (toll-free or local) — note the number
3. Enable chat channel: Instance Settings → Chat → Enable
4. Enable Amazon Contact Lens: Instance Settings → Data Storage → enable Contact Lens
5. Note the **Instance ARN** and **Instance ID** — share with team immediately (needed for all API calls and flow configs)
6. Add CCP CloudFront URL to **Approved Origins**: Instance Settings → Approved Origins → add `https://<kk-ccp-dev-cloudfront>`
   - Also add `http://localhost:5173` for local dev
**Definition of Done:** Instance status is "Active", phone number is claimed, Contact Lens is enabled, Approved Origins include the CCP CloudFront URL.

---

**[TASK-004]**
**Title:** Connect Queues, Routing Profiles, Security Profiles & Users
**Owner:** Darshan Kalathiya
**Estimate:** 50 minutes
**Steps:**
1. **Hours of Operation**: Create `kk_hours_dev` — 24/7 all days
2. **Queues**:
   - `kk_queue_general_dev` — Hours: `kk_hours_dev`, outbound caller ID = claimed number
   - `kk_queue_claims_dev` — Hours: `kk_hours_dev`, outbound caller ID = claimed number
3. **Routing Profiles**:
   - `kk_rp_agent_dev` — Channels: Voice + Chat (concurrency: voice 1, chat 2). Queues: Claims (priority 1), General (priority 2)
   - `kk_rp_supervisor_dev` — Channels: Voice + Chat. Queues: both, can monitor/barge
4. **Security Profiles**:
   - `kk_sp_agent_dev` — Permissions: Contact Control (answer, hold, end, transfer), Chat, Voice, Contact attributes view
   - `kk_sp_supervisor_dev` — All agent perms + Real-time metrics, Historical metrics, Agent monitoring (listen/barge), Contact Lens view
   - `kk_sp_manager_dev` — All supervisor perms + Queue configuration, Routing profile management, User management view
5. **Connect Users** (Connect-managed, not Cognito):
   - `agent1` — password `Demo@1234`, routing profile `kk_rp_agent_dev`, security profile `kk_sp_agent_dev`
   - `super1` — password `Demo@1234`, routing profile `kk_rp_supervisor_dev`, security profile `kk_sp_supervisor_dev`
   - `manager1` — password `Demo@1234`, routing profile `kk_rp_supervisor_dev`, security profile `kk_sp_manager_dev`
6. **Agent Proficiency / Skills**:
   - Create user-defined attribute / skill: `InsuranceClaims` (levels 1–5)
   - Assign `agent1`: `InsuranceClaims` level 4
   - Assign `super1`: `InsuranceClaims` level 5
7. **Quick Connects**:
   - `kk_qc_claims_dev` — Type: Queue, Queue: `kk_queue_claims_dev`
   - `kk_qc_general_dev` — Type: Queue, Queue: `kk_queue_general_dev`
   - Add both Quick Connects to both queues
**Definition of Done:** Both queues visible in Connect console, routing profiles assigned, all 3 users can log into the native Connect CCP (test at `https://kk-connect-dev.my.connect.aws/ccp-v2`), Quick Connects appear in transfer list.

---

**[TASK-005]**
**Title:** Amazon Lex v2 Bot — Insurance Self-Service
**Owner:** Bhautik Navdariya
**Estimate:** 60 minutes
**Steps:**
1. Create Lex v2 bot `kk_lexbot_dev`, locales: `en_US`, `es_US`, IAM role: create new
2. **Intent: `ClaimStatus` (en_US)**
   - Sample utterances: "check my claim", "claim status", "where is my claim", "what happened to my claim", "claim number {ClaimNumber}", "I want to check claim {ClaimNumber}"
   - Slot: `ClaimNumber` (AMAZON.Number, prompt: "What is your claim number?")
   - Closing response: "Your claim {ClaimNumber} is currently under review. Estimated completion is 3–5 business days. Would you like to speak with a claims specialist? Say 'agent' or 'yes'."
3. **Intent: `PolicyInfo` (en_US)**
   - Sample utterances: "my policy details", "policy information", "what does my policy cover", "tell me about my coverage", "policy benefits"
   - Closing response: "Your policy covers medical expenses up to $500,000, accident protection, and theft. For detailed coverage questions, I can connect you with a policy advisor. Say 'agent' to connect."
4. **Intent: `RequestCallback` (en_US)**
   - Sample utterances: "call me back", "request callback", "I want a callback", "call me later"
   - Closing response: "I'll arrange a callback for you. Please stay on the line while I set that up."
5. **FallbackIntent (en_US)**
   - Closing response: "I didn't quite get that. Transferring you to an agent now. Please hold."
6. **Duplicate all intents for `es_US`** with Spanish utterances:
   - ClaimStatus: "revisar mi reclamo", "estado del reclamo", "reclamo número {ClaimNumber}"
   - PolicyInfo: "detalles de mi póliza", "información de cobertura", "qué cubre mi póliza"
   - FallbackIntent: "No entendí eso. Transfiriéndote a un agente ahora."
7. Build both locales — confirm 0 errors
8. Create version `1` and alias `kk_lexalias_dev` pointing to version 1
9. Note the **Bot ID** and **Alias ID** — needed for contact flows
**Definition of Done:** Both EN and ES locales build successfully, test utterances return correct responses in Lex console test chat.

---

**[TASK-006]**
**Title:** Contact Flows — Voice, Chat & Callback
**Owner:** Bhautik Navdariya
**Estimate:** 75 minutes
**Steps:**
1. **Chat Flow `kk_chatflow_dev`**:
   - Set contact attributes: `channel=chat`
   - Enable Contact Lens (Conversational analytics)
   - Get customer input → Amazon Lex bot: `kk_lexbot_dev` / `kk_lexalias_dev`
   - Branch on intent:
     - `ClaimStatus` → respond with slot confirmation → loop back to Lex
     - `PolicyInfo` → respond → loop back to Lex
     - `RequestCallback` → Transfer to flow: `kk_callbackflow_dev`
     - `FallbackIntent` → Transfer to queue: `kk_queue_general_dev`
   - On queue transfer: set working queue, transfer to queue
   - Assign to chat channel in Connect instance settings
2. **Voice Flow `kk_voiceflow_dev`**:
   - Set voice: Joanna (EN), Lupe (ES)
   - Check contact attribute `Language` — if `es_US`, set Lex locale override
   - Play prompt: "Welcome to Kiro Insurance. For claims, press 1. For policy information, press 2. For all other queries, press 3."
   - Get customer input (DTMF):
     - `1` → Set working queue: `kk_queue_claims_dev` (proficiency routing on) → Transfer to queue
     - `2` → Get customer input via Lex (`PolicyInfo`) → Transfer to `kk_queue_general_dev`
     - `3` → Transfer to `kk_queue_general_dev`
   - Enable Contact Lens on all branches
   - Assign to claimed phone number
3. **Callback Flow `kk_callbackflow_dev`**:
   - Check queue staffing: `kk_queue_general_dev`
   - If agents available → transfer directly to queue
   - If no agents or wait > 120s → play prompt: "Our wait time is longer than usual. Press 1 to receive a callback when an agent is free."
   - Get DTMF input:
     - `1` → Invoke Lambda `kk_fn_callback_dev` with contact attributes → play "We'll call you back shortly. Goodbye." → Disconnect
     - Timeout/other → Transfer to queue normally
4. Publish all 3 flows
5. Assign `kk_voiceflow_dev` to the claimed phone number
6. Assign `kk_chatflow_dev` to the chat channel
**Definition of Done:** Voice call reaches IVR menu; chat connects to Lex bot; callback flow invokes Lambda. All flows visible as "Published" in Connect console.

---

**[TASK-007]**
**Title:** Callback Lambda Function
**Owner:** Bhautik Navdariya
**Estimate:** 30 minutes
**Steps:**
1. Create Lambda function `kk_fn_callback_dev` (Python 3.12, architecture x86_64)
2. Create IAM execution role `kk_role_callback_dev` with policies:
   - `AWSLambdaBasicExecutionRole` (CloudWatch logs)
   - Inline policy: `connect:StartOutboundVoiceContact` on the Connect instance ARN
3. Lambda code (`lambda_function.py`):
   ```python
   import boto3, os, json

   connect = boto3.client('connect')
   INSTANCE_ID = os.environ['CONNECT_INSTANCE_ID']
   QUEUE_ID    = os.environ['CONNECT_QUEUE_ID']

   def lambda_handler(event, context):
       attrs = event.get('Details', {}).get('ContactData', {}).get('Attributes', {})
       customer_number = attrs.get('customerNumber')
       if not customer_number:
           return {'statusCode': 400, 'body': 'Missing customerNumber'}
       resp = connect.start_outbound_voice_contact(
           DestinationPhoneNumber=customer_number,
           ContactFlowId=os.environ['CONTACT_FLOW_ID'],
           InstanceId=INSTANCE_ID,
           QueueId=QUEUE_ID,
           Attributes={'callbackRequested': 'true', 'originalCustomerNumber': customer_number}
       )
       return {'statusCode': 200, 'contactId': resp['ContactId']}
   ```
4. Set environment variables: `CONNECT_INSTANCE_ID`, `CONNECT_QUEUE_ID`, `CONTACT_FLOW_ID`
5. Test with a sample event payload from the Connect flow
6. Wire Lambda ARN into `kk_callbackflow_dev` Invoke Lambda block
**Definition of Done:** Lambda invoked from Contact Flow initiates an outbound call; CloudWatch logs show successful `StartOutboundVoiceContact` call.

---

**[TASK-008]**
**Title:** Customer Portal — Insurance Landing Page + Chat Widget
**Owner:** Himanshu Parmar
**Estimate:** 90 minutes
**Steps:**
1. Scaffold: `npm create vite@latest portal -- --template react` inside `/portal`
2. Install dependencies: `npm install tailwindcss @tailwindcss/vite react-router-dom`
3. Configure Tailwind in `vite.config.js` and `src/index.css`
4. Create routes via React Router:
   - `/` → `HomePage`
   - `/claims` → `ClaimsPage` (stub with chat CTA)
   - `/policy` → `PolicyPage` (stub with chat CTA)
5. **Header component**: Kiro Insurance logo, nav links (Home, Claims, Policy, About), "Get Support" button
6. **Hero section**: headline, sub-headline, two CTAs ("Start a Chat", "File a Claim"), trust stats (98% CSAT, <30s response, 24/7 AI)
7. **Features section**: 6 cards — AI Claims Bot, Voice & Chat, Multilingual, Callback, Contact Lens Analytics, Secure & Compliant
8. **Plans section**: 3 coverage plan cards (Basic $49, Premium $129, Elite $249) with feature lists
9. **Footer**: links, AWS/Connect attribution, team name
10. **Pre-chat form component** (modal/drawer):
    - Fields: Full Name (text), Policy Number (text), Topic (select: Claims / Policy Info / Billing / Other)
    - Validation: name and policy number required
    - On submit: store attributes, open chat widget
11. **Embed Amazon Connect Chat Widget**:
    - Add the hosted widget `<script>` snippet from Connect console → Channels → Chat → Test chat widget → Get code
    - Configure: instance URL, contact flow = `kk_chatflow_dev`
    - Pass pre-chat form values as contact attributes: `customerName`, `policyNumber`, `topic`
12. **Floating chat button** (bottom-right, fixed position): click opens pre-chat form; after submit opens widget
13. Add Connect instance URL to allowed origins in `portal/.env.production`: `VITE_CONNECT_INSTANCE_URL`
14. **Responsive**: test at 375px (mobile) and 1280px (desktop)
**Definition of Done:** Portal loads on localhost; chat widget opens; pre-chat form submits; chat session starts in Amazon Connect console.

---

**[TASK-009]**
**Title:** CCP App — Amplify Auth + Role-Based Routing
**Owner:** Mehul Parmar
**Estimate:** 60 minutes
**Steps:**
1. Scaffold: `npm create vite@latest ccp -- --template react` inside `/ccp`
2. Install dependencies:
   ```bash
   npm install tailwindcss @tailwindcss/vite react-router-dom aws-amplify amazon-connect-streams
   ```
3. Create `.env.development` and `.env.production`:
   ```
   VITE_USER_POOL_ID=us-east-1_XXXXXXX
   VITE_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
   VITE_COGNITO_DOMAIN=kk-auth-dev.auth.us-east-1.amazoncognito.com
   VITE_REDIRECT_SIGN_IN=http://localhost:5173/callback
   VITE_REDIRECT_SIGN_OUT=http://localhost:5173/
   ```
   (Production `.env.production` uses CloudFront URLs)
4. Create `src/amplify-config.js`:
   ```js
   import { Amplify } from 'aws-amplify';
   Amplify.configure({
     Auth: {
       Cognito: {
         userPoolId: import.meta.env.VITE_USER_POOL_ID,
         userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID,
         loginWith: {
           oauth: {
             domain: import.meta.env.VITE_COGNITO_DOMAIN,
             scopes: ['openid', 'email', 'profile'],
             redirectSignIn: [import.meta.env.VITE_REDIRECT_SIGN_IN],
             redirectSignOut: [import.meta.env.VITE_REDIRECT_SIGN_OUT],
             responseType: 'code',
           }
         }
       }
     }
   });
   ```
5. Create `src/hooks/useAuth.js`:
   ```js
   import { fetchAuthSession, signInWithRedirect, signOut } from 'aws-amplify/auth';
   export async function getUserRole() {
     const session = await fetchAuthSession();
     const groups = session.tokens?.idToken?.payload?.['cognito:groups'] ?? [];
     if (groups.includes('kk_managers_dev'))    return { role: 'manager',    ...parseUser(session) };
     if (groups.includes('kk_supervisors_dev')) return { role: 'supervisor', ...parseUser(session) };
     if (groups.includes('kk_agents_dev'))      return { role: 'agent',      ...parseUser(session) };
     return null;
   }
   function parseUser(session) {
     const p = session.tokens.idToken.payload;
     return { email: p.email, name: p.name ?? p.email };
   }
   export { signInWithRedirect, signOut };
   ```
6. Create `src/App.jsx` — root routing logic:
   - On mount: `fetchAuthSession()` → success → `getUserRole()` → set role state
   - On `fetchAuthSession()` error (no session) → `signInWithRedirect()`
   - Render `<LoadingScreen />` while loading
   - Route to `<AgentView />`, `<SupervisorView />`, `<ManagerView />` based on role
   - Route `/callback` → `<CallbackPage />` (just a spinner; Amplify handles the code exchange)
7. Create `<CallbackPage />`: show "Signing you in…" spinner — Amplify auto-exchanges code and triggers re-render
8. Test locally: `npm run dev` → browser redirects to Cognito Hosted UI → log in as `agent1@demo.com` → redirected back → Agent view renders
**Definition of Done:** All 3 test users (agent1, super1, manager1) can log in via Cognito Hosted UI and land on their correct role view.

---

**[TASK-010]**
**Title:** CCP App — Agent View
**Owner:** Mehul Parmar
**Estimate:** 90 minutes
**Steps:**
1. Create `src/views/AgentView.jsx` — layout: left sidebar + main contact area + right control panel
2. **Initialise Amazon Connect Streams SDK** in a `useEffect` after auth:
   ```js
   connect.core.initCCP(containerRef.current, {
     ccpUrl: `https://kk-connect-dev.my.connect.aws/ccp-v2`,
     loginPopup: true,
     loginPopupAutoClose: true,
     softphone: { allowFramedSoftphone: true },
   });
   connect.agent(agent => {
     agent.onRefresh(() => setAgentState(agent.getState().name));
     agent.onContact(contact => setActiveContact(contact));
   });
   ```
3. **Left sidebar**:
   - Agent avatar (initials), name (from Cognito email), role badge
   - Status selector: Available / Break / Lunch / Offline — calls `agent.setStatus()`
   - Today's stats: Contacts Handled, CSAT %, Avg Handle Time, In Queue count
   - Queue list with contact counts
   - Quick Connects list
4. **Main contact panel** (shown when `activeContact` exists):
   - Channel badge (Chat / Voice)
   - Customer card: name, policy number, queue name (from contact attributes)
   - Live contact timer (`useEffect` interval)
   - Chat transcript: `contact.getActiveInitialConnection()` → messages via chat transcript API
   - Message input + Send button: `chatSession.sendMessage()`
5. **Right control panel**:
   - `Accept` button → `contact.accept()`
   - `End` button → `contact.getAgentConnection().destroy()`
   - `Hold/Resume` → `connection.hold()` / `connection.resume()`
   - `Mute/Unmute` → `agent.mute()` / `agent.unmute()`
   - `Transfer` → show Quick Connect dropdown → `contact.transfer(endpoint)`
   - `Add Note` → textarea that stores to contact attributes
   - Contact Lens sentiment score (polled from Connect API)
   - Customer contact history (last 3, fetched from Connect Search Contacts API)
6. **Hidden CCP iframe container** `<div ref={containerRef} style={{display:'none'}} />` — must be in DOM
**Definition of Done:** Agent can log in, see an incoming contact, accept it, exchange chat messages, hold/resume, and end the contact.

---

**[TASK-011]**
**Title:** CCP App — Supervisor View
**Owner:** Ayush Anghan
**Estimate:** 90 minutes
**Steps:**
1. Create `src/views/SupervisorView.jsx` — layout: top nav tabs + tab content area
2. **Top nav tabs**: Real-Time | Agents | Contact Lens | Alerts
3. **Real-Time tab** — metric cards refreshed every 30 seconds via `useEffect` interval:
   - Call `connect:GetCurrentMetricData` with:
     - Filters: instance ARN, both queue ARNs
     - Metrics: `CONTACTS_IN_QUEUE`, `AGENTS_AVAILABLE`, `AGENTS_ON_CONTACT`, `OLDEST_CONTACT_AGE`
   - Render 4 metric cards with value, label, trend indicator, and sparkline
   - Queue breakdown bar chart (Claims vs General)
   - Service Level % card (calculate from metrics)
4. **Agents tab** — agent status table refreshed every 30 seconds:
   - Call `connect:GetCurrentUserData` with queue filter
   - Table columns: Agent Name, Status, Active Queue, Duration on Status, Contacts Today, CSAT %
   - Status pills with colour coding (Available=green, On Contact=red, Break=amber, Offline=gray)
   - `Monitor` button per row (opens native Connect monitoring URL)
5. **Contact Lens tab**:
   - Sentiment distribution: Positive / Neutral / Negative % bars
   - Flagged contacts list (non-talk time, interruptions, issues)
   - "View Full Transcripts" button → links to Connect native Contact Lens URL: `https://kk-connect-dev.my.connect.aws/contact-lens`
   - Evaluation forms summary (average scores from `kk_evalform_dev`)
6. **Alerts panel** (persistent right sidebar or bottom bar):
   - SLA warning if `OLDEST_CONTACT_AGE` > 120s
   - Queue threshold warning if `CONTACTS_IN_QUEUE` > 5
   - Agent offline warning if all agents in a queue are unavailable
7. **API Authentication**: use `fetchAuthSession()` from Amplify to get AWS credentials, then pass to `@aws-sdk/client-connect` for signed API calls. Set IAM permissions on the Cognito authenticated role.
**Definition of Done:** Supervisor view shows live queue stats updating every 30s, agent table populates, Contact Lens tab links to transcripts, alerts appear when thresholds are exceeded.

---

**[TASK-012]**
**Title:** CCP App — Manager Config View
**Owner:** Ayush Anghan
**Estimate:** 60 minutes
**Steps:**
1. Create `src/views/ManagerView.jsx` — extends Supervisor View with an additional "Configuration" tab
2. **Configuration tab** — sub-sections:
3. **Queue Availability**:
   - Fetch both queues via `connect:DescribeQueue`
   - Display queue name, current hours of operation (open/closed), contacts waiting
   - Toggle switch per queue → on toggle: call `connect:UpdateQueueHoursOfOperation` to swap between 24/7 hours and a closed hours profile
   - Visual indicator: green "Open" / red "Closed" badge updates immediately on toggle
4. **Routing Profile Assignment**:
   - Fetch agents list via `connect:ListUsers`
   - Table: Agent Name, Current Routing Profile, dropdown to change
   - On dropdown change: call `connect:UpdateUserRoutingProfile`
   - Confirm toast on success
5. **Agent Proficiency Levels**:
   - Table: Agent Name, Skill (`InsuranceClaims`), current level (1–5)
   - Editable level selector (radio buttons 1–5) per agent
   - On change: call `connect:UpdateUserHierarchy` or `connect:AssociateUserProficiencies`
6. **Lex Bot Overview** (read-only):
   - Bot name `kk_lexbot_dev`, alias `kk_lexalias_dev`, status
   - Intents list with locale (EN / ES) and total invocation count (from CloudWatch metrics)
7. **Contact Lens Settings**:
   - Toggle: Enable/disable Contact Lens on voice flow
   - Toggle: Enable/disable Contact Lens on chat flow
   - Toggle: PII redaction on/off
   - Toggle: Agent evaluation form auto-assign
8. **Save bar** at bottom: "Save Changes" button applies all pending config changes in one batch; "Discard" resets state
**Definition of Done:** Manager can toggle a queue open/closed and see the Connect queue status reflect the change; routing profile change persists after page refresh.

---

**[TASK-013]**
**Title:** Contact Lens & Agent Evaluation Setup
**Owner:** Darshan Kalathiya
**Estimate:** 30 minutes
**Steps:**
1. Confirm Contact Lens is enabled on the Connect instance (from TASK-003)
2. In Connect console → Contact Lens → Evaluation forms → Create form `kk_evalform_dev`:
   - Section 1 — Call Quality:
     - Q1: Agent greeted the customer professionally (1–5 scale)
     - Q2: Agent demonstrated product knowledge (1–5 scale)
   - Section 2 — Issue Resolution:
     - Q3: Customer issue was resolved on first contact (Yes/No)
     - Q4: Agent empathy and tone (1–5 scale)
   - Section 3 — Compliance:
     - Q5: Agent followed script / disclosure requirements (Yes/No)
3. Publish the evaluation form
4. Verify Contact Lens is enabled in both `kk_chatflow_dev` and `kk_voiceflow_dev` (Check "Enable Contact Lens" block in each flow)
5. Make a test call end-to-end: place a call → agent answers → talk briefly → end contact
6. Wait 2–3 minutes → verify in Connect console → Contact Lens → Contacts: transcript and sentiment score appear
7. Fill in evaluation form for the test contact to confirm it works
**Definition of Done:** Post-contact transcript appears in Contact Lens with sentiment score; evaluation form `kk_evalform_dev` can be submitted for a completed contact.

---

**[TASK-014]**
**Title:** Infrastructure as Code — CloudFormation YAML
**Owner:** Jaynish Chhabhaiya
**Estimate:** 60 minutes
**Steps:**
1. Extend `infra/kk_stack_dev.yml` to document all manually created Connect resources using CloudFormation resource types:
   - `AWS::Connect::Instance` — `kk-connect-dev`
   - `AWS::Connect::Queue` — `kk_queue_general_dev`, `kk_queue_claims_dev`
   - `AWS::Connect::RoutingProfile` — `kk_rp_agent_dev`, `kk_rp_supervisor_dev`
   - `AWS::Connect::SecurityProfile` — all 3 profiles
   - `AWS::Connect::ContactFlow` — `kk_chatflow_dev`, `kk_voiceflow_dev`, `kk_callbackflow_dev`
   - `AWS::Lex::Bot` — `kk_lexbot_dev`
   - `AWS::Lambda::Function` — `kk_fn_callback_dev`
2. Add `Parameters` block with `Env` parameter (`dev` / `prod`) so all resource names use `!Sub "kk_${ResourceName}_${Env}"`
3. Add `Outputs` block exporting: Portal CloudFront URL, CCP CloudFront URL, Connect Instance ID, Cognito User Pool ID, App Client ID, Cognito Domain
4. Validate template: `aws cloudformation validate-template --template-body file://infra/kk_stack_dev.yml`
5. Write `docs/DEPLOYMENT.md`:
   - Prerequisites (AWS CLI, Node 18+, Git)
   - Step 1: Deploy CFN stack
   - Step 2: Create Cognito test users (CLI commands)
   - Step 3: Configure Connect manually (with links to AWS docs for steps not in CFN)
   - Step 4: Push to `dev` branch → CI/CD deploys both apps
   - Step 5: Verify URLs
**Definition of Done:** `aws cloudformation validate-template` passes with no errors; `DEPLOYMENT.md` has end-to-end instructions an evaluator could follow.

---

**[TASK-015]**
**Title:** QA Test Cases Document
**Owner:** Saveen Poonia
**Estimate:** 45 minutes
**Steps:**
1. Create `docs/QA_TEST_CASES.md`
2. Write test cases using this format: `| TC-ID | Feature | Test Steps | Expected Result | Pass/Fail |`
3. Cover all must-have features with at least the following test cases:

| TC-ID | Feature |
|---|---|
| TC-001 | Customer opens portal — page loads, logo and nav visible |
| TC-002 | Pre-chat form validation — submit without name shows error |
| TC-003 | Chat widget opens after pre-chat form submit |
| TC-004 | Lex bot responds to "check my claim" with ClaimStatus intent |
| TC-005 | Lex bot responds to "my policy details" with PolicyInfo intent |
| TC-006 | Typing "agent" routes to kk_queue_general_dev |
| TC-007 | Agent logs in via Cognito Hosted UI — Agent View renders |
| TC-008 | Supervisor logs in — Supervisor View renders with dashboard tab |
| TC-009 | Manager logs in — Manager View renders with config tab |
| TC-010 | Wrong role user sees Unauthorized page |
| TC-011 | Agent accepts incoming chat contact |
| TC-012 | Agent sends message — customer receives it |
| TC-013 | Agent places contact on hold — customer hears hold music |
| TC-014 | Agent transfers contact via Quick Connect |
| TC-015 | Agent ends contact — contact removed from CCP |
| TC-016 | Supervisor dashboard shows Contacts in Queue count |
| TC-017 | Dashboard metrics auto-refresh every 30 seconds |
| TC-018 | Agent status table shows correct status for each agent |
| TC-019 | Manager toggles Claims queue closed — queue shows Closed |
| TC-020 | Manager toggles queue open — queue returns to Open |
| TC-021 | Voice call reaches IVR — "Welcome to Kiro Insurance" prompt plays |
| TC-022 | Press 1 on IVR — call routed to kk_queue_claims_dev |
| TC-023 | Contact Lens transcript appears after voice call ends |
| TC-024 | Spanish utterance "revisar mi reclamo" — ES Lex bot responds |
| TC-025 | CI/CD pipeline: push to dev → both apps deploy successfully |

**Definition of Done:** At least 20 test cases documented with expected results; at least 15 marked as Pass from actual testing.

---

**[TASK-016]**
**Title:** User Guide & Architecture Documentation
**Owner:** Saveen Poonia
**Estimate:** 45 minutes
**Steps:**
1. Create `docs/USER_GUIDE.md` with 4 sections:
   - **Customer Guide**: How to start a chat, pre-chat form, talking to the bot, reaching an agent, requesting a callback
   - **Agent Guide**: Login via Cognito, accepting a contact, chat controls, hold/transfer/end, setting status
   - **Supervisor Guide**: Dashboard navigation, reading metrics, monitoring agents, viewing Contact Lens reports
   - **Manager Guide**: Toggling queue availability, changing routing profiles, adjusting proficiency levels
2. Create `docs/ARCHITECTURE.md`:
   - High-level architecture diagram (ASCII or embed draw.io PNG)
   - Component descriptions with AWS service names and resource names
   - Data flow section: Chat path, Voice path, Callback path, Metrics path
   - Auth flow section: Cognito Hosted UI → JWT → role routing
3. Create root `README.md`:
   - Project title, team name, event name
   - Quick links: Portal URL, CCP URL, AWS Console, GitHub Actions
   - Tech stack table
   - Local dev setup instructions for both apps
   - Link to DEPLOYMENT.md, USER_GUIDE.md, QA_TEST_CASES.md
4. Create `docs/KNOWN_LIMITATIONS.md`:
   - Voicemail: not implemented, architecture described
   - Outbound campaigns: not enabled on account
   - Production environment: IaC ready, not deployed
   - Automated QA: manual test cases only
**Definition of Done:** All 4 docs exist with meaningful content; README has working links; an evaluator can understand the solution without a live demo.

---

**[TASK-017]**
**Title:** End-to-End Integration Testing & Bug Fixes
**Owner:** Darshan Kalathiya, Bhautik Navdariya, Himanshu Parmar, Mehul Parmar
**Estimate:** 90 minutes (Hours 3.5–5)
**Steps:**
1. **Chat E2E**:
   - Open portal → pre-chat form → start chat
   - Verify Lex bot responds to "check my claim" with claim number slot prompt
   - Type "agent" → verify contact appears in agent CCP
   - Agent accepts → both sides exchange 2 messages → agent ends
   - Verify Contact Lens transcript appears within 3 minutes
2. **Voice E2E**:
   - Call the claimed phone number
   - Verify IVR plays "Welcome to Kiro Insurance"
   - Press 1 → verify `kk_queue_claims_dev` receives contact
   - Agent in CCP accepts voice call → brief conversation → end
   - Verify Contact Lens transcript and sentiment appear
3. **Callback E2E**:
   - Call number → wait in queue → verify callback offer plays
   - Press 1 → verify Lambda `kk_fn_callback_dev` is invoked (check CloudWatch logs)
   - Verify outbound call placed to the number
4. **Role Auth E2E**:
   - Log in as `agent1@demo.com` → Agent View only (no supervisor/manager tabs)
   - Log in as `super1@demo.com` → Supervisor View with dashboard
   - Log in as `manager1@demo.com` → Manager View with config tab
   - Navigate to `/manager` URL directly as agent → redirect to Unauthorized page
5. **Dashboard metrics E2E**:
   - Start a chat contact → supervisor view shows Contacts in Queue = 1
   - Wait 30s → metrics refresh → value updates
6. **Manager config E2E**:
   - Toggle Claims queue to Closed → verify in Connect console queue status changes
   - Toggle back to Open → verify restored
7. **Multilingual E2E**:
   - Set browser language to Spanish or use a contact attribute `Language=es_US`
   - Type Spanish utterance in chat → verify ES Lex bot responds in Spanish
8. Log all bugs found in `docs/BUGS.md` with severity (P0/P1/P2) — fix all P0s immediately
**Definition of Done:** Chat E2E, Voice E2E, and Role Auth E2E fully working. No P0 bugs open. All results logged in BUGS.md.

---

**[TASK-018]**
**Title:** Demo Rehearsal & Environment Freeze
**Owner:** All (led by Saveen Poonia)
**Estimate:** 30 minutes (Hours 5.5–6)
**Steps:**
1. Prepare browser tabs in advance:
   - Tab 1: Customer Portal (`kk-portal-dev` CloudFront URL)
   - Tab 2: CCP App logged in as `agent1@demo.com`
   - Tab 3: CCP App logged in as `super1@demo.com` (incognito window)
   - Tab 4: CCP App logged in as `manager1@demo.com` (second incognito window)
   - Tab 5: GitHub Actions — pipeline run (green)
   - Tab 6: AWS Connect console (for showing Contact Lens)
2. Run full demo script once end-to-end — time it (target: under 5 minutes)
3. Identify any last-minute issues — fix ONLY if estimated fix < 10 minutes, otherwise note as known limitation
4. **Freeze deployments** at Hour 5:45 — no pushes to `dev` after this
5. Confirm all items work:
   - [ ] Portal loads and chat widget opens
   - [ ] All 3 Cognito logins work and land on correct views
   - [ ] Agent can accept and end a chat contact
   - [ ] Supervisor metrics are live
   - [ ] Manager queue toggle works
   - [ ] CI/CD pipeline shows green in GitHub Actions
   - [ ] Voice IVR answers on the claimed phone number
6. Share credentials doc with demo presenter: portal URL, CCP URL, all 3 login emails + passwords
**Definition of Done:** Full demo script runs clean under 5 minutes with no errors and no manual recovery steps needed.

---

*Document version: V2.1 — corrected to 2 apps per project-statement.txt*
*Auth: Amazon Cognito + Amplify Hosted UI (PKCE, role via cognito:groups JWT claim)*
*Team: Kiro Krafters | Naming prefix: `kk` | Environment: `dev`*
