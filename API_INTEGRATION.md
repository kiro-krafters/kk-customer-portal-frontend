# Kiro Krafters Backend — API Integration Guide

## Overview

This document contains all API endpoints for the three frontend applications. Share this file with your AI assistant to integrate the backend.

**Base URL:** `https://t8gk26tj5c.execute-api.us-east-1.amazonaws.com/dev`

---

## Error Response Format (all endpoints)

```json
{ "success": false, "error": "descriptive error message" }
```

| Status Code | Meaning |
|-------------|---------|
| `400` | Bad or missing input |
| `401` | No token or invalid token |
| `403` | Valid token but insufficient role |
| `404` | Resource not found |
| `500` | Server error |

---

---

# CUSTOMER PORTAL APIs

**App:** `kk-portal-dev`  
**CloudFront URL:** `https://d1o9f0v18fkel6.cloudfront.net`  
**Auth:** None required — all endpoints are public  
**Local dev port:** `3001`

---

## Health Check

```
GET /health
```

**Response**
```json
{ "success": true, "data": { "status": "ok", "service": "kk-backend" } }
```

---

## 1. Start Chat Session

Call this when the customer submits the pre-chat form.

```
POST /portal/chat/start
```

**Request Body**
```json
{
  "customerName": "John Doe",
  "policyNumber": "POL-12345",
  "topic": "Claims",
  "language": "en"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `customerName` | Yes | |
| `policyNumber` | Yes | |
| `topic` | No | e.g. `"Claims"`, `"Billing"` |
| `language` | No | `"en"` (default) or `"es"` |

**Response**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "contactId": "abc123",
    "participantToken": "eyJ..."
  }
}
```

> **Important:** Save `sessionId` in local state — it is required for all subsequent chat calls.

---

## 2. Send Chat Message

Call this every time the customer sends a message.

```
POST /portal/chat/{sessionId}/message
```

**Request Body**
```json
{
  "message": "I want to check my claim status",
  "contentType": "text/plain"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `message` | Yes | |
| `contentType` | No | Defaults to `"text/plain"` |

**Response**
```json
{ "success": true, "data": { "sent": true } }
```

---

## 3. Get Chat Messages (Transcript)

Poll this to display the conversation — includes customer, bot, and agent messages.

```
GET /portal/chat/{sessionId}/messages
```

**Response**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "Id": "msg-001",
        "Type": "MESSAGE",
        "Content": "Hello! How can I help you today?",
        "DisplayName": "Bot",
        "ParticipantRole": "BOT",
        "AbsoluteTime": "2025-01-01T10:00:00.000Z"
      },
      {
        "Id": "msg-002",
        "Type": "MESSAGE",
        "Content": "Check my claim status",
        "DisplayName": "John Doe",
        "ParticipantRole": "CUSTOMER",
        "AbsoluteTime": "2025-01-01T10:00:05.000Z"
      }
    ]
  }
}
```

| `ParticipantRole` value | Meaning |
|------------------------|---------|
| `CUSTOMER` | Message from the customer |
| `BOT` | Message from the AI bot |
| `AGENT` | Message from a live agent |
| `SYSTEM` | System event (e.g. agent joined) |

> **Suggested polling interval:** Every 2–3 seconds while the chat is active.

---

## 4. End Chat Session

Call this when the customer clicks "End Chat" or closes the chat window.

```
DELETE /portal/chat/{sessionId}
```

**No request body required.**

**Response**
```json
{ "success": true, "data": { "ended": true } }
```

---

## 5. Send Message to AI Bot

