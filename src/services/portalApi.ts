const BASE_URL = 'https://t8gk26tj5c.execute-api.us-east-1.amazonaws.com/dev';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? 'Request failed');
  return json.data as T;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface StartChatRequest {
  customerName: string;
  policyNumber: string;
  topic?: string;
  language?: 'en' | 'es';
}

export interface StartChatResponse {
  sessionId: string;
  contactId: string;
  participantToken: string;
}

export interface ChatMessage {
  Id: string;
  Type: string;
  Content: string;
  DisplayName: string;
  ParticipantRole: 'CUSTOMER' | 'BOT' | 'AGENT' | 'SYSTEM';
  AbsoluteTime: string;
}

export interface TranscriptResponse {
  messages: ChatMessage[];
}

export interface BotMessageRequest {
  sessionId: string;
  text: string;
  locale?: 'en_US' | 'es_US';
}

export interface BotMessageResponse {
  transferRequired: boolean;
  botResponse: string;
  intent?: string;
  slots?: Record<string, string>;
}

export interface TransferRequest {
  sessionId: string;
  queue?: 'claims' | 'general';
  reason?: 'customer_requested' | 'bot_fallback';
}

export interface TransferResponse {
  transferred: boolean;
  queue: string;
  message: string;
}

export interface CallbackRequest {
  customerPhone: string;
  customerName: string;
  policyNumber?: string;
  topic?: string;
}

export interface CallbackResponse {
  callbackId: string;
  status: string;
}

export interface ContactRequest {
  customerName: string;
  email: string;
  message: string;
  phone?: string;
  policyNumber?: string;
  subject?: string;
}

export interface ContactResponse {
  contactId: string;
  status: string;
}

// ── API Functions ──────────────────────────────────────────────────────────

export const portalApi = {
  /** API #1 — Start a chat session */
  startChat: (body: StartChatRequest) =>
    request<StartChatResponse>('/portal/chat/start', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** API #2 — Send a message to the Connect session */
  sendMessage: (sessionId: string, message: string, contentType = 'text/plain') =>
    request<{ sent: boolean }>(`/portal/chat/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({ message, contentType }),
    }),

  /** API #3 — Poll the transcript */
  getMessages: (sessionId: string) =>
    request<TranscriptResponse>(`/portal/chat/${sessionId}/messages`),

  /** API #4 — End the chat session */
  endChat: (sessionId: string) =>
    request<{ ended: boolean }>(`/portal/chat/${sessionId}`, { method: 'DELETE' }),

  /** API #5 — Send message to the AI bot and get bot response */
  sendBotMessage: (body: BotMessageRequest) =>
    request<BotMessageResponse>('/ai/message', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** API #6 — Transfer to human agent */
  transferToAgent: (body: TransferRequest) =>
    request<TransferResponse>('/ai/transfer', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** API #7 — Request a callback */
  requestCallback: (body: CallbackRequest) =>
    request<CallbackResponse>('/portal/callback', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** API #8 — Submit a contact/enquiry form */
  submitContact: (body: ContactRequest) =>
    request<ContactResponse>('/portal/contact', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** Health check */
  health: () =>
    request<{ status: string; service: string }>('/health'),
};
