declare module "openai" {
  export default class OpenAI {
    constructor(config: { apiKey: string });
    beta: {
      threads: {
        create(): Promise<{ id: string }>;
        messages: {
          create(threadId: string, message: { role: string; content: string }): Promise<any>;
          list(threadId: string): Promise<{ data: Array<{ content: Array<{ text: { value: string } }> }> }>;
        };
        runs: {
          create(threadId: string, options: { assistant_id: string }): Promise<{ id: string }>;
          retrieve(threadId: string, runId: string): Promise<{ status: string }>;
        };
      };
    };
  }
}