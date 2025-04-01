var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import OpenAI from "openai";
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
function classifyEmail(email) {
    var _a, _b, _c, _d;
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
    const { lead_data } = email;
    if (lead_data) {
        const status = ((_a = lead_data.status) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
        const interestStatus = ((_b = lead_data.interest_status) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
        const labels = ((_c = lead_data.labels) === null || _c === void 0 ? void 0 : _c.map(l => l.toLowerCase())) || [];
        const note = ((_d = lead_data.note) === null || _d === void 0 ? void 0 : _d.toLowerCase()) || '';
        if (["interested", "interesse", "interessato", "interessata"].some(term => status.includes(term) ||
            interestStatus.includes(term) ||
            labels.some(label => label.includes(term)) ||
            note.includes(term))) {
            return "interested";
        }
    }
    return "non_interested";
}
function fetchEmails(apiKey, baseUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = `${baseUrl}/emails`;
        const headers = {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
        };
        const params = new URLSearchParams({
            limit: "50",
            offset: "0",
            sort_order: "desc",
            is_unread: "true",
            include_lead_data: "true"
        });
        try {
            const response = yield fetch(`${url}?${params}`, { headers });
            if (!response.ok)
                throw new Error(`HTTP error! status: ${response.status}`);
            const data = yield response.json();
            return data.items || [];
        }
        catch (error) {
            console.error("Error fetching emails:", error);
            throw error;
        }
    });
}
Deno.serve((req) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.method === 'OPTIONS') {
        return handleOptions();
    }
    try {
        const { apiKey, baseUrl, openaiKey, assistantId } = yield req.json();
        if (!apiKey || !baseUrl) {
            return new Response(JSON.stringify({ error: 'API key and base URL are required' }), { status: 400, headers: corsHeaders });
        }
        const openai = new OpenAI({ apiKey: openaiKey });
        const emails = yield fetchEmails(apiKey, baseUrl);
        const processedEmails = yield Promise.all(emails.map((email) => __awaiter(void 0, void 0, void 0, function* () {
            const classification = classifyEmail(email);
            if (classification === "interested" && openaiKey && assistantId) {
                try {
                    const thread = yield openai.beta.threads.create();
                    yield openai.beta.threads.messages.create(thread.id, {
                        role: "user",
                        content: `Email subject: ${email.subject}\nEmail content: ${email.content_preview}`
                    });
                    const run = yield openai.beta.threads.runs.create(thread.id, {
                        assistant_id: assistantId
                    });
                    // Wait for completion
                    let response = yield openai.beta.threads.runs.retrieve(thread.id, run.id);
                    while (response.status === "in_progress" || response.status === "queued") {
                        yield new Promise(resolve => setTimeout(resolve, 1000));
                        response = yield openai.beta.threads.runs.retrieve(thread.id, run.id);
                    }
                    const messages = yield openai.beta.threads.messages.list(thread.id);
                    const aiResponse = messages.data[0].content[0].text.value;
                    return Object.assign(Object.assign({}, email), { classification,
                        aiResponse });
                }
                catch (error) {
                    console.error("OpenAI error:", error);
                    return Object.assign(Object.assign({}, email), { classification });
                }
            }
            return Object.assign(Object.assign({}, email), { classification });
        })));
        return new Response(JSON.stringify({ emails: processedEmails }), { headers: corsHeaders });
    }
    catch (error) {
        console.error('Error in edge function:', error);
        let errorMessage = 'An unknown error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: corsHeaders });
    }
}));
