import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { LlmError } from '../../common/errors/app-errors.js';
import type {
    LlmProvider,
    LlmResponse,
    NormalizedMessage,
    ToolDefinition,
} from './llm/llm-provider.interface.js';

@Injectable()
export class ClaudeService implements LlmProvider {
    private client: Anthropic | null = null;

    constructor(private readonly config: ConfigService) { }

    async createMessage(params: {
        system: string;
        messages: NormalizedMessage[];
        tools: ToolDefinition[];
    }): Promise<LlmResponse> {
        const client = this.getClient();

        try {
            const response = await client.messages.create({
                model: this.config.getOrThrow<string>('anthropic.model'),
                max_tokens: 1024,
                system: params.system,
                tools: params.tools.map((tool) => ({
                    name: tool.name,
                    description: tool.description,
                    input_schema: {
                        type: 'object',
                        properties: tool.parameters.properties,
                        required: tool.parameters.required,
                    },
                })),
                messages: this.toAnthropicMessages(params.messages),
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
    private getClient(): Anthropic {
        if (!this.client) {
            const apiKey = this.config.get<string>('anthropic.apiKey');
            if (!apiKey) {
                throw new LlmError(
                    'ANTHROPIC_API_KEY no está configurada en el entorno',
                );
            }
            this.client = new Anthropic({ apiKey });
        }
        return this.client;
    }

    private toAnthropicMessages(messages: NormalizedMessage[]): Anthropic.MessageParam[] {
        return messages.map((message): Anthropic.MessageParam => {
            if (message.role === 'user') {
                return { role: 'user', content: message.content };
            }

            if (message.role === 'assistant') {
                const blocks: Anthropic.ContentBlockParam[] = [];
                if (message.content) {
                    blocks.push({ type: 'text', text: message.content });
                }
                for (const toolUse of message.toolUses) {
                    blocks.push({
                        type: 'tool_use',
                        id: toolUse.id,
                        name: toolUse.name,
                        input: toolUse.input,
                    });
                }
                return { role: 'assistant', content: blocks };
            }

            return {
                role: 'user',
                content: message.results.map((result) => ({
                    type: 'tool_result' as const,
                    tool_use_id: result.toolUseId,
                    content: result.content,
                    is_error: result.isError,
                })),
            };
        });
    }

    private toNormalizedResponse(response: Anthropic.Message): LlmResponse {
        const textBlocks = response.content.filter(
            (block): block is Anthropic.TextBlock => block.type === 'text',
        );
        const toolUseBlocks = response.content.filter(
            (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
        );

        return {
            text: textBlocks.map((block) => block.text).join('\n').trim(),
            toolUses: toolUseBlocks.map((block) => ({
                id: block.id,
                name: block.name,
                input: block.input as Record<string, unknown>,
            })),
            stopReason: response.stop_reason === 'tool_use' ? 'tool_use' : 'end',
        };
    }
}
