import { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send, Clock, X, Bot, Check, ChevronLeft, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from './lib/utils';
import { SettingsModal } from './components/SettingsModal';

interface Email {
  id: string;
  from: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  classification?: 'interested' | 'non_interested';
  aiResponse?: string;
}

interface ApiKeys {
  INSTANTLY_API_KEY: string;
  OPENAI_API_KEY: string;
  ASSISTANT_ID: string;
  INSTANTLY_BASE_URL: string;
}

function App() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEmailList, setShowEmailList] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    INSTANTLY_API_KEY: 'MzdiZjIwOWEtYmI4MC00MGNjLWIxM2UtYmExNmNiMzdmM2UwOlVLSklmd3NETURxZQ==',
    OPENAI_API_KEY: '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',
    ASSISTANT_ID: 'asst_PSS5YGP99xe5hRAMZ9zfE8Cd',
    INSTANTLY_BASE_URL: 'https://api.instantly.ai/api/v2'
  });
  const [emails, setEmails] = useState<Email[]>([]);

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleGenerateResponse = async () => {
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || !selectedEmail) {
        throw new Error('Configurazione mancante o nessuna email selezionata');
      }

      console.log('Generazione risposta per:', selectedEmail.id);
      const functionUrl = `${supabaseUrl}/functions/v1/email-processor`;
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKeys.INSTANTLY_API_KEY,
          baseUrl: apiKeys.INSTANTLY_BASE_URL,
          openaiKey: apiKeys.OPENAI_API_KEY,
          assistantId: apiKeys.ASSISTANT_ID,
          singleEmail: {
            id: selectedEmail.id,
            subject: selectedEmail.subject,
            content: selectedEmail.content,
            classification: selectedEmail.classification
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Errore nella risposta: ${response.status}`);
      }

      const data = await response.json();
      if (data.aiResponse) {
        setAiResponse(data.aiResponse);
        console.log('Risposta AI ricevuta:', data.aiResponse.substring(0, 50) + '...');
      } else {
        setAiResponse('Nessuna risposta AI disponibile per questa email.');
      }
    } catch (error) {
      console.error('Errore nella generazione della risposta:', error);
      setAiResponse('Errore durante la generazione della risposta.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    if (selectedEmail) {
      setLoading(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Configurazione Supabase mancante');
        }

        const functionUrl = `${supabaseUrl}/functions/v1/email-processor`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: apiKeys.INSTANTLY_API_KEY,
            baseUrl: apiKeys.INSTANTLY_BASE_URL,
            action: 'mark-read',
            emailId: selectedEmail.id
          }),
        });

        if (!response.ok) {
          throw new Error(`Errore nel segnare come letta: ${response.status}`);
        }

        // Aggiorna lo stato locale
        const currentEmailIndex = emails.findIndex(email => email.id === selectedEmail.id);
        const updatedEmails = emails.filter(email => email.id !== selectedEmail.id);
        setEmails(updatedEmails);

        if (updatedEmails.length > 0) {
          const nextEmailIndex = currentEmailIndex < updatedEmails.length ? currentEmailIndex : 0;
          setSelectedEmail(updatedEmails[nextEmailIndex]);
          setAiResponse('');
        } else {
          setSelectedEmail(null);
          setShowEmailList(true);
        }
      } catch (error) {
        console.error('Errore:', error);
        alert('Errore nel segnare come letta');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetReminder = async () => {
    if (selectedEmail) {
      setLoading(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Configurazione Supabase mancante');
        }

        const reminderTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 ore da ora
        
        const functionUrl = `${supabaseUrl}/functions/v1/email-processor`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: apiKeys.INSTANTLY_API_KEY,
            baseUrl: apiKeys.INSTANTLY_BASE_URL,
            action: 'set-reminder',
            emailId: selectedEmail.id,
            reminderTime
          }),
        });

        if (!response.ok) {
          throw new Error(`Errore nell'impostare il promemoria: ${response.status}`);
        }

        alert('Promemoria impostato con successo per 24 ore da ora');
      } catch (error) {
        console.error('Errore:', error);
        alert('Errore nell\'impostare il promemoria');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendResponse = async () => {
    if (selectedEmail && aiResponse) {
      setLoading(true);
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Configurazione Supabase mancante');
        }

        const functionUrl = `${supabaseUrl}/functions/v1/email-processor`;
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            apiKey: apiKeys.INSTANTLY_API_KEY,
            baseUrl: apiKeys.INSTANTLY_BASE_URL,
            action: 'send-response',
            emailId: selectedEmail.id,
            singleEmail: {
              ...selectedEmail,
              aiResponse
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`Errore nell'invio della risposta: ${response.status}`);
        }

        alert('Risposta inviata con successo');
        handleMarkAsRead();  // Segna come letta dopo l'invio
      } catch (error) {
        console.error('Errore:', error);
        alert('Errore nell\'invio della risposta');
      } finally {
        setLoading(false);
      }
    } else {
      alert('Nessuna risposta da inviare. Genera prima una risposta.');
    }
  };

  const handleBackToList = () => {
    setShowEmailList(true);
    setSelectedEmail(null);
  };

  useEffect(() => {
    // Verificare lo stato della funzione all'avvio dell'applicazione
    checkFunctionStatus();
  }, []);

  const checkFunctionStatus = async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Configurazione Supabase mancante');
      }

      const healthUrl = `${supabaseUrl}/functions/v1/email-processor/health`;
      const response = await fetch(healthUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`
        }
      });

      if (response.ok) {
        console.log('Funzione Supabase online');
      } else {
        console.error('Funzione Supabase non raggiungibile');
      }
    } catch (error) {
      console.error('Errore nel controllo dello stato della funzione:', error);
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-processor`;
      console.log('Recupero email da:', functionUrl);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          apiKey: apiKeys.INSTANTLY_API_KEY,
          baseUrl: apiKeys.INSTANTLY_BASE_URL,
          openaiKey: apiKeys.OPENAI_API_KEY,
          assistantId: apiKeys.ASSISTANT_ID
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Errore nel recupero delle email: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      if (!data.emails) {
        console.warn('Nessuna email trovata nella risposta:', data);
        setEmails([]);
        return;
      }

      setEmails(data.emails.map((email: any) => ({
        id: email.id,
        from: email.from || email.sender_email || 'Sconosciuto',
        subject: email.subject || 'Nessun oggetto',
        content: email.content || email.content_preview || '',
        timestamp: email.timestamp_created,
        isRead: false,
        classification: email.classification,
        aiResponse: email.aiResponse
      })));
    } catch (error) {
      console.error('Errore durante il recupero delle email:', error);
      if (error instanceof Error) {
        console.error('Messaggio di errore:', error.message);
        setEmails([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {!showEmailList && selectedEmail && (
                <button
                  onClick={handleBackToList}
                  className="md:hidden text-gray-400 hover:text-gray-300 flex items-center"
                >
                  <ChevronLeft className="h-6 w-6" />
                  <span className="ml-1">Indietro</span>
                </button>
              )}
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30",
                !showEmailList && selectedEmail && "md:flex hidden"
              )}>
                <Bot className="h-8 w-8 text-blue-400" />
              </div>
              <div className={cn(
                "flex flex-col",
                !showEmailList && selectedEmail && "md:flex hidden"
              )}>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Gestore Email AI
                </h1>
                <p className="text-sm text-gray-400">Alimentato da IA</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchEmails}
                disabled={loading}
                className={cn(
                  "group flex items-center px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-all duration-200",
                  loading && "opacity-50 cursor-not-allowed"
                )}
              >
                <RefreshCw className={cn(
                  "h-4 w-4 mr-2",
                  loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"
                )} />
                Aggiorna
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="group flex items-center px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600 hover:bg-gray-700 transition-all duration-200"
              >
                <Settings className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-500" />
                Impostazioni
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className={cn(
            "md:col-span-4",
            !showEmailList && "hidden md:block"
          )}>
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-200 flex items-center">
                    <Mail className="h-5 w-5 text-blue-400 mr-2" />
                    Email in Arrivo
                  </h2>
                  <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                    {emails.length}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-700/50">
                {emails.map(email => (
                  <button
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      setShowEmailList(false);
                    }}
                    className={cn(
                      "w-full text-left p-4 hover:bg-gray-700/30 transition-colors",
                      selectedEmail?.id === email.id && "bg-blue-500/10 border-l-2 border-blue-400"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-gray-200">{email.from}</p>
                      <span className={cn(
                        "text-sm px-2 py-0.5 rounded",
                        email.classification === 'interested' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {email.classification === 'interested' ? 'Interessato' : 'Non Interessato'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm font-medium text-gray-300">{email.subject}</p>
                      <span className="text-sm text-gray-400">
                        {format(new Date(email.timestamp), 'dd/MM/yy', { locale: it })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                      {truncateText(email.content)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={cn(
            "md:col-span-8",
            !showEmailList ? "block" : "hidden md:block"
          )}>
            {selectedEmail ? (
              <>
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-medium text-gray-200">{selectedEmail.subject}</h2>
                      <p className="text-sm text-gray-400 mt-1">Da: {selectedEmail.from}</p>
                      <p className="text-sm text-gray-400">
                        {format(new Date(selectedEmail.timestamp), 'dd/MM/yy HH:mm', { locale: it })}
                      </p>
                      <span className={cn(
                        "inline-block mt-2 text-sm px-2 py-0.5 rounded",
                        selectedEmail.classification === 'interested' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                      )}>
                        {selectedEmail.classification === 'interested' ? 'Interessato' : 'Non Interessato'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="text-gray-400 hover:text-gray-300 transition-colors md:block hidden"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 bg-gray-900/50 p-6 rounded-lg border border-gray-700 min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                      {selectedEmail.content}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <Bot className="h-5 w-5 text-blue-400 mr-2" />
                      <h3 className="text-lg font-medium text-gray-200">Risposta IA</h3>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={handleGenerateResponse}
                        disabled={loading}
                        className={cn(
                          "px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/30",
                          "hover:bg-blue-500/20 transition-all duration-200",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          loading && "animate-pulse"
                        )}
                      >
                        {loading ? "Generazione..." : "Genera Risposta"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={aiResponse}
                    onChange={(e) => setAiResponse(e.target.value)}
                    className="w-full h-40 p-3 bg-gray-900/50 text-gray-200 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
                    placeholder="La risposta IA apparirà qui..."
                  />
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-4 space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      onClick={handleMarkAsRead}
                      className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600 hover:bg-gray-700 transition-all duration-200"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Segna come Letto
                    </button>
                    <button
                      onClick={handleSetReminder}
                      className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600 hover:bg-gray-700 transition-all duration-200"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Imposta Promemoria
                    </button>
                    <button 
                      disabled={!aiResponse}
                      onClick={handleSendResponse}
                      className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/30 hover:bg-green-500/20 transition-all duration-200"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Invia Risposta
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 text-center">
                <Mail className="h-12 w-12 text-gray-600 mx-auto" />
                <h3 className="mt-4 text-lg font-medium text-gray-200">Nessuna email selezionata</h3>
                <p className="mt-2 text-gray-400">Seleziona una email dalla lista per visualizzarne il contenuto</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        apiKeys={apiKeys}
        onSave={setApiKeys}
      />
    </div>
  );
}

export default App;