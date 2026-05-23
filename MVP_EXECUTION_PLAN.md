# MVP Execution Plan — Kiro Krafters
## AI-Enabled Contact Center Solution (Amazon Connect)
**Domain:** Insurance Customer Portal
**Team:** Saveen Poonia (Lead), Jaynish Chhabhaiya (DevOps), Darshan Kalathiya (Connect Dev), Bhautik Navdariya (Connect Dev), Himanshu Parmar (Full Stack), Mehul Parmar (Full Stack), Ayush Anghan (Full Stack)
**Time Budget:** 6 hours
**Naming Convention:** `kk_ResourceName_dev` / `kk_ResourceName_prod`

---

# Project Summary

## Objective
Build a demonstrable AI-enabled Contact Center for an **Insurance company** using Amazon Connect, featuring a customer chat portal, a custom CCP web app for agents/supervisors, Lex bot automation, Contact Lens analytics, and multilingual routing — all deployable via CI/CD.

## End Users
| Role | Description |
|---|---|
| Customer | Insurance policyholders seeking support via chat or voice |
| Agent | Handles incoming contacts via custom CCP |
| Supervisor | Monitors queues, evaluates agents, manages routing |
| Manager | Reviews dashboards, adjusts configuration |

## Success Criteria (Demo-Ready in 6 Hours)
- [ ] Customer can initiate a chat from the portal and reach an agent or bot
- [ ] Lex bot handles at least 2 self-service intents (claim status, policy info)
- [ ] Agent can accept a contact in the custom CCP UI
- [ ] Supervisor dashboard shows live queue metrics
- [ ] At least 2 queues configured with proficiency-based routing
- [ ] Contact Lens enabled on at least one flow
- [ ] CI/CD pipeline deploys frontend to S3/CloudFront
- [ ] All resources named `kk_*_dev`

## MVP Definition
**In Scope:**
- Customer Portal (React SPA) with embedded Connect Chat Widget
- Custom CCP (React) with basic softphone + contact controls
- Supervisor Dashboard with real-time metrics (CloudWatch / Connect APIs)
- Amazon Connect instance with 2 queues, Lex bot, Contact Lens
- Callback functionality for voice queue
- Multilingual routing (English + one additional language via Lex locale)
- Proficiency-based routing configuration
- Basic Manager config page (queue hours, routing profile toggle)
- CI/CD via GitHub Actions → S3 + CloudFormation
- IaC for Connect instance, queues, flows (CloudFormation/CDK)

## Explicitly OUT OF SCOPE (MVP)
- Voicemail (complex S3+Lambda pipeline — stub only)
- Outbound campaigns (requires additional Connect feature enablement — document only)
- Full QA automation suite (manual test cases only)
- Production environment (`_prod`) — only `_dev` deployed
- Custom authentication (use Amazon Cognito defaults, no custom IdP)
- Mobile app
- Full user guide (skeleton doc only)
- Historical reporting deep-dives (show 1 widget only)

---

# Requirement Breakdown

| ID | Requirement | Must Have | Nice to Have | Complexity | Owner |
|---|---|---|---|---|---|
| R01 | Customer Portal with Chat Widget | ✅ | | Low | Himanshu |
| R02 | Custom CCP web app (agent view) | ✅ | | Medium | Mehul |
| R03 | Supervisor dashboard & metrics | ✅ | | Medium | Ayush |
| R04 | Manager configurable settings page | | ✅ | Low | Ayush |
| R05 | Amazon Connect instance + queues (2+) | ✅ | | Low | Darshan |
| R06 | Voice channel | ✅ | | Low | Darshan |
| R07 | Chat channel | ✅ | | Low | Darshan |
| R08 | Callback functionality | ✅ | | Medium | Bhautik |
| R09 | Voicemail | | ✅ | High | Bhautik (stub) |
| R10 | Lex Bot (2 intents minimum) | ✅ | | Medium | Bhautik |
| R11 | Multilingual support (EN + 1 lang) | ✅ | | Medium | Darshan |
| R12 | Role-based access (Agent/Super/Mgr) | ✅ | | Low | Darshan |
| R13 | Agent evaluation / monitoring | | ✅ | Medium | Darshan |
| R14 | Quick Connect configurations | ✅ | | Low | Bhautik |
| R15 | Proficiency-based routing | ✅ | | Medium | Bhautik |
| R16 | Queue-based routing | ✅ | | Low | Darshan |
| R17 | Contact Lens integration | ✅ | | Low | Darshan |
| R18 | Outbound campaign | | ✅ | High | Document only |
| R19 | CI/CD pipeline (GitHub Actions) | ✅ | | Medium | Jaynish |
| R20 | IaC (CloudFormation/CDK) | ✅ | | Medium | Jaynish |
| R21 | QA test cases (feature-wise) | ✅ | | Low | Saveen |
| R22 | User guide / documentation | ✅ | | Low | Saveen |

