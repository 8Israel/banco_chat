import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { McpServerProvider } from './mcp-server.provider.js';
import type { ToolDefinition } from '../llm/llm-provider.interface.js';
import type { UiComponent } from '../ui/ui-component.types.js';

// Campo interno que McpServerProvider agrega a cada tool para saber de quién
// es la llamada. El LLM nunca debe verlo ni rellenarlo, así que se quita del
// schema que le mostramos, y se inyecta acá mismo en cada callTool.
const HIDDEN_FIELD = 'userId';

export interface McpToolCallResult {
    text: string;
    isError: boolean;
    ui?: UiComponent;
}

/**
 * Cliente MCP real (SDK oficial) conectado al McpServerProvider mediante un
 * transporte en memoria (InMemoryTransport.createLinkedPair) - mismo proceso,
 * pero protocolo MCP genuino (JSON-RPC, listTools/callTool) en vez de
 * function-calling casero. ChatService solo habla con esta clase.
 */
@Injectable()
export class McpClientService implements OnModuleInit {
    private readonly logger = new Logger(McpClientService.name);
    private readonly client = new Client({ name: 'banco-chat-backend', version: '1.0.0' });

    constructor(private readonly mcpServerProvider: McpServerProvider) { }

    async onModuleInit() {
        const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
        await Promise.all([
            this.mcpServerProvider.server.connect(serverTransport),
            this.client.connect(clientTransport),
        ]);

        const { tools } = await this.client.listTools();
        this.logger.log(`MCP conectado (transporte en memoria) - ${tools.length} tools registradas`);
    }

    async listToolDefinitions(): Promise<ToolDefinition[]> {
        const { tools } = await this.client.listTools();

        return tools.map((tool) => {
            const { [HIDDEN_FIELD]: _hidden, ...properties } = tool.inputSchema.properties ?? {};
            const required = (tool.inputSchema.required ?? []).filter((field) => field !== HIDDEN_FIELD);

            return {
                name: tool.name,
                description: tool.description ?? '',
                parameters: {
                    type: 'object',
                    properties,
                    ...(required.length ? { required } : {}),
                },
            };
        });
    }

    async callTool(name: string, args: Record<string, unknown>, userId: number): Promise<McpToolCallResult> {
        const rawResult = await this.client.callTool({
            name,
            arguments: { ...args, userId },
        });

        // Nuestras tools nunca usan ejecución basada en tasks (esa es una API
        // experimental cuyo resultado tiene otra forma, `{ toolResult: unknown }`):
        // siempre cae en la rama estándar con `content`.
        const result = rawResult as {
            content: { type: string; text?: string }[];
            structuredContent?: Record<string, unknown>;
            isError?: boolean;
        };

        const text = result.content
            .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
            .map((block) => block.text)
            .join('\n');

        return {
            text,
            isError: result.isError ?? false,
            ui: result.structuredContent as UiComponent | undefined,
        };
    }
}
