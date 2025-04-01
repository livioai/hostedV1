var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Mail, RefreshCw, Send, Clock, X, Bot, Check, ChevronLeft, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from './lib/utils';
import { SettingsModal } from './components/SettingsModal';
function App() {
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [aiResponse, setAiResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [showEmailList, setShowEmailList] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [apiKeys, setApiKeys] = useState({
        INSTANTLY_API_KEY: 'MzdiZjIwOWEtYmI4MC00MGNjLWIxM2UtYmExNmNiMzdmM2UwOlVLSklmd3NETURxZQ==',
        OPENAI_API_KEY: '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',
        ASSISTANT_ID: 'asst_PSS5YGP99xe5hRAMZ9zfE8Cd',
        INSTANTLY_BASE_URL: 'https://api.instantly.ai/api/v2'
    });
    const [emails, setEmails] = useState([]);
    const truncateText = (text, maxLength = 60) => {
        if (text.length <= maxLength)
            return text;
        return text.substring(0, maxLength) + '...';
    };
    const handleGenerateResponse = () => {
        setLoading(true);
        if (selectedEmail === null || selectedEmail === void 0 ? void 0 : selectedEmail.aiResponse) {
            setAiResponse(selectedEmail.aiResponse);
            setLoading(false);
        }
        else {
            setAiResponse('No AI response available for this email.');
            setLoading(false);
        }
    };
    const handleMarkAsRead = () => {
        if (selectedEmail) {
            const currentEmailIndex = emails.findIndex(email => email.id === selectedEmail.id);
            const updatedEmails = emails.filter(email => email.id !== selectedEmail.id);
            setEmails(updatedEmails);
            if (updatedEmails.length > 0) {
                const nextEmailIndex = currentEmailIndex < updatedEmails.length ? currentEmailIndex : 0;
                setSelectedEmail(updatedEmails[nextEmailIndex]);
                setAiResponse('');
            }
            else {
                setSelectedEmail(null);
                setShowEmailList(true);
            }
        }
    };
    const handleSendResponse = () => {
        handleMarkAsRead();
    };
    const handleBackToList = () => {
        setShowEmailList(true);
        setSelectedEmail(null);
    };
    const fetchEmails = () => __awaiter(this, void 0, void 0, function* () {
        setLoading(true);
        try {
            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-processor`;
            console.log('Fetching emails from:', functionUrl);
            const response = yield fetch(functionUrl, {
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
                const errorData = yield response.text();
                throw new Error(`Failed to fetch emails: ${response.status} ${errorData}`);
            }
            const data = yield response.json();
            if (!data.emails) {
                console.warn('No emails in response:', data);
                setEmails([]);
                return;
            }
            setEmails(data.emails.map((email) => ({
                id: email.id,
                from: email.from || 'Unknown',
                subject: email.subject || 'No Subject',
                content: email.content_preview || '',
                timestamp: email.timestamp_created,
                isRead: false,
                classification: email.classification,
                aiResponse: email.aiResponse
            })));
        }
        catch (error) {
            console.error('Error in fetchEmails:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                // You might want to show this error to the user
                // For now, we'll just clear the emails list
                setEmails([]);
            }
        }
        finally {
            setLoading(false);
        }
    });
    const classifyEmail = (content) => {
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
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900", children: [_jsx("header", { className: "bg-gray-800/50 backdrop-blur-lg border-b border-gray-700 sticky top-0 z-10", children: _jsx("div", { className: "max-w-7xl mx-auto px-4 py-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [!showEmailList && selectedEmail && (_jsxs("button", { onClick: handleBackToList, className: "md:hidden text-gray-400 hover:text-gray-300 flex items-center", children: [_jsx(ChevronLeft, { className: "h-6 w-6" }), _jsx("span", { className: "ml-1", children: "Back" })] })), _jsx("div", { className: cn("flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30", !showEmailList && selectedEmail && "md:flex hidden"), children: _jsx(Bot, { className: "h-8 w-8 text-blue-400" }) }), _jsxs("div", { className: cn("flex flex-col", !showEmailList && selectedEmail && "md:flex hidden"), children: [_jsx("h1", { className: "text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent", children: "Email AI Responder" }), _jsx("p", { className: "text-sm text-gray-400", children: "Powered by AI" })] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("button", { onClick: fetchEmails, disabled: loading, className: cn("group flex items-center px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/30 hover:bg-blue-500/20 transition-all duration-200", loading && "opacity-50 cursor-not-allowed"), children: [_jsx(RefreshCw, { className: cn("h-4 w-4 mr-2", loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500") }), "Refresh"] }), _jsxs("button", { onClick: () => setShowSettings(true), className: "group flex items-center px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600 hover:bg-gray-700 transition-all duration-200", children: [_jsx(Settings, { className: "h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-500" }), "Settings"] })] })] }) }) }), _jsx("main", { className: "max-w-7xl mx-auto px-4 py-6", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-12 gap-6", children: [_jsx("div", { className: cn("md:col-span-4", !showEmailList && "hidden md:block"), children: _jsxs("div", { className: "bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700", children: [_jsx("div", { className: "p-4 border-b border-gray-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h2", { className: "text-lg font-medium text-gray-200 flex items-center", children: [_jsx(Mail, { className: "h-5 w-5 text-blue-400 mr-2" }), "Incoming Emails"] }), _jsx("span", { className: "px-2.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-sm", children: emails.length })] }) }), _jsx("div", { className: "divide-y divide-gray-700/50", children: emails.map(email => (_jsxs("button", { onClick: () => {
                                                setSelectedEmail(email);
                                                setShowEmailList(false);
                                            }, className: cn("w-full text-left p-4 hover:bg-gray-700/30 transition-colors", (selectedEmail === null || selectedEmail === void 0 ? void 0 : selectedEmail.id) === email.id && "bg-blue-500/10 border-l-2 border-blue-400"), children: [_jsxs("div", { className: "flex justify-between items-start", children: [_jsx("p", { className: "font-medium text-gray-200", children: email.from }), _jsx("span", { className: cn("text-sm px-2 py-0.5 rounded", email.classification === 'interested' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"), children: email.classification === 'interested' ? 'Interested' : 'Not Interested' })] }), _jsxs("div", { className: "flex justify-between items-center mt-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-300", children: email.subject }), _jsx("span", { className: "text-sm text-gray-400", children: format(new Date(email.timestamp), 'dd/MM/yy', { locale: it }) })] }), _jsx("p", { className: "text-sm text-gray-400 mt-1 line-clamp-2", children: truncateText(email.content) })] }, email.id))) })] }) }), _jsx("div", { className: cn("md:col-span-8", !showEmailList ? "block" : "hidden md:block"), children: selectedEmail ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-medium text-gray-200", children: selectedEmail.subject }), _jsxs("p", { className: "text-sm text-gray-400 mt-1", children: ["From: ", selectedEmail.from] }), _jsx("p", { className: "text-sm text-gray-400", children: format(new Date(selectedEmail.timestamp), 'dd/MM/yy HH:mm', { locale: it }) }), _jsx("span", { className: cn("inline-block mt-2 text-sm px-2 py-0.5 rounded", selectedEmail.classification === 'interested' ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"), children: selectedEmail.classification === 'interested' ? 'Interested' : 'Not Interested' })] }), _jsx("button", { onClick: () => setSelectedEmail(null), className: "text-gray-400 hover:text-gray-300 transition-colors md:block hidden", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsx("div", { className: "prose prose-invert max-w-none", children: _jsx("p", { className: "text-gray-300 bg-gray-900/50 p-3 rounded-lg border border-gray-700 max-h-40 overflow-y-auto custom-scrollbar", children: selectedEmail.content }) })] }), _jsxs("div", { className: "bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 mt-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Bot, { className: "h-5 w-5 text-blue-400 mr-2" }), _jsx("h3", { className: "text-lg font-medium text-gray-200", children: "AI Response" })] }), _jsx("div", { className: "space-x-2", children: _jsx("button", { onClick: handleGenerateResponse, disabled: loading, className: cn("px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/30", "hover:bg-blue-500/20 transition-all duration-200", "disabled:opacity-50 disabled:cursor-not-allowed", loading && "animate-pulse"), children: loading ? "Generating..." : "Generate Response" }) })] }), _jsx("textarea", { value: aiResponse, onChange: (e) => setAiResponse(e.target.value), className: "w-full h-40 p-3 bg-gray-900/50 text-gray-200 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200", placeholder: "AI response will appear here..." }), _jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between mt-4 space-y-2 sm:space-y-0 sm:space-x-4", children: [_jsxs("button", { onClick: handleMarkAsRead, className: "w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600 hover:bg-gray-700 transition-all duration-200", children: [_jsx(Check, { className: "h-4 w-4 mr-2" }), "Mark as Read"] }), _jsxs("button", { onClick: () => { }, className: "w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-gray-700/50 text-gray-300 rounded-lg border border-gray-600 hover:bg-gray-700 transition-all duration-200", children: [_jsx(Clock, { className: "h-4 w-4 mr-2" }), "Set Reminder"] }), _jsxs("button", { onClick: handleSendResponse, className: "w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/30 hover:bg-green-500/20 transition-all duration-200", children: [_jsx(Send, { className: "h-4 w-4 mr-2" }), "Send Response"] })] })] })] })) : (_jsxs("div", { className: "bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 text-center", children: [_jsx(Mail, { className: "h-12 w-12 text-gray-600 mx-auto" }), _jsx("h3", { className: "mt-4 text-lg font-medium text-gray-200", children: "No email selected" }), _jsx("p", { className: "mt-2 text-gray-400", children: "Select an email from the list to view its content" })] })) })] }) }), _jsx(SettingsModal, { isOpen: showSettings, onClose: () => setShowSettings(false), apiKeys: apiKeys, onSave: setApiKeys })] }));
}
export default App;