---

# Technical Approach

## Architecture (High Level)

```
Customer Browser                Agent/Supervisor Browser
       |                                  |
       v                                  v
[React Customer Portal]         [React CCP Web App]
[Connect Chat Widget SDK]       [Amazon Connect Streams SDK]
       |                                  |
       +------------+  HTTPS  +-----------+
                    |         |
              [Amazon Connect Instance: kk_connect_dev]
                    |
         +----------+----------+
         |          |          |
    [Lex Bot]  [Contact   [CloudWatch
  kk_lexbot_dev Lens]      Metrics]
         |          |          |
    [Lambda]   [S3 Logs]   [Connect
  kk_fn_dev              APIs (REST)]
```

## Main Components

| Component | Service | Name |
|---|---|---|
| Connect Instance | Amazon Connect | `kk_connect_dev` |
| Customer Portal | S3 + CloudFront | `kk_portal_dev` |
| CCP Web App | S3 + CloudFront | `kk_ccp_dev` |
| Lex Bot | Amazon Lex v2 | `kk_lexbot_dev` |
| Chat Flow | Connect Contact Flow | `kk_chatflow_dev` |
| Voice Flow | Connect Contact Flow | `kk_voiceflow_dev` |
| Callback Flow | Connect Contact Flow | `kk_callbackflow_dev` |
| Queue - General | Connect Queue | `kk_queue_general_dev` |
| Queue - Claims | Connect Queue | `kk_queue_claims_dev` |
| Routing Profile | Connect Routing Profile | `kk_rp_agent_dev` |
| Cognito User Pool | Amazon Cognito | `kk_userpool_dev` |
| IaC Stack | CloudFormation | `kk_stack_dev` |
| CI/CD Pipeline | GitHub Actions | `kk-deploy-dev` |
| Lambda (callbacks) | AWS Lambda | `kk_fn_callback_dev` |

## APIs / Integrations

| Integration | Purpose |
|---|---|
| Amazon Connect Streams SDK | Embed softphone in custom CCP |
| Amazon Connect Chat SDK | Embed chat widget in portal |
| Amazon Connect REST API | Queue metrics for dashboard |
| Amazon Lex v2 | Bot intents in chat/voice flows |
| Amazon Contact Lens | Sentiment, transcript analytics |
| CloudWatch | Real-time metric widgets |
| Amazon Cognito | Agent/Supervisor auth for CCP |

## Data Flow

**Chat Path:**
Customer → Portal Chat Widget → Connect Chat Flow → Lex Bot → (if unresolved) Queue → Agent CCP

**Voice Path:**
Customer (PSTN/WebRTC) → Connect Voice Flow → IVR Menu → Lex → Queue (proficiency-routed) → Agent

**Callback Path:**
Customer requests callback → Lambda stores request → Connect initiates outbound call

**Metrics Path:**
Connect APIs → CloudWatch → Dashboard React component (polling every 30s)

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React 18 + Vite + Tailwind CSS | Fast setup, component reuse |
| Auth | Amazon Cognito + Hosted UI | Zero custom auth code |
| Connect Embed | Amazon Connect Streams SDK | Official SDK for CCP |
| Chat Widget | Amazon Connect Chat SDK | Official SDK |
| IaC | AWS CloudFormation (YAML) | Native, no extra tooling |
| CI/CD | GitHub Actions | Free, fast |
| Hosting | S3 + CloudFront | Serverless, fast to deploy |
| Backend Logic | AWS Lambda (Python 3.12) | Callbacks only |
| Bot | Amazon Lex v2 (EN + ES) | Built into Connect |
| Monitoring | CloudWatch + Connect Metrics API | Native |

## Assumptions

1. Amazon Connect instance does **not** exist yet — Darshan creates it manually first (15 min), IaC documents it afterward.
2. A claimed phone number is available in the AWS account.
3. Team has AWS Console + CLI access from hour 0.
4. GitHub repo is created by Jaynish in the first 15 minutes.
5. All developers use the same AWS `dev` account; no cross-account setup needed.
6. "Multilingual" means EN + Spanish (ES) via a second Lex locale — no full translation of UI required for MVP.
7. Agent evaluation means Contact Lens evaluation forms (not a custom-built tool).
8. Outbound campaigns are documented with architecture diagram only (enablement takes days on new accounts).

---

# Work Distribution (Parallel Execution)

## Stream A — Foundation & DevOps (Jaynish)