Call this **in parallel with every message send** (API #2) to get the bot's response and check if a human agent transfer is needed.

```
POST /ai/message
```

**Request Body**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "text": "I want to check my claim status",
  "locale": "en_US"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `sessionId` | Yes | From step 1 |
| `text` | Yes | The customer's message |
| `locale` | No | `"en_US"` (default) or `"es_US"` |

**Response — Bot Reply**
```json
{
  "success": true,
  "data": {
    "transferRequired": false,
    "botResponse": "Your claim POL-12345 is currently under review. Expected resolution is within 5 business days.",
    "intent": "ClaimStatus",
    "slots": {
      "ClaimNumber": "POL-12345"
    }
  }
}
```

**Response — Transfer Needed**
```json
{
  "success": true,
  "data": {
    "transferRequired": true,
    "botResponse": "Let me connect you with a live agent who can help you further.",
    "intent": "FallbackIntent"
  }
}
```

> **Action:** Display `botResponse` in the chat UI. If `transferRequired === true`, immediately call API #6 (Transfer to Agent).

---

## 6. Transfer to Human Agent

Call this when `transferRequired: true` is returned from the AI bot (API #5), or when the customer explicitly clicks "Talk to an Agent".

```
POST /ai/transfer
```

**Request Body**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "queue": "claims",
  "reason": "customer_requested"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `sessionId` | Yes | From step 1 |
| `queue` | No | `"claims"` or `"general"` (default: `"general"`) |
| `reason` | No | `"customer_requested"` or `"bot_fallback"` |

**Response**
```json
{
  "success": true,
  "data": {
    "transferred": true,
    "queue": "claims",
    "message": "Connecting you to an agent. Please hold."
  }
}
```

> **After transfer:** Show a "Connecting to an agent…" state in the UI. Continue polling the transcript (API #3) — the agent's messages will appear there automatically.

---

## 7. Request Callback

Call this when the customer submits the callback request form.

```
POST /portal/callback
```

**Request Body**
```json
{
  "customerPhone": "+12125550100",
  "customerName": "John Doe",
  "policyNumber": "POL-12345",
  "topic": "Claims"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `customerPhone` | Yes | E.164 format e.g. `+12125550100` |
| `customerName` | Yes | |
| `policyNumber` | No | |
| `topic` | No | |

**Response**
```json
{
  "success": true,
  "data": {
    "callbackId": "550e8400-e29b-41d4-a716-446655440001",
    "status": "initiated"
  }
}
```

---

## 8. Submit Contact / Enquiry Form

Call this when the customer submits a general enquiry form (not a live chat).

```
POST /portal/contact
```

**Request Body**
```json
{
  "customerName": "John Doe",
  "email": "john@example.com",
  "phone": "+12125550100",
  "policyNumber": "POL-12345",
  "subject": "Billing Query",
  "message": "I have a question about my recent bill."
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `customerName` | Yes | |
| `email` | Yes | |
| `message` | Yes | |
| `phone` | No | |
| `policyNumber` | No | |
| `subject` | No | |

**Response**
```json
{
  "success": true,
  "data": {
    "contactId": "550e8400-e29b-41d4-a716-446655440002",
    "status": "submitted"
  }
}
```

---

## Customer Portal — Integration Flow

```
Step 1:  Customer fills pre-chat form
         → POST /portal/chat/start
         → Store sessionId in state

Step 2:  Customer types a message
         → POST /portal/chat/{sessionId}/message   (deliver to Connect)
         → POST /ai/message                         (get bot response — run in parallel)
         → Display botResponse in chat UI

Step 3:  Poll for new messages
         → GET /portal/chat/{sessionId}/messages   (every 3 seconds)

Step 4:  If transferRequired === true (from Step 2)
         → POST /ai/transfer
         → Show "Connecting to an agent..." state
         → Keep polling messages — agent replies appear in transcript

Step 5:  Customer ends chat
         → DELETE /portal/chat/{sessionId}
```

---

---

# CCP APP APIs

**App:** `kk-ccp-dev`  
**CloudFront URL:** `https://d2guk5gxqgnemr.cloudfront.net`  
**Auth:** `Authorization: Bearer <Cognito JWT>` required on all routes  
**Local dev port:** `3002`

---

## Role Hierarchy

| Cognito Group | Role | Access Level |
|---------------|------|-------------|
| `kk_agents_dev` | Agent | Basic agent view |
| `kk_supervisors_dev` | Supervisor | Agent + metrics + team view |
| `kk_managers_dev` | Manager | Supervisor + config changes |

> Roles are enforced server-side. A `403` is returned if the token's role is insufficient.

---

## 1. Get Live Queue Metrics

```
GET /metrics
```

**Minimum role:** Supervisor

**Response**
```json
{
  "success": true,
  "data": {
    "metricResults": [
      {
        "Dimensions": {
          "Queue": { "Id": "5d07050b-4bd7-49d9-b5ff-b3a34c178a3e", "Arn": "arn:aws:connect:..." }
        },
        "Collections": [
          { "Metric": { "Name": "CONTACTS_IN_QUEUE" }, "Value": 5 },
          { "Metric": { "Name": "CONTACTS_SCHEDULED" }, "Value": 2 },
          { "Metric": { "Name": "AGENTS_AVAILABLE" }, "Value": 3 },
          { "Metric": { "Name": "AGENTS_ON_CONTACT" }, "Value": 4 },
          { "Metric": { "Name": "OLDEST_CONTACT_AGE" }, "Value": 120 }
        ]
      }
    ]
  }
}
```

---

## 2. List Agents

```
GET /agents
```

**Minimum role:** Supervisor

**Response**
```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "UserId": "0eb04d42-dba7-42b2-89ce-2aff7f74e21c",
        "Username": "agent1",
        "RoutingProfileId": "d612fa86-bd09-4be9-88c2-e2a416112100",
        "Status": { "StatusName": "Available", "StatusStartTimestamp": "2025-01-01T09:00:00Z" },
        "ActiveContactCount": 1
      }
    ]
  }
}
```

---

## 3. Update Agent Routing Profile

```
PUT /agents/{agentId}/routing-profile
```

**Minimum role:** Manager

**Request Body**
```json
{ "routingProfileId": "d612fa86-bd09-4be9-88c2-e2a416112100" }
```

**Response**
```json
{ "success": true, "data": { "updated": true } }
```

---

## 4. Update Agent Proficiency

```
PUT /agents/{agentId}/proficiency
```

**Minimum role:** Manager

**Request Body**
```json
{
  "proficiencies": [
    { "AttributeName": "InsuranceClaims", "AttributeValue": "4", "Level": 4 }
  ]
}
```

**Response**
```json
{ "success": true, "data": { "updated": true } }
```

---

## 5. List Queues

```
GET /queues
```

**Minimum role:** Supervisor

**Response**
```json
{
  "success": true,
  "data": {
    "queues": [
      {
        "QueueId": "5d07050b-4bd7-49d9-b5ff-b3a34c178a3e",
        "Name": "General",
        "QueueType": "STANDARD",
        "HoursOfOperationId": "cb7d22b7-a3b2-4164-a568-260cd5af3378",
        "MaxContacts": 10,
        "Status": "ENABLED"
      }
    ]
  }
}
```

---

## 6. Update Queue Hours of Operation

```
PUT /queues/{queueId}/hours
```

**Minimum role:** Manager

**Request Body**
```json
{ "hoursOfOperationId": "cb7d22b7-a3b2-4164-a568-260cd5af3378" }
```

**Response**
```json
{ "success": true, "data": { "updated": true } }
```

---

## 7. Get Customer Contact History

```
GET /contacts/{customerId}
```

**Minimum role:** Agent

**Response**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "ContactId": "contact-abc-123",
        "Channel": "CHAT",
        "InitiationTimestamp": "2025-01-01T10:00:00Z",
        "DisconnectTimestamp": "2025-01-01T10:25:00Z",
        "AgentInfo": { "Id": "0eb04d42-...", "ConnectedToAgentTimestamp": "..." },
        "QueueInfo": { "Id": "5d07050b-..." }
      }
    ],
    "history": [
      {
        "customerId": "john@example.com",
        "contactId": "contact-abc-123",
        "channel": "CHAT",
        "duration": 1500,
        "summary": "Customer inquired about claim POL-12345",
        "agentName": "agent1",
        "resolvedAt": "2025-01-01T10:25:00Z"
      }
    ]
  }
}
```

---

## 8. Initiate Outbound Call (Callback)

```
POST /callback
```

**Minimum role:** Agent

**Request Body**
```json
{
  "customerPhone": "+12125550100",
  "queueId": "5d07050b-4bd7-49d9-b5ff-b3a34c178a3e"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `customerPhone` | Yes | E.164 format |
| `queueId` | No | Defaults to General queue |

**Response**
```json
{ "success": true, "data": { "contactId": "contact-xyz-456" } }
```

---

## 9. Get Bot Performance Stats

```
GET /bot/stats
```

**Minimum role:** Manager

**Query Parameters**

| Param | Required | Example |
|-------|----------|---------|
| `startTime` | No | `2025-01-01T00:00:00Z` (default: 7 days ago) |
| `endTime` | No | `2025-01-08T00:00:00Z` (default: now) |

**Response**
```json
{
  "success": true,
  "data": {
    "stats": [
      { "intentName": "ClaimStatus", "invocations": 120, "missed": 5, "successRate": 95.8 },
      { "intentName": "PolicyInfo", "invocations": 80, "missed": 3, "successRate": 96.3 },
      { "intentName": "FallbackIntent", "invocations": 15, "missed": 0, "successRate": 100 }
    ]
  }
}
```

---

---

# ADMIN PORTAL APIs

**App:** `kk-admin-dev`  
**CloudFront URL:** `https://d3kc2pjxqdt25w.cloudfront.net`  
**Auth:** `Authorization: Bearer <Cognito JWT>` — token must belong to `kk_admins_dev` group  
**Local dev port:** `3003`

> All mutating endpoints (`POST`, `PUT`, `DELETE`) automatically write an entry to the audit log.

---

## 1. Get CCP Embed Config

Call this on app load to initialize the Amazon Connect softphone widget inside the admin portal.

```
GET /admin/ccp-config
```

**Response**
```json
{
  "success": true,
  "data": {
    "ccpUrl": "https://ai-app-development-2026.my.connect.aws/ccp-v2",
    "instanceArn": "arn:aws:connect:us-east-1:572805506593:instance/c32edc77-03b2-4b2b-a034-e8db15ed6bc6",
    "loginPopup": true,
    "softphone": { "allowFramedSoftphone": true },
    "features": { "contactRecording": { "allowAgentToRecord": false } }
  }
}
```

> Use the returned config to call `connect.core.initCCP(container, config)` from `amazon-connect-streams`.

---

## User Management

### 2. List All Users

```
GET /admin/users
```

**Query Parameters**

| Param | Required | Notes |
|-------|----------|-------|
| `maxResults` | No | Default `50`, max `100` |
| `nextToken` | No | Pagination token from previous response |

**Response**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "UserId": "0eb04d42-dba7-42b2-89ce-2aff7f74e21c",
        "Username": "agent1",
        "Email": "agent1@demo.com",
        "FirstName": "Agent",
        "LastName": "One",
        "RoutingProfileId": "d612fa86-...",
        "SecurityProfileIds": ["8a984a90-..."],
        "CognitoGroup": "kk_agents_dev",
        "Enabled": true
      }
    ],
    "nextToken": null
  }
}
```

---

### 3. Create User

Creates the user in both Amazon Connect and Cognito, and assigns them to the specified Cognito group.

```
POST /admin/users
```

**Request Body**
```json
{
  "username": "agent2",
  "email": "agent2@demo.com",
  "password": "TempPass@123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+12125550101",
  "routingProfileId": "d612fa86-bd09-4be9-88c2-e2a416112100",
  "securityProfileId": "8a984a90-ef96-403b-be10-5e075aab7edb",
  "cognitoGroup": "kk_agents_dev"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `username` | Yes | Must be unique |
| `email` | Yes | Must be unique |
| `password` | Yes | Must meet Cognito password policy |
| `firstName` | Yes | |
| `lastName` | Yes | |
| `routingProfileId` | Yes | See routing profiles endpoint |
| `securityProfileId` | Yes | See security profiles endpoint |
| `cognitoGroup` | Yes | See group values below |
| `phoneNumber` | No | E.164 format |

**`cognitoGroup` values**

| Value | Role |
|-------|------|
| `kk_agents_dev` | Agent |
| `kk_supervisors_dev` | Supervisor |
| `kk_managers_dev` | Manager |
| `kk_admins_dev` | Admin |

**Response**
```json
{
  "success": true,
  "data": {
    "userId": "new-user-uuid",
    "username": "agent2"
  }
}
```

---

### 4. Get Single User

```
GET /admin/users/{userId}
```

**Response**
```json
{
  "success": true,
  "data": {
    "UserId": "0eb04d42-...",
    "Username": "agent1",
    "Email": "agent1@demo.com",
    "FirstName": "Agent",
    "LastName": "One",
    "PhoneNumber": "+12125550100",
    "RoutingProfileId": "d612fa86-...",
    "SecurityProfileIds": ["8a984a90-..."],
    "CognitoGroup": "kk_agents_dev",
    "Enabled": true,
    "CreatedAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### 5. Update User

```
PUT /admin/users/{userId}
```

**Request Body** (all fields optional — send only what you want to change)
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@demo.com",
  "phoneNumber": "+12125550199",
  "routingProfileId": "d612fa86-bd09-4be9-88c2-e2a416112100"
}
```

**Response**
```json
{ "success": true, "data": { "updated": true } }
```

---

### 6. Delete User

Deletes the user from Connect and disables them in Cognito.

```
DELETE /admin/users/{userId}
```

**Response**
```json
{ "success": true, "data": { "deleted": true } }
```

---

### 7. Change User Role / Group

```
PUT /admin/users/{userId}/group
```

**Request Body**
```json
{
  "group": "kk_supervisors_dev",
  "previousGroup": "kk_agents_dev"
}
```

**Response**
```json
{ "success": true, "data": { "updated": true } }
```

---

## Queue Management

### 8. List All Queues

```
GET /admin/queues
```

**Response**
```json
{
  "success": true,
  "data": {
    "queues": [
      {
        "QueueId": "5d07050b-4bd7-49d9-b5ff-b3a34c178a3e",
        "Name": "General",
        "Description": "General inquiries queue",
        "QueueType": "STANDARD",
        "HoursOfOperationId": "cb7d22b7-...",
        "MaxContacts": 10,
        "Status": "ENABLED"
      }
    ]
  }
}
```

---

### 9. Create Queue

```
POST /admin/queues
```

**Request Body**
```json
{
  "name": "Billing",
  "hoursOfOperationId": "cb7d22b7-a3b2-4164-a568-260cd5af3378",
  "maxContacts": 10,
  "description": "Billing inquiries"
}
```

**Response**
```json
{ "success": true, "data": { "queueId": "new-queue-uuid", "name": "Billing" } }
```

---

### 10. Update Queue

```
PUT /admin/queues/{queueId}
```

**Request Body** (all fields optional)
```json
{
  "name": "Billing Updated",
  "hoursOfOperationId": "cb7d22b7-a3b2-4164-a568-260cd5af3378",
  "maxContacts": 15,
  "description": "Updated billing queue"
}
```

**Response**
```json
{ "success": true, "data": { "updated": true } }
```

---

## Routing Profiles

### 11. List Routing Profiles

```
GET /admin/routing-profiles
```

**Response**
```json
{
  "success": true,
  "data": {
    "routingProfiles": [
      {
        "RoutingProfileId": "d612fa86-bd09-4be9-88c2-e2a416112100",
        "Name": "kk_rp_agent_dev",
        "DefaultOutboundQueueId": "5d07050b-...",
        "MediaConcurrencies": [
          { "Channel": "VOICE", "Concurrency": 1 },
          { "Channel": "CHAT", "Concurrency": 3 }
        ]
      }
    ]
  }
}
```

---

### 12. Create Routing Profile

```
POST /admin/routing-profiles
```

**Request Body**
```json
{
  "name": "Claims Specialists",
  "description": "Profile for claims team",
  "defaultOutboundQueueId": "f5e46446-af9f-4312-a2c6-4d341a2658ac",
  "mediaConcurrencies": [
    { "Channel": "VOICE", "Concurrency": 1 },
    { "Channel": "CHAT", "Concurrency": 2 }
  ],
  "queueConfigs": [
    {
      "QueueId": "f5e46446-af9f-4312-a2c6-4d341a2658ac",
      "Priority": 1,
      "Delay": 0,
      "Channel": "VOICE"
    }
  ]
}
```

**Response**
```json
{ "success": true, "data": { "routingProfileId": "new-rp-uuid", "name": "Claims Specialists" } }
```

---

### 13. Update Routing Profile

```
PUT /admin/routing-profiles/{routingProfileId}
```

**Request Body** (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "defaultOutboundQueueId": "5d07050b-...",
  "queueConfigs": [
    { "QueueId": "5d07050b-...", "Priority": 1, "Delay": 0, "Channel": "VOICE" }
  ]
}
```

**Response**
```json
{ "success": true, "data": { "updated": true } }
```

---

## Security Profiles & Contact Flows

### 14. List Security Profiles

```
GET /admin/security-profiles
```

**Response**
```json
{
  "success": true,
  "data": {
    "securityProfiles": [
      { "Id": "8a984a90-ef96-403b-be10-5e075aab7edb", "Name": "Agent" },
      { "Id": "e1756aed-33ac-42a4-b77d-a88f18c9cc42", "Name": "Supervisor" },
      { "Id": "75f76ece-1464-4d72-ba1d-688e61383582", "Name": "Manager" }
    ]
  }
}
```

---

### 15. List Contact Flows

```
GET /admin/contact-flows
```

**Response**
```json
{
  "success": true,
  "data": {
    "contactFlows": [
      {
        "Id": "8f44dd44-f05f-4440-bb7b-241f9f0687e4",
        "Name": "kk_chat_flow_dev",
        "Type": "CONTACT_FLOW",
        "State": "ACTIVE"
      }
    ]
  }
}
```

---

## Analytics

### 16. Historical Metrics

```
GET /admin/analytics/historical
```

**Query Parameters**

| Param | Required | Notes |
|-------|----------|-------|
| `startTime` | No | ISO 8601. Default: 7 days ago |
| `endTime` | No | ISO 8601. Default: now |

**Response**
```json
{
  "success": true,
  "data": {
    "startTime": "2025-01-01T00:00:00.000Z",
    "endTime": "2025-01-08T00:00:00.000Z",
    "metricResults": [
      {
        "Dimensions": {
          "Queue": { "Id": "5d07050b-...", "Arn": "arn:aws:connect:..." },
          "Channel": "VOICE"
        },
        "MetricInterval": {
          "StartTime": "2025-01-01T00:00:00Z",
          "EndTime": "2025-01-02T00:00:00Z"
        },
        "Collections": [
          { "Metric": { "Name": "CONTACTS_HANDLED" }, "Value": 250 },
          { "Metric": { "Name": "CONTACTS_ABANDONED" }, "Value": 12 },
          { "Metric": { "Name": "AVG_HANDLE_TIME" }, "Value": 312 },
          { "Metric": { "Name": "AVG_QUEUE_ANSWER_TIME" }, "Value": 45 }
        ]
      }
    ]
  }
}
```

---

### 17. Contact Search

```
GET /admin/analytics/contacts
```

**Query Parameters**

| Param | Required | Notes |
|-------|----------|-------|
| `startTime` | No | Default: 24 hours ago |
| `endTime` | No | Default: now |
| `maxResults` | No | Default `50`, max `100` |
| `nextToken` | No | Pagination |

**Response**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "ContactId": "abc123",
        "Channel": "VOICE",
        "InitiationTimestamp": "2025-01-01T10:00:00Z",
        "DisconnectTimestamp": "2025-01-01T10:20:00Z",
        "AgentInfo": { "Id": "0eb04d42-..." },
        "QueueInfo": { "Id": "5d07050b-..." }
      }
    ],
    "totalCount": 87,
    "nextToken": null
  }
}
```

---

### 18. Analytics Summary (24h)

```
GET /admin/analytics/summary
```

**Response**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "totalContacts": 87,
    "contactsHandled": 80,
    "contactsAbandoned": 7,
    "avgHandleTimeSeconds": 295
  }
}
```

---

## Audit Logs

### 19. List Audit Logs

```
GET /admin/audit-logs
```

**Query Parameters**

| Param | Required | Notes |
|-------|----------|-------|
| `adminId` | No | Filter by admin email. Enables efficient index query |
| `startDate` | No | ISO 8601. Used with `adminId` filter |
| `endDate` | No | ISO 8601. Defaults to now if `startDate` provided |
| `limit` | No | Default `50` |

**Response**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "adminId": "admin1@demo.com",
        "timestampAction": "2025-01-01T10:00:00.000Z#CREATE_USER",
        "action": "CREATE_USER",
        "resourceType": "user",
        "resourceId": "new-user-uuid",
        "oldValue": null,
        "newValue": { "username": "agent2", "group": "kk_agents_dev" },
        "ip": "203.0.113.42"
      }
    ],
    "count": 1
  }
}
```

