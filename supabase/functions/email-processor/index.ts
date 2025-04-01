import OpenAI from "npm:openai@4.24.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '1728000',
  'Content-Type': 'application/json'
};

// Handle OPTIONS preflight request
const handleOptions = () => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
};

Deno.serve(async (req) => {
  // Gestisci richieste OPTIONS
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  // Health check endpoint
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Autorizzazione mancante' }),
        { 
          status: 401,
          headers: corsHeaders
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        status: 'ok',
        timestamp: new Date().toISOString()
      }),
      { headers: corsHeaders }
    );
  }

  try {
    const { apiKey, baseUrl, openaiKey, assistantId, timestamp, singleEmail, action, emailId, reminderTime } = await req.json();
    
    if (!apiKey || !baseUrl) {
      return new Response(
        JSON.stringify({ error: 'API key e base URL sono richiesti' }),
        { 
          status: 400, 
          headers: corsHeaders
        }
      );
    }

    // Gestione azioni specifiche
    if (action) {
      switch (action) {
        case 'mark-read':
          if (!emailId) {
            return new Response(
              JSON.stringify({ error: 'ID email richiesto per segnare come letta' }),
              { status: 400, headers: corsHeaders }
            );
          }
          
          try {
            const response = await fetch(`${baseUrl}/emails/${emailId}/mark-read`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              throw new Error(`Errore nel segnare l'email come letta: ${response.status}`);
            }
            
            return new Response(
              JSON.stringify({ success: true }),
              { headers: corsHeaders }
            );
          } catch (error) {
            console.error('Errore in mark-read:', error);
            return new Response(
              JSON.stringify({ error: "Errore nel segnare l\'email come letta" }),
              { status: 500, headers: corsHeaders }
            );
          }
          
        case 'set-reminder':
          if (!emailId || !reminderTime) {
            return new Response(
              JSON.stringify({ error: 'ID email e data promemoria richiesti' }),
              { status: 400, headers: corsHeaders }
            );
          }
          
          try {
            const response = await fetch(`${baseUrl}/emails/${emailId}/set-reminder`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                reminder_time: reminderTime
              })
            });
            
            if (!response.ok) {
              throw new Error(`Errore nell'impostare il promemoria: ${response.status}`);
            }
            
            return new Response(
              JSON.stringify({ success: true }),
              { headers: corsHeaders }
            );
          } catch (error) {
            console.error('Errore in set-reminder:', error);
            return new Response(
              JSON.stringify({ error: 'Errore nell\'impostare il promemoria' }),
              { status: 500, headers: corsHeaders }
            );
          }
          
        case 'send-response':
          if (!emailId || !singleEmail || !singleEmail.aiResponse) {
            return new Response(
              JSON.stringify({ error: 'ID email e risposta AI richiesti' }),
              { status: 400, headers: corsHeaders }
            );
          }
          
          try {
            const response = await fetch(`${baseUrl}/emails/${emailId}/reply`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                content: singleEmail.aiResponse
              })
            });
            
            if (!response.ok) {
              throw new Error(`Errore nell'invio della risposta: ${response.status}`);
            }
            
            return new Response(
              JSON.stringify({ success: true }),
              { headers: corsHeaders }
            );
          } catch (error) {
            console.error('Errore in send-response:', error);
            return new Response(
              JSON.stringify({ error: 'Errore nell\'invio della risposta' }),
              { status: 500, headers: corsHeaders }
            );
          }
      }
    }

    // Se viene fornita una singola email, genera solo la risposta per quella
    if (singleEmail) {
      if (!openaiKey || !assistantId) {
        return new Response(
          JSON.stringify({ error: 'OpenAI API key e Assistant ID sono richiesti' }),
          { status: 400, headers: corsHeaders }
        );
      }

      try {
        const openai = new OpenAI({ apiKey: openaiKey });
        const thread = await openai.beta.threads.create();
        
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: `Email subject: ${singleEmail.subject}\nEmail content: ${singleEmail.content}`
        });
        
        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: assistantId
        });
        
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        while (runStatus.status === "in_progress" || runStatus.status === "queued") {
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }
        
        const messages = await openai.beta.threads.messages.list(thread.id);
        const aiResponse = messages.data[0].content[0].text.value;
        
        return new Response(
          JSON.stringify({ aiResponse }),
          { headers: corsHeaders }
        );
      } catch (error) {
        console.error("Errore OpenAI:", error);
        return new Response(
          JSON.stringify({ error: 'Errore nella generazione della risposta AI' }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // Recupera le email da Instantly
    const params = new URLSearchParams({
      limit: "50",
      offset: "0",
      sort_order: "desc",
      is_unread: "true",
      include_lead_data: "true"
    });

    console.log('Chiamata API Instantly:', {
      url: `${baseUrl}/emails`,
      params: params.toString()
    });

    const response = await fetch(`${baseUrl}/emails?${params}`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore API Instantly:', {
        status: response.status,
        error: errorText
      });

      return new Response(
        JSON.stringify({
          error: `Errore nel recupero delle email: ${response.status}`,
          details: errorText
        }),
        { 
          status: response.status,
          headers: corsHeaders
        }
      );
    }

    const data = await response.json();
    console.log('Risposta API Instantly:', {
      emailCount: data.items?.length || 0
    });

    const emails = data.items || [];
    
    // Recupera i dati del mittente per ogni email
    const emailsWithSenders = await Promise.all(emails.map(async (email: any) => {
      try {
        if (email.sender_id) {
          const senderResponse = await fetch(`${baseUrl}/contacts/${email.sender_id}`, {
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            }
          });
          
          if (senderResponse.ok) {
            const senderData = await senderResponse.json();
            return {
              ...email,
              from: senderData.name || senderData.email || email.from || 'Sconosciuto'
            };
          }
        }
        // Se non c'è un sender_id o la richiesta fallisce, usa il campo from esistente o l'email del mittente
        return {
          ...email,
          from: email.from || email.sender_email || 'Sconosciuto'
        };
      } catch (error) {
        console.error('Errore nel recupero del mittente:', error);
        return email;
      }
    }));

    // Processa le email con OpenAI se necessario
    const openai = new OpenAI({ apiKey: openaiKey });
    const processedEmails = await Promise.all(emailsWithSenders.map(async (email: any) => {
      const classification = classifyEmail(email);
      
      if (classification === "interested" && openaiKey && assistantId) {
        try {
          const thread = await openai.beta.threads.create();
          await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: `Email subject: ${email.subject}\nEmail content: ${email.content_preview}`
          });
          
          const run = await openai.beta.threads.runs.create(thread.id, {
            assistant_id: assistantId
          });
          
          // Attendi il completamento
          let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
          while (runStatus.status === "in_progress" || runStatus.status === "queued") {
            await new Promise(resolve => setTimeout(resolve, 1000));
            runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
          }
          
          const messages = await openai.beta.threads.messages.list(thread.id);
          const aiResponse = messages.data[0].content[0].text.value;
          
          console.log('Risposta OpenAI generata per email:', {
            emailId: email.id,
            responseLength: aiResponse.length
          });

          return {
            ...email,
            classification,
            content: email.content || email.content_preview || '',
            aiResponse
          };
        } catch (error) {
          console.error("Errore OpenAI:", error);
          return { ...email, classification };
        }
      }
      
      return {
        ...email,
        classification,
        content: email.content || email.content_preview || ''
      };
    }));

    return new Response(
      JSON.stringify({ emails: processedEmails }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Errore nella funzione edge:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Si è verificato un errore'
      }),
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
});

function classifyEmail(email: any): "interested" | "non_interested" {
  const content = `${email.subject} ${email.content_preview}`.toLowerCase();

  const negativePatterns = [
    /\bnon\s+(?:(?:sono|siamo|mi|abbiamo|ha|ho)\s+)?interess\w*\b/,
    /\bno,?\s+grazie\b/,
    /\bnon\s+lo\s+valutiamo\b/,
    /\bnon\s+è\s+per\s+noi\b/,
    /\bnon\s+fa\s+per\s+noi\b/
  ];

  for (const pattern of negativePatterns) {
    if (pattern.test(content)) {
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
    if (content.includes(keyword)) {
      return "interested";
    }
  }

  return "non_interested";
}