**Tasks:**
- Create GitHub repo, branch strategy (`main`, `dev`)
- Set up GitHub Actions workflow: lint → build → S3 deploy
- Create CloudFormation stack skeleton (`kk_stack_dev`) with S3 buckets, CloudFront distributions
- Create Cognito User Pool (`kk_userpool_dev`) with 3 groups: Agents, Supervisors, Managers
- Document naming convention and push `INFRA.md`

**Dependencies:** AWS account access (Hour 0)

**Deliverables:**
- GitHub repo with CI/CD pipeline
- S3 buckets + CloudFront URLs for portal and CCP
- Cognito pool with test users

**Estimated Time:** Hours 0–3 (ongoing support after)

---

## Stream B — Amazon Connect Setup (Darshan + Bhautik)

**Darshan:**
- Create Connect instance `kk_connect_dev` manually
- Claim phone number, configure hours of operation
- Create 2 queues: `kk_queue_general_dev`, `kk_queue_claims_dev`
- Create routing profiles: `kk_rp_agent_dev`, `kk_rp_supervisor_dev`
- Configure proficiency-based routing (agent skill levels 1–5)
- Enable Contact Lens on instance
- Create roles: Agents, Supervisors, Managers (security profiles)
- Set up Quick Connects (2: internal queue transfers)
- Enable chat channel on instance

**Bhautik:**
- Build Lex v2 bot `kk_lexbot_dev` with intents:
  - `ClaimStatus` (EN + ES)
  - `PolicyInfo` (EN + ES)
  - `FallbackIntent` → transfer to queue
- Create Voice Contact Flow `kk_voiceflow_dev` (IVR → Lex → proficiency queue)
- Create Chat Contact Flow `kk_chatflow_dev` (Lex → queue)
- Create Callback Flow `kk_callbackflow_dev` (Lambda trigger)
- Configure Quick Connects on flows

**Dependencies:** Connect instance must exist before flows

**Deliverables:**
- Functional Connect instance with voice + chat
- Lex bot tested in Connect console
- All flows published and assigned to queues

**Estimated Time:** Hours 0–3.5

---

## Stream C — Frontend (Himanshu + Mehul + Ayush)

**Himanshu — Customer Portal (`kk_portal_dev`):**
- React app scaffold with Vite + Tailwind
- Insurance-themed landing page (homepage, policy info stub, claims stub)
- Embed Amazon Connect Chat Widget (floating button → chat window)
- Pre-chat form (name, policy number)
- Responsive layout

**Mehul — Custom CCP (`kk_ccp_dev`):**
- React app scaffold
- Cognito login page
- Embed Amazon Connect Streams SDK (softphone panel)
- Contact controls: Accept, Hold, Transfer, End
- Show contact attributes (customer name, queue)
- Basic agent status selector (Available, Break, Offline)

**Ayush — Supervisor Dashboard + Manager Config:**
- Supervisor view: real-time queue metrics (Contacts in Queue, Available Agents, Oldest Contact) via Connect Metrics API
- Agent list with status badges
- Contact Lens: link to transcript viewer (Connect native URL)
- Manager Config page: toggle queue hours open/closed (Connect API call), routing profile assignment stub

**Dependencies:** CloudFront URL needed for Chat Widget CORS config (from Jaynish, Hour 1)

**Deliverables:**
- Customer portal live on CloudFront with working chat embed
- CCP app live with softphone working
- Dashboard showing live queue stats

**Estimated Time:** Hours 0.5–5

---

## Stream D — Integration & End-to-End (Darshan + Bhautik, Hour 3+)

**Tasks:**
- Wire Chat Widget in portal to `kk_chatflow_dev`
- Wire CCP app to Connect instance endpoint
- Test full chat flow: customer → bot → agent accept
- Test voice flow: PSTN → IVR → queue → agent
- Test callback: customer requests callback → agent receives outbound
- Validate Contact Lens transcripts appear
- Test multilingual: switch to Spanish in Lex, verify routing
- Test proficiency routing (assign skill levels, verify correct agent gets contact)

**Dependencies:** Streams A, B, C complete (Hour 3–3.5)

**Deliverables:**
- End-to-end demo scenario working
- Bug fixes logged and resolved

**Estimated Time:** Hours 3.5–5.5

---

## Stream E — QA, Docs & Demo Prep (Saveen)

**Tasks:**
- Write feature-wise QA test cases (Google Sheet / Markdown table)
- Prepare demo script (5-minute walkthrough)
- Record any known limitations
- Write skeleton `USER_GUIDE.md`
- Prepare architecture diagram (draw.io or Lucidchart)
- Prepare presentation slide (team name, architecture, demo flow)

**Dependencies:** Requirements finalized (Hour 0)

**Deliverables:**
- `QA_TEST_CASES.md`
- `USER_GUIDE.md`
- Architecture diagram image
- Demo script

**Estimated Time:** Hours 0–6 (continuous)

