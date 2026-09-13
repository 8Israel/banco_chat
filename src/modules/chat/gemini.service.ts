import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { GoogleGenAI, Type, type Content, type Part, type Tool } from '@google/genai';
import { LlmError } from '../../common/errors/app-errors.js';
import type {
    LlmProvider,
    LlmResponse,
    NormalizedMessage,
    ToolDefinition,
} from './llm/llm-provider.interface.js';

@Injectable()
export class GeminiService implements LlmProvider {
    private client: GoogleGenAI | null = null;

    constructor(private readonly config: ConfigService) { }

    async createMessage(params: {
        system: string;
        messages: NormalizedMessage[];
        tools: ToolDefinition[];
    }): Promise<LlmResponse> {
        const client = this.getClient();

        try {
            const response = await client.models.generateContent({
                model: this.config.getOrThrow<string>('gemini.model'),
                contents: this.toGeminiContents(params.messages),
                config: {
                    systemInstruction: params.system,
                    tools: [this.toGeminiTool(params.tools)],
                },
            });

            return this.toNormalizedResponse(response);
        } catch (error) {
            if (error instanceof LlmError) throw error;
            throw new LlmError(
                error instanceof Error
                    ? error.message
                    : 'Error al comunicarse con el modelo de lenguaje',
            );
        }
    }

    // El cliente se crea recién en el primer uso: si falta la API key,
    // el servidor igual levanta y solo falla al usar el chat.
    private getClient(): GoogleGenAI {
        if (!this.client) {
            const apiKey = this.config.get<string>('gemini.apiKey');
            if (!apiKey) {
                throw new LlmError('GEMINI_API_KEY no está configurada en el entorno');
            }
            this.client = new GoogleGenAI({ apiKey });
        }
        return this.client;
    }

    private toGeminiTool(tools: ToolDefinition[]): Tool {
        return {
            functionDeclarations: tools.map((tool) => ({
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: Type.OBJECT,
                    properties: tool.parameters.properties as Record<string, never>,
                    required: tool.parameters.required,
                },
            })),
        };
    }

    private toGeminiContents(messages: NormalizedMessage[]): Content[] {
        return messages.map((message): Content => {
            if (message.role === 'user') {
                return { role: 'user', parts: [{ text: message.content }] };
            }

            if (message.role === 'assistant') {
                const parts: Part[] = [];
                if (message.content) {
                    parts.push({ text: message.content });
                }
                for (const toolUse of message.toolUses) {
                    parts.push({
                        functionCall: { id: toolUse.id, name: toolUse.name, args: toolUse.input },
                    });
                }
                return { role: 'model', parts };
            }

            return {
                role: 'user',
                parts: message.results.map((result) => ({
                    functionResponse: {
                        id: result.toolUseId,
                        name: result.toolName,
                        response: result.isError
                            ? { error: result.content }
                            : { output: result.content },
                    },
                })),
            };
        });
    }

    private toNormalizedResponse(response: {
        text?: string;
        functionCalls?: { id?: string; name?: string; args?: Record<string, unknown> }[];
    }): LlmResponse {
        const calls = response.functionCalls ?? [];

        return {
            text: response.text ?? '',
            toolUses: calls.map((call) => ({
                id: call.id ?? randomUUID(),
                name: call.name ?? '',
                input: call.args ?? {},
            })),
            stopReason: calls.length > 0 ? 'tool_use' : 'end',
        };
    }
}