---

---

## Reference: AWS Resource IDs

These are pre-configured values you may need to pass in API calls.

| Resource | ID |
|----------|----|
| Connect Instance ID | `c32edc77-03b2-4b2b-a034-e8db15ed6bc6` |
| General Queue ID | `5d07050b-4bd7-49d9-b5ff-b3a34c178a3e` |
| Claims Queue ID | `f5e46446-af9f-4312-a2c6-4d341a2658ac` |
| Agent Routing Profile ID | `d612fa86-bd09-4be9-88c2-e2a416112100` |
| Supervisor Routing Profile ID | `b36d37fc-c106-4765-b3fc-2018e95d3c56` |
| Agent Security Profile ID | `8a984a90-ef96-403b-be10-5e075aab7edb` |
| Supervisor Security Profile ID | `e1756aed-33ac-42a4-b77d-a88f18c9cc42` |
| Manager Security Profile ID | `75f76ece-1464-4d72-ba1d-688e61383582` |
| Hours of Operation ID | `cb7d22b7-a3b2-4164-a568-260cd5af3378` |
| Cognito User Pool ID | `us-east-1_wu6MlqiRs` |
| Cognito App Client ID | `5mkstu44ijertt5aeqdbh9dvf8` |
| Cognito Domain | `kk-auth-dev-572805506593.auth.us-east-1.amazoncognito.com` |

---

## Reference: Test Accounts

| Email | Password | Group | Role |
|-------|----------|-------|------|
| `agent1@demo.com` | `Demo@1234` | `kk_agents_dev` | Agent |
| `super1@demo.com` | `Demo@1234` | `kk_supervisors_dev` | Supervisor |
| `manager1@demo.com` | `Demo@1234` | `kk_managers_dev` | Manager |
| `admin1@demo.com` | `Demo@1234` | `kk_admins_dev` | Admin |