---

# 6-Hour Execution Plan

| Time | Owner | Task | Dependency | Output |
|---|---|---|---|---|
| 0:00–0:15 | All | Kickoff: assign tasks, share AWS creds, create GitHub repo | None | Repo created, tasks assigned |
| 0:15–0:45 | Jaynish | S3 buckets + CloudFront + Cognito stack in CFN | AWS access | CFN stack deployed |
| 0:15–0:45 | Darshan | Create Connect instance manually, claim phone number | AWS access | `kk_connect_dev` live |
| 0:15–0:45 | Bhautik | Build Lex bot intents (EN + ES) in console | AWS access | Bot draft ready |
| 0:15–0:45 | Himanshu | Scaffold Customer Portal (Vite + Tailwind + routing) | None | Portal repo running locally |
| 0:15–0:45 | Mehul | Scaffold CCP app (Vite + Cognito auth + Streams SDK stub) | None | CCP repo running locally |
| 0:15–0:45 | Ayush | Scaffold Dashboard + Manager Config pages | None | Dashboard shell running locally |
| 0:15–0:45 | Saveen | Write QA test cases + demo script outline | Requirements | `QA_TEST_CASES.md` draft |
| 0:45–1:30 | Darshan | Configure queues, routing profiles, security profiles, quick connects | Connect instance | Queues + profiles done |
| 0:45–1:30 | Bhautik | Build voice + chat contact flows, attach Lex bot | Lex bot, queues | Flows published |
| 0:45–1:30 | Jaynish | GitHub Actions CI/CD pipeline YAML + S3 deploy script | Repo | Pipeline runs on push |
| 0:45–1:30 | Himanshu | Insurance landing page + pre-chat form UI | Portal scaffold | Landing page complete |
| 0:45–1:30 | Mehul | Cognito login flow + Streams SDK embed | CCP scaffold | Login works, SDK loads |
| 0:45–1:30 | Ayush | Connect Metrics API call + real-time queue widget | Dashboard scaffold | Metrics displaying |
| 1:30–2:30 | Darshan | Enable Contact Lens, agent evaluation form, multilingual routing | Queues + flows | Contact Lens on |
| 1:30–2:30 | Bhautik | Callback Lambda (`kk_fn_callback_dev`) + callback flow | Flows done | Callback Lambda deployed |
| 1:30–2:30 | Himanshu | Embed Amazon Connect Chat Widget into portal (CORS config) | CloudFront URL | Chat widget loads |
| 1:30–2:30 | Mehul | Contact controls (accept/hold/end/transfer) in CCP | SDK loaded | Agent can handle contacts |
| 1:30–2:30 | Ayush | Agent status list + Contact Lens link in dashboard | Metrics widget | Supervisor view complete |
| 1:30–2:30 | Jaynish | CloudFormation for Connect queues + Lex bot (IaC documentation) | Manual setup done | `kk_stack_dev` CFN YAML |
| 2:30–3:30 | Himanshu | Deploy portal to CloudFront via CI/CD | CI/CD pipeline | Portal live on HTTPS URL |
| 2:30–3:30 | Mehul | Deploy CCP to CloudFront via CI/CD | CI/CD pipeline | CCP live on HTTPS URL |
| 2:30–3:30 | Ayush | Deploy Dashboard to CloudFront via CI/CD + Manager config API | CI/CD pipeline | Dashboard live |
| 2:30–3:30 | Darshan | Proficiency-based routing end-to-end test, fix routing rules | All Connect config | Routing verified |
| 2:30–3:30 | Bhautik | Test Lex bot in chat flow (EN + ES), fix intents | Chat flow live | Bot responds correctly |
| 2:30–3:30 | Jaynish | IaC cleanup, push CFN YAML, verify pipeline runs clean | All deploys | Clean CI/CD green |
| 3:30–4:30 | Darshan + Bhautik | Full integration: chat customer→bot→agent, verify Contact Lens | All components live | Chat E2E working |
| 3:30–4:30 | Himanshu + Mehul | Fix CORS, widget styling, agent UI polish | Integration test | UI polish done |
| 3:30–4:30 | Ayush | Add CloudWatch metrics widget, final dashboard polish | | Dashboard final |
| 3:30–4:30 | Saveen | Architecture diagram + presentation slide | All components | Diagram done |
| 4:30–5:30 | All | Full voice flow test (PSTN → IVR → queue → agent), callback test | All live | Voice + callback verified |
| 4:30–5:30 | Saveen | Complete USER_GUIDE.md + QA test evidence | | Docs complete |
| 5:30–6:00 | All | Demo rehearsal, final bug fixes, demo environment freeze | All working | Demo-ready |

---

# Task Board

---

