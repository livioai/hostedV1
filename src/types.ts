export interface Email {
  id: string;
  from: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  classification?: 'interested' | 'non_interested';
  aiResponse?: string | null;
}

export interface ApiKeys {
  INSTANTLY_API_KEY: string;
  OPENAI_API_KEY: string;
  ASSISTANT_ID: string;
  INSTANTLY_BASE_URL: string;
}