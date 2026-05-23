# Chat Widget Architecture - Final

## Flow

### Phase 1: Pre-Chat Form (`phase: 'form'`)
- User fills out: name, policy number, issue type, language
- Form data stored for later use
- **No API calls yet**

### Phase 2: AI Bot Chat (`phase: 'bot'`)
- Local greeting shown immediately
- User chats with AI bot via `POST /ai/message`
- Each message sent with temporary `sessionId`, `text`, `locale`
- Bot responds with `botResponse` and `transferRequired` flag
- Quick replies: "Claim Status", "Policy Details", "Billing", "Talk to Agent"
- **No Connect session yet**

### Phase 3: Transfer to Agent (`phase: 'connecting'`)
- Triggered when:
  - Bot API returns `transferRequired: true`, OR
  - User clicks "Talk to Agent" button
- Calls `POST /portal/chat/start` to create Connect session
- Receives `sessionId`, `contactId`, `participantToken`
- Starts polling `GET /portal/chat/{sessionId}/messages` every 2s
- Sends "I want to talk to an agent" via `POST /portal/chat/{sessionId}/message`
- Shows "Waiting for agent..." spinner

### Phase 4: Agent Chat (`phase: 'agent'`)
- Polling detects `ParticipantRole: "AGENT"` → switches to agent phase
- User sends messages via `POST /portal/chat/{sessionId}/message`
- Polling receives all messages (bot, customer, agent, system)
- Agent messages styled with green background
- Real-time conversation via polling

### Phase 5: Chat Ended (`phase: 'ended'`)
- Calls `DELETE /portal/chat/{sessionId}`
- User can start new chat or close widget

## API Calls

### Bot Phase (no session)
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

### Agent Transfer (creates session)
```typescript
// 1. Start session
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

// 2. Poll for messages (every 2s)
GET /portal/chat/{sessionId}/messages

Response:
{
  messages: [
    {
      Id: string,
      Type: 'MESSAGE',
      Content: string,
      ParticipantRole: 'CUSTOMER' | 'BOT' | 'AGENT' | 'SYSTEM',
      AbsoluteTime: string
    }
  ]
}

// 3. Send messages
POST /portal/chat/{sessionId}/message
{
  message: string,
  contentType: 'text/plain'
}

// 4. End chat
DELETE /portal/chat/{sessionId}
```

## Key Features

1. **Two-phase approach**: AI bot first (no session), then Connect (with session)
2. **Lazy session creation**: Connect session only created when transferring to agent
3. **Polling-based**: All messages (bot, agent, system) come through polling
4. **No duplicates**: Tracks seen message IDs to prevent duplicates
5. **Automatic agent detection**: Switches to agent phase when `ParticipantRole: "AGENT"` detected

## Benefits

1. **Cost efficient**: Only creates Connect sessions when needed
2. **Fast bot responses**: AI bot API responds quickly
3. **Seamless transfer**: Same UI, smooth transition to agent
4. **Simple architecture**: Clear phases, straightforward polling
5. **No WebSocket complexity**: Standard HTTP polling works reliably
