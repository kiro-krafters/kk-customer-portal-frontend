# Chat Widget Architecture

## Overview
The chat widget uses a two-phase approach:
1. **AI Bot Phase**: User interacts with AI bot via `/ai/message` API
2. **Agent Transfer Phase**: When bot returns `transferRequired: true` or user clicks "Talk to Agent", Connect ChatJS takes over

## Flow

### Phase 1: Pre-Chat Form
- User fills out: name, policy number, issue type, language
- Form data is stored for later use

### Phase 2: Connecting (`phase: 'connecting'`)
- Calls `POST /portal/chat/start` to create session
- Receives `sessionId`, `contactId`, `participantToken`
- Shows loading spinner

### Phase 3: AI Bot Chat (`phase: 'bot'`)
- User chats with AI bot via `POST /ai/message`
- Each message sent to bot API with `sessionId`, `text`, `locale`
- Bot responds with `botResponse` and `transferRequired` flag
- Quick replies available: "Claim Status", "Policy Details", "Billing", "Talk to Agent"

### Phase 4: Transfer to Agent (`phase: 'transferring'`)
- Triggered when:
  - Bot API returns `transferRequired: true`
  - User clicks "Talk to Agent" button
- Initializes amazon-connect-chatjs session with existing `sessionId`
- Shows "Connecting to agent..." message

### Phase 5: Agent Chat (`phase: 'agent'`)
- Real-time messaging via Connect ChatJS SDK
- Messages sent via `session.sendMessage()`
- Messages received via `session.onMessage()` event
- Agent messages appear with green styling

### Phase 6: Chat Ended (`phase: 'ended'`)
- User can start a new chat or close widget

## API Usage

### 1. Start Session (on form submit)
```typescript
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
```

### 2. Chat with AI Bot (during bot phase)
```typescript
POST /ai/message
{
  sessionId: string,
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

### 3. Connect ChatJS (during agent phase)
```typescript
// Initialize session
const session = window.connect.ChatSession.create({
  chatDetails: {
    contactId: result.contactId,
    participantId: result.sessionId,
    participantToken: result.participantToken,
  },
  type: 'CUSTOMER',
  options: { region: 'us-east-1' }
});

// Send message
session.sendMessage({
  contentType: 'text/plain',
  message: 'Hello'
});

// Receive messages
session.onMessage((event) => {
  // event.data.Content, event.data.ParticipantRole
});
```

## Key Features

1. **Single session throughout**: Session created at start, used for both bot and agent phases
2. **Automatic transfer**: Bot API controls when to transfer via `transferRequired` flag
3. **Real-time agent chat**: WebSocket-based via Connect ChatJS
4. **No polling**: Bot responses come from API, agent messages via WebSocket events
5. **Seamless transition**: Same session ID used for bot API and Connect ChatJS

## Benefits
1. **Consistent session**: One session from start to finish
2. **Bot-controlled transfer**: Backend decides when to escalate
3. **Real-time agent chat**: No polling delays
4. **Simpler code**: Clear phase transitions
5. **Better UX**: Fast bot responses, seamless agent handoff
