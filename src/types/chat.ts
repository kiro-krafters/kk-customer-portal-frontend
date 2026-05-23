export interface ChatWidgetProps {
  connectInstanceUrl: string;
  contactFlowId: string;
}

export type IssueType = 'claim_status' | 'policy_info' | 'billing' | 'general';
export type Language = 'en' | 'es';

export interface PreChatFormData {
  customerName: string;
  policyNumber: string;
  issueType: IssueType;
  language: Language;
}

export const TOPIC_MAP: Record<IssueType, string> = {
  claim_status: 'Claims',
  policy_info: 'Policy',
  billing: 'Billing',
  general: 'General',
};
