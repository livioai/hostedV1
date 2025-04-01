import { Email } from '../types';

interface InstantlyEmail {
  id: string;
  subject: string;
  content_preview: string;
  timestamp_created: string;
  from: string;
  lead_data?: {
    status?: string;
    interest_status?: string;
    labels?: string[];
    note?: string;
  };
}

interface ApiResponse {
  items: InstantlyEmail[];
}

export async function fetchEmails(apiKey: string, baseUrl: string): Promise<Email[]> {
  const url = `${baseUrl}/emails`;
  const params = new URLSearchParams({
    limit: "50",
    offset: "0",
    sort_order: "desc",
    is_unread: "true",
    include_lead_data: "true"
  });

  const response = await fetch(`${url}?${params}`, {
    method: 'GET',
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Errore nel recupero delle email: ${response.status} ${errorData}`);
  }

  const data: ApiResponse = await response.json();

  return data.items.map(email => ({
    id: email.id,
    from: email.from || 'Sconosciuto',
    subject: email.subject || 'Nessun oggetto',
    content: email.content_preview || '',
    timestamp: email.timestamp_created,
    isRead: false,
    classification: classifyEmail(email.content_preview),
    aiResponse: null
  }));
}

function classifyEmail(content: string): 'interested' | 'non_interested' {
  const negativePatterns = [
    /\bnon\s+(?:(?:sono|siamo|mi|abbiamo|ha|ho)\s+)?interess\w*\b/,
    /\bno,?\s+grazie\b/,
    /\bnon\s+lo\s+valutiamo\b/,
    /\bnon\s+è\s+per\s+noi\b/,
    /\bnon\s+fa\s+per\s+noi\b/
  ];

  const lowerContent = content.toLowerCase();
  
  for (const pattern of negativePatterns) {
    if (pattern.test(lowerContent)) {
      return "non_interested";
    }
  }

  const positiveKeywords = [
    "interessato", "interessata", "interessati", "interessate", "interesse",
    "mi interessa", "sono interessato", "sono interessata",
    "mi interessa approfondire", "mi piacerebbe saperne di più",
    "fissiamo una call", "contattami", "contattatemi", "sono disponibile",
    "ok, mi interessa", "perfetto, parliamone", "vorrei fissare un appuntamento"
  ];

  for (const keyword of positiveKeywords) {
    if (lowerContent.includes(keyword)) {
      return "interested";
    }
  }

  return "non_interested";
}