**[TASK-001]**
**Title:** GitHub Repository Setup & CI/CD Pipeline
**Owner:** Jaynish Chhabhaiya
**Estimate:** 45 minutes
**Steps:**
1. Create GitHub org repo `kiro-krafters/kk-contact-center`
2. Create branches: `main`, `dev`, `feature/*` strategy documented
3. Create monorepo structure: `/portal`, `/ccp`, `/dashboard`, `/infra`
4. Write GitHub Actions workflow (`.github/workflows/deploy-dev.yml`): install → build → `aws s3 sync` → CloudFront invalidate
5. Store AWS credentials as GitHub Secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
6. Test pipeline with dummy `index.html`
**Definition of Done:** Push to `dev` branch triggers pipeline, file appears on S3 URL.

---

**[TASK-002]**
**Title:** AWS Foundation Stack (S3, CloudFront, Cognito)
**Owner:** Jaynish Chhabhaiya
**Estimate:** 45 minutes
**Steps:**
1. Write CloudFormation YAML `infra/kk_stack_dev.yml`
2. Create S3 buckets: `kk-portal-dev`, `kk-ccp-dev`, `kk-dashboard-dev` (static website hosting)
3. Create CloudFront distributions pointing to each S3 bucket
4. Create Cognito User Pool `kk_userpool_dev` with groups: `kk_agents_dev`, `kk_supervisors_dev`, `kk_managers_dev`
5. Create Cognito App Client (no secret, for SPA)
6. Create test users: `agent1@demo.com`, `super1@demo.com`, `manager1@demo.com`
7. Deploy stack: `aws cloudformation deploy --stack-name kk_stack_dev`
8. Output CloudFront URLs and Cognito Pool ID to team Slack/chat
**Definition of Done:** 3 CloudFront URLs accessible, Cognito login works for test users.

---

**[TASK-003]**
**Title:** Amazon Connect Instance Setup
**Owner:** Darshan Kalathiya
**Estimate:** 30 minutes
**Steps:**
1. Create Connect instance in AWS Console, alias: `kk-connect-dev`
2. Set identity management: SAML or Connect-managed (use Connect-managed for speed)
3. Enable chat and voice channels
4. Claim a US phone number (DID) for voice
5. Enable Amazon Contact Lens (toggle in instance settings)
6. Note instance ARN and ID — share with team
**Definition of Done:** Instance status "Active", phone number claimed, Contact Lens enabled.

---

**[TASK-004]**
**Title:** Connect Queues, Routing Profiles & Security Profiles
**Owner:** Darshan Kalathiya
**Estimate:** 45 minutes
**Steps:**
1. Create queues:
   - `kk_queue_general_dev` — Hours: 24/7, outbound caller ID = claimed number
   - `kk_queue_claims_dev` — Hours: 24/7
2. Create routing profiles:
   - `kk_rp_agent_dev` — assign both queues, priorities: Claims=1, General=2
   - `kk_rp_supervisor_dev` — assign both queues, can monitor
3. Create security profiles:
   - `kk_sp_agent_dev` — contact controls, chat
   - `kk_sp_supervisor_dev` — all agent perms + monitoring + metrics
   - `kk_sp_manager_dev` — all supervisor perms + configuration
4. Create agents in Connect: `agent1`, `super1`, `manager1` (map to Cognito or Connect users)
5. Assign routing profiles and security profiles to users
6. Configure proficiency: add skill `InsuranceClaims` with levels 1–5; assign level 4 to `agent1`
**Definition of Done:** Queues visible in Connect console, agents can log in with correct permissions.

---

**[TASK-005]**
**Title:** Lex v2 Bot — Insurance Self-Service
**Owner:** Bhautik Navdariya
**Estimate:** 60 minutes
**Steps:**
1. Create Lex v2 bot `kk_lexbot_dev`, locales: `en_US`, `es_US`
2. Create intent `ClaimStatus` (EN):
   - Sample utterances: "check my claim", "claim status", "where is my claim", "claim number {ClaimNumber}"
   - Slot: `ClaimNumber` (type: AMAZON.Number)
   - Response: "Your claim {ClaimNumber} is currently under review. Would you like to speak with an agent?"
3. Create intent `PolicyInfo` (EN):
   - Sample utterances: "my policy details", "policy information", "what does my policy cover"
   - Response: "Your policy covers medical, accident, and theft. For detailed coverage, say 'agent' to connect."
4. Duplicate both intents for `es_US` locale with Spanish utterances
5. Create `FallbackIntent` → response: "Transferring you to an agent now."
6. Build and publish bot (create version + alias `kk_lexalias_dev`)
7. Note bot alias ARN
**Definition of Done:** Bot responds correctly to test utterances in Lex console for both EN and ES.

---

