# Chat Widget Architecture - Final

## Overview
Two-phase chat system:
1. **Bot Phase**: AI bot via `/ai/message` API (no Connect session)
2. **Agent Phase**: Real-time chat via amazon-connect-chatjs (WebSocket)

## Flow

### Phase 1: Pre-Chat Form (`phase: 'form'`)
- User fills: name, policy number, issue type, language
- Form data stored for later
- **No API calls**

### Phase 2: AI Bot Chat (`phase: 'bot'`)
- Local greeting shown immediately
- User chats with AI bot via `POST /ai/message`
- Uses temporary sessionId: `temp-{timestamp}`
- Bot responds with `botResponse` and `transferRequired` flag
- Quick replies: "Claim Status", "Policy Details", "Billing", "Talk to Agent"
- **No Connect session created**

### Phase 3: Transfer to Agent (`phase: 'connecting'`)
- Triggered when:
  - Bot API returns `transferRequired: true`, OR
  - User clicks "Talk to Agent" button
- Calls `POST /portal/chat/start` → gets `sessionId`, `contactId`, `participantToken`
- Initializes amazon-connect-chatjs with session details
- Connects via WebSocket
- Shows "Connecting to agent..." message

### Phase 4: Agent Chat (`phase: 'agent'`)
- Real-time messaging via Connect ChatJS
- User sends: `session.sendMessage({ contentType: 'text/plain', message: txt })`
- Receives via: `session.onMessage((event) => { ... })`
- Agent messages styled with green background
- **No polling - pure WebSocket**

### Phase 5: Chat Ended (`phase: 'ended'`)
- Calls `session.disconnectParticipant()`
- User can start new chat or close widget

## API Calls

### Bot Phase (No Connect Session)
```typescript
POST /ai/message
{
  sessionId: "temp-{timestamp}",  // Temporary ID
  text: string,
  locale: 'en_US' | 'es_US'
}

Response:
{
  transferRequired: boolean,
  botResponse: string,
  intent?: string,
  slots?: Record<string, string>
}
```

### Agent Transfer (Creates Connect Session)
```typescript
// 1. Start session (ONLY when transferring to agent)
POST /portal/chat/start
{
  customerName: string,
  policyNumber: string,
  topic: string,
  language: 'en' | 'es'
}

Response:
{
  sessionId: string,
  contactId: string,
  participantToken: string
}

// 2. Initialize Connect ChatJS
const session = window.connect.ChatSession.create({
  chatDetails: {
    contactId: result.contactId,
    participantId: result.sessionId,
    participantToken: result.participantToken,
  },
  type: 'CUSTOMER',
  options: { region: 'us-east-1' }
});

// 3. Listen for messages
session.onMessage((event) => {
  // event.data.Content
  // event.data.ParticipantRole: 'AGENT' | 'BOT' | 'SYSTEM'
});

// 4. Connect
await session.connect();

// 5. Send messages
session.sendMessage({
  contentType: 'text/plain',
  message: 'Hello'
});

// 6. Disconnect
session.disconnectParticipant();
```

## Key Features

1. **Lazy session creation**: `/portal/chat/start` only called when transferring to agent
2. **Fast bot responses**: AI bot API responds quickly, no Connect overhead
3. **Real-time agent chat**: WebSocket-based via Connect ChatJS
4. **No polling**: All agent messages via WebSocket events
5. **Automatic transfer**: Bot API controls escalation via `transferRequired` flag

## Benefits

1. **Cost efficient**: Connect sessions only for agent conversations
2. **Fast bot phase**: No session creation delay
3. **Real-time agent chat**: WebSocket = instant messages
4. **Simple architecture**: Clear separation between bot and agent phases
5. **Scalable**: Bot handles most queries, agents only when needed

## Event Listeners

```typescript
// Connection established
session.onConnectionEstablished(() => {
  console.log('Connected to agent');
  setPhase('agent');
});

// Incoming messages
session.onMessage((event) => {
  const { Content, ParticipantRole, Id, AbsoluteTime } = event.data;
  // Display message in UI
});

// Connection broken
session.onConnectionBroken(() => {
  console.log('Connection lost');
  // Show error message
});
```
