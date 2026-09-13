/**
 * Contrato común para cualquier proveedor de LLM (Claude, Gemini, etc.).
 * ChatService y la persistencia en Message/uiSchema trabajan solo con estos
 * tipos - la traducción al formato propio de cada SDK vive en el adapter
 * correspondiente (claude.service.ts / gemini.service.ts).
 */

export interface NormalizedToolUse {
    id: string;
    name: string;
    input: Record<string, unknown>;
}

export interface NormalizedToolResult {
    toolUseId: string;
    toolName: string;
    isError: boolean;
    content: string;
}

export type NormalizedMessage =
    | { role: 'user'; content: string }
    | { role: 'assistant'; content: string; toolUses: NormalizedToolUse[] }
    | { role: 'tool'; results: NormalizedToolResult[] };

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
}

export interface LlmResponse {
    text: string;
    toolUses: NormalizedToolUse[];
    stopReason: 'tool_use' | 'end';
}

export interface LlmProvider {
    createMessage(params: {
        system: string;
        messages: NormalizedMessage[];
        tools: ToolDefinition[];
    }): Promise<LlmResponse>;
}

export const LLM_PROVIDER = Symbol('LLM_PROVIDER');