**[TASK-006]**
**Title:** Contact Flows (Voice + Chat + Callback)
**Owner:** Bhautik Navdariya
**Estimate:** 75 minutes
**Steps:**
1. **Chat Flow** `kk_chatflow_dev`:
   - Set contact attributes (channel=chat)
   - Get customer input via Lex bot (`kk_lexalias_dev`)
   - On FallbackIntent: Transfer to queue `kk_queue_general_dev`
   - Enable Contact Lens for chat
2. **Voice Flow** `kk_voiceflow_dev`:
   - Play prompt: "Welcome to Kiro Insurance. For claims press 1, for policy info press 2."
   - Branch: 1 → `kk_queue_claims_dev` (proficiency routing), 2 → Lex bot → queue
   - Enable Contact Lens for voice
   - Set language (check for `es_US` locale attribute → Spanish Lex)
3. **Callback Flow** `kk_callbackflow_dev`:
   - Check queue staffing
   - If wait > 2 min: offer callback option
   - On accept: invoke Lambda `kk_fn_callback_dev`, play "We'll call you back shortly"
4. Assign voice flow to phone number, chat flow to chat channel
5. Create 2 Quick Connects: `kk_qc_claims_dev`, `kk_qc_general_dev` (queue type)
**Definition of Done:** Voice call reaches agent; chat reaches agent via widget; callback Lambda invoked.

---

**[TASK-007]**
**Title:** Callback Lambda Function
**Owner:** Bhautik Navdariya
**Estimate:** 30 minutes
**Steps:**
1. Create Lambda `kk_fn_callback_dev` (Python 3.12)
2. Function receives: `customerNumber`, `queueId`, `contactAttributes`
3. Calls `connect.start_outbound_voice_contact()` with the customer number
4. Add IAM role with `connect:StartOutboundVoiceContact` permission
5. Deploy via AWS Console or `aws lambda create-function`
**Definition of Done:** Lambda can be invoked from Contact Flow and initiates an outbound call.

---

**[TASK-008]**
**Title:** Customer Portal — Insurance Landing Page + Chat Widget
**Owner:** Himanshu Parmar
**Estimate:** 90 minutes
**Steps:**
1. Scaffold React app: `npm create vite@latest kk-portal-dev -- --template react`
2. Install Tailwind CSS, React Router
3. Create pages: `HomePage`, `ClaimsPage` (stub), `PolicyPage` (stub)
4. Design insurance-themed header (Kiro Insurance logo placeholder, nav links)
5. Add hero section: "Get instant support for your insurance needs"
6. Install `amazon-connect-chat-interface` or use Connect hosted widget script tag
7. Add floating chat button (bottom-right) that opens chat window
8. Pre-chat form: collect `customerName`, `policyNumber` as contact attributes
9. Configure widget endpoint to `kk_chatflow_dev` (use Connect instance URL)
10. Add CORS allowed origin in Connect instance settings (CloudFront URL from TASK-002)
**Definition of Done:** Chat widget opens, pre-chat form submits, chat session starts in Connect.

---

**[TASK-009]**
**Title:** Custom CCP Application — Agent Softphone
**Owner:** Mehul Parmar
**Estimate:** 90 minutes
**Steps:**
1. Scaffold React app: `npm create vite@latest kk-ccp-dev -- --template react`
2. Install Tailwind CSS, `amazon-connect-streams` npm package
3. Create Cognito login page using AWS Amplify Auth or direct Cognito Hosted UI redirect
4. On login: initialize `connect.core.initCCP()` pointing to `kk_connect_dev` instance
5. Softphone panel: render Connect CCP in hidden iframe (Streams SDK requirement)
6. Build contact panel:
   - Accept / Decline contact buttons
   - Hold / Resume button
   - End contact button
   - Transfer to Quick Connect dropdown
7. Display contact attributes: Customer Name, Policy Number, Queue Name
8. Agent status selector: Available / Break / Lunch / Offline (calls `agent.setStatus()`)
9. Style with Tailwind (dark sidebar, main contact area)
**Definition of Done:** Agent can log in, accept a chat/voice contact, control the call, and set status.

---

**[TASK-010]**
**Title:** Supervisor Dashboard — Real-Time Metrics
**Owner:** Ayush Anghan
**Estimate:** 90 minutes
**Steps:**
1. Add Dashboard route to CCP app (role-gated: Supervisors + Managers only)
2. Call `GetCurrentMetricData` API (via AWS SDK) every 30 seconds:
   - Metrics: `CONTACTS_IN_QUEUE`, `AGENTS_AVAILABLE`, `OLDEST_CONTACT_AGE`
   - For both queues
3. Display metric cards: Queue Name, Contacts Waiting, Agents Available, Oldest Contact
4. Agent status table: fetch `GetCurrentUserData`, show each agent name + status + active contact
5. Add Contact Lens link: button "View Transcripts" → opens Connect native Contact Lens URL
6. Backend note: Call Connect APIs server-side via Lambda or directly from frontend with Cognito credentials (use Amplify SDK for IAM-signed requests)
**Definition of Done:** Dashboard shows live queue stats that refresh automatically.

---

**[TASK-011]**
**Title:** Manager Configuration Page
**Owner:** Ayush Anghan
**Estimate:** 45 minutes
**Steps:**
1. Add Config route (role-gated: Managers only)
2. Toggle: Open/Close queue hours (calls `UpdateQueueHoursOfOperation` API)
3. Routing profile assignment: dropdown to change an agent's routing profile
4. Show current queue status (open/closed) with visual indicator
5. Use Amplify SDK for authenticated API calls with IAM signing
**Definition of Done:** Manager can toggle queue open/closed and see the change reflected.

---

**[TASK-012]**
**Title:** Infrastructure as Code — CloudFormation YAML
**Owner:** Jaynish Chhabhaiya
**Estimate:** 60 minutes
**Steps:**
1. Document all manually created Connect resources as CloudFormation or CDK
2. Use `AWS::Connect::Instance`, `AWS::Connect::Queue`, `AWS::Connect::RoutingProfile`
3. Use `AWS::Lex::Bot` resource for Lex bot
4. Parameterize: `Env` parameter (`dev`/`prod`), prefix `kk`
5. Naming: all resources use `!Sub "kk_${ResourceName}_${Env}"`
6. Store in `/infra/kk_stack_dev.yml`
7. Add deploy command to README
**Definition of Done:** `aws cloudformation validate-template` passes, README has deploy instructions.

---

**[TASK-013]**
**Title:** Contact Lens & Agent Evaluation Setup
**Owner:** Darshan Kalathiya
**Estimate:** 30 minutes
**Steps:**
1. Verify Contact Lens enabled on instance (from TASK-003)
2. Create evaluation form in Connect console:
   - Name: `kk_evalform_dev`
   - Questions: Call greeting, Issue resolution, Empathy (1–5 scale)
3. Enable Contact Lens on both contact flows (already in TASK-006)
4. Test: complete a call, verify transcript appears in Contact Lens console
**Definition of Done:** Post-call transcript visible in Contact Lens with sentiment score.

---

**[TASK-014]**
**Title:** QA Test Cases Document
**Owner:** Saveen Poonia
**Estimate:** 45 minutes
**Steps:**
1. Create `QA_TEST_CASES.md` in repo root
2. Write test cases for each feature:
   - Chat: customer initiates chat → bot responds → agent accepts
   - Voice: call phone number → IVR menu → routed to queue → agent answers
   - Callback: request callback → agent receives outbound call
   - Multilingual: Spanish utterance → ES bot responds
   - Proficiency routing: verify high-skill agent gets skill-required contact first
   - Supervisor dashboard: metrics update on new contact
   - Manager config: toggle queue closed, verify contacts rejected
   - CCP login: agent logs in, status shows Available
3. Format: Test ID, Description, Steps, Expected Result, Pass/Fail
**Definition of Done:** At least 15 test cases covering all must-have features.

---

**[TASK-015]**
**Title:** User Guide & Architecture Documentation
**Owner:** Saveen Poonia
**Estimate:** 45 minutes
**Steps:**
1. Create `USER_GUIDE.md`:
   - Section: Customer Portal usage (how to start a chat)
   - Section: Agent guide (login, accept contact, transfer)
   - Section: Supervisor guide (dashboard navigation)
   - Section: Manager guide (configuration page)
2. Create `ARCHITECTURE.md` with architecture diagram (embed draw.io PNG or ASCII diagram)
3. Create `DEPLOYMENT.md`:
   - Prerequisites
   - Deploy CFN stack command
   - Deploy frontends via CI/CD
   - Configure Connect instance (link to AWS docs)
4. Create root `README.md` with project overview and links
**Definition of Done:** All 4 docs exist in repo with sufficient content for evaluators.

---

**[TASK-016]**
**Title:** End-to-End Integration Testing & Bug Fixes
**Owner:** Darshan + Bhautik + Himanshu + Mehul
**Estimate:** 90 minutes (Hour 3.5–5)
**Steps:**
1. Chat E2E: Open portal → start chat → verify bot responds → type "agent" → verify contact appears in CCP → agent accepts → exchange messages → end
2. Voice E2E: Call phone number → IVR → press 1 → verify contact appears in CCP → agent answers → verify Contact Lens transcript
3. Callback E2E: Request callback in voice flow → verify outbound call placed
4. Proficiency: Start 2 contacts → verify skill-matched agent gets claim contact
5. Dashboard: Verify metrics update on new contacts
6. Multilingual: Say Spanish phrase → verify ES bot handles it
7. Log all bugs in `BUGS.md`, fix P0 issues immediately
**Definition of Done:** Chat E2E and Voice E2E fully working. All P0 bugs resolved.

---

**[TASK-017]**
**Title:** Demo Rehearsal & Environment Freeze
**Owner:** All (led by Saveen)
**Estimate:** 30 minutes (Hour 5.5–6)
**Steps:**
1. Run full demo script once end-to-end
2. Identify any last-minute issues — fix only if < 10 minutes
3. Freeze deployments (no pushes to `dev` after 5:45)
4. Confirm all CloudFront URLs work
5. Confirm test user credentials work
6. Prepare browser tabs: Portal, CCP (as agent), Dashboard (as supervisor)
**Definition of Done:** Demo runs clean in under 5 minutes with no errors.

---

# Critical Path

## Blocking Dependencies (Must Complete In Order)

```
[TASK-003: Connect Instance] 
    → [TASK-004: Queues & Profiles]
    → [TASK-005: Lex Bot]
    → [TASK-006: Contact Flows]  ← HARD BLOCKER for all E2E tests
        → [TASK-007: Callback Lambda]
        → [TASK-008: Portal Chat Widget config]
        → [TASK-009: CCP connects to instance]
        → [TASK-016: Integration Testing]

[TASK-002: S3 + CloudFront + Cognito]
    → [TASK-001: CI/CD Pipeline]
    → [TASK-008 Portal Deploy]
    → [TASK-009 CCP Deploy]
    → [TASK-010 Dashboard Deploy]
```

## Can Run Fully in Parallel
- TASK-001 (CI/CD) || TASK-003 (Connect Setup) || TASK-005 (Lex Bot) || TASK-008 (Portal UI) || TASK-009 (CCP UI) || TASK-010 (Dashboard UI) || TASK-014 (QA cases) || TASK-015 (Docs)

## Fastest Completion Sequence (Critical Path)
```
Hour 0:00 → TASK-003 (Connect instance) [30 min]
Hour 0:30 → TASK-004 (Queues) [45 min] + TASK-005 (Lex) [60 min] in parallel
Hour 1:30 → TASK-006 (Flows) [75 min]
Hour 2:45 → TASK-007 (Lambda) [30 min]
Hour 3:15 → TASK-016 (Integration) [90 min]
Hour 4:45 → TASK-017 (Demo Prep) [30 min]
Hour 5:15 → DEMO READY ✅
```

## Risk Flags
| Risk | Likelihood | Mitigation |
|---|---|---|
| Connect instance creation delayed (approval) | Medium | Start immediately at Hour 0 |
| Chat Widget CORS issues | High | Set wildcard `*` for CORS during demo, tighten later |
| Lex bot not responding correctly | Medium | Have fallback hardcoded response in flow |
| Proficiency routing complex to test | Medium | Use only 1 queue with 2 agents of different skill levels |
| Outbound campaigns not enabled on account | High | Document architecture only, skip live demo |
| CI/CD pipeline permissions issue | Low | Manual S3 deploy as fallback |

---

# Final Demo Checklist

## Must Work (Demo Blockers)
- [ ] Customer opens portal and starts a chat
- [ ] Lex bot responds with ClaimStatus or PolicyInfo intent
- [ ] Customer types "agent" and is transferred to queue
- [ ] Agent accepts chat in custom CCP
- [ ] Agent and customer exchange messages
- [ ] Agent ends the contact
- [ ] Supervisor dashboard shows queue metrics (live)
- [ ] Voice call reaches the Connect IVR menu
- [ ] Contact Lens transcript visible after a call
- [ ] CI/CD pipeline is green (portal deployed via GitHub Actions)
- [ ] All resource names follow `kk_*_dev` convention

## Optional (If Time Remains)
- [ ] Callback flow demonstrated live
- [ ] Spanish language bot responding
- [ ] Manager config page toggles queue
- [ ] Agent evaluation form filled post-call
- [ ] Proficiency routing demonstrated with 2 agents

## Known Limitations (To State During Demo)
- Outbound campaigns: architecture documented, not live (requires account feature enablement)
- Voicemail: not implemented in MVP (Lambda + S3 architecture designed, not built)
- Production environment (`_prod`): IaC ready, not deployed within contest window
- Full QA automation: manual test cases only, no automated test suite
- UI is functional/clean but not pixel-perfect
- Manager config page uses direct Connect API calls (no middleware layer)

---

*Document prepared by: Claude Code (Senior Engineering Manager + Solution Architect mode)*
*Team: Kiro Krafters | Event: AI Application Development Challenge*
*Naming prefix: `kk` | Environment: `dev`*
