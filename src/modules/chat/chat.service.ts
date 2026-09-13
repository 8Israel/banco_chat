import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { MessageRole, Prisma, type Message } from '../../generated/prisma/client.js';
import {
    LLM_PROVIDER,
    type LlmProvider,
    type NormalizedMessage,
    type NormalizedToolResult,
    type NormalizedToolUse,
} from './llm/llm-provider.interface.js';
import { McpClientService } from './mcp/mcp-client.service.js';
import type { UiComponent } from './ui/ui-component.types.js';
import { McpToolError, SessionNotFoundError } from '../../common/errors/app-errors.js';

const SYSTEM_PROMPT =
    'Eres el asistente virtual de un banco. Respondé de forma breve y clara, en español. ' +
    'Solo puedes dar información real usando las herramientas disponibles: no inventes datos de la cuenta del usuario. ' +
    'Nunca ejecutes una acción que mueva o comprometa dinero real (create_account, create_transaction, create_transfer, ' +
    'create_budget, create_savings_goal, contribute_savings_goal) en el mismo turno en que la persona la pide por primera vez, aunque ' +
    'ya haya dado todos los datos (monto, cuentas, categoría, etc.): primero resumí lo que vas a hacer y pedí una ' +
    'confirmación explícita, y solo ejecutá la acción en un mensaje posterior donde la persona confirme. ' +
    'Para metas de ahorro en particular, usá primero simulate_savings_plan para mostrar opciones antes de esa confirmación. ' +
    'Si te piden algo para lo que no tienes una herramienta, explicá honestamente que todavía no puedes hacer eso.';

const MAX_TOOL_ITERATIONS = 5;

@Injectable()
export class ChatService {
    constructor(
        private readonly prisma: PrismaService,
        @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
        private readonly mcpClient: McpClientService,
    ) { }

    async createSession(userId: number) {
        return this.prisma.sessionAgent.create({ data: { userId } });
    }

    async listSessions(userId: number) {
        return this.prisma.sessionAgent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getMessages(userId: number, sessionId: number) {
        const session = await this.findOwnedSession(userId, sessionId);
        return this.prisma.message.findMany({
            where: { sessionId: session.id },
            orderBy: { createdAt: 'asc' },
        });
    }

    async sendMessage(userId: number, sessionId: number, content: string): Promise<Message> {
        const session = await this.findOwnedSession(userId, sessionId);

        const priorHistory = await this.prisma.message.findMany({
            where: { sessionId: session.id },
            orderBy: { createdAt: 'asc' },
        });

        const userMessage = await this.prisma.message.create({
            data: { sessionId: session.id, role: MessageRole.USER, content },
        });

        // Si algo falla a mitad de camino (LLM caído, límite de herramientas, etc.)
        // se borra todo lo que se haya creado en este turno: dejar un mensaje de
        // usuario sin respuesta rompe la alternancia user/assistant que esperan
        // los proveedores en el próximo mensaje.
        const createdMessageIds: number[] = [userMessage.id];
        const turnHistory: Message[] = [...priorHistory, userMessage];
        const tools = await this.mcpClient.listToolDefinitions();

        try {
            // Un mismo turno puede combinar varias tools que generan UI (ej. una
            // pregunta amplia dispara get_savings_goals y get_monthly_summary):
            // se acumulan todas, no solo la última, para no perder componentes.
            const pendingUis: UiComponent[] = [];

            for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
                const response = await this.llm.createMessage({
                    system: SYSTEM_PROMPT,
                    messages: this.toNormalizedMessages(turnHistory),
                    tools,
                });

                if (response.stopReason !== 'tool_use' || response.toolUses.length === 0) {
                    const assistantMessage = await this.prisma.message.create({
                        data: {
                            sessionId: session.id,
                            role: MessageRole.ASSISTANT,
                            content: response.text,
                            ...(pendingUis.length
                                ? { uiSchema: pendingUis as unknown as Prisma.InputJsonValue }
                                : {}),
                        },
                    });
                    createdMessageIds.push(assistantMessage.id);
                    return assistantMessage;
                }

                const assistantMessage = await this.prisma.message.create({
                    data: {
                        sessionId: session.id,
                        role: MessageRole.ASSISTANT,
                        content: response.text,
                        toolData: { toolUse: response.toolUses } as unknown as Prisma.InputJsonValue,
                    },
                });
                createdMessageIds.push(assistantMessage.id);
                turnHistory.push(assistantMessage);

                const { toolMessage, uis } = await this.runTools(session.id, userId, response.toolUses);
                pendingUis.push(...uis);
                createdMessageIds.push(toolMessage.id);
                turnHistory.push(toolMessage);
            }

            throw new McpToolError(
                'Se alcanzó el límite de llamadas a herramientas para este mensaje',
            );
        } catch (error) {
            await this.prisma.message.deleteMany({ where: { id: { in: createdMessageIds } } });
            throw error;
        }
    }

    // Todas las llamadas a herramientas que pidió una misma respuesta del modelo
    // se ejecutan vía MCP y se guardan como un único mensaje TOOL (una entrada
    // por llamada en toolData.results), para que al reconstruir el historial
    // viajen juntas en un solo turno en vez de como mensajes sueltos. Cada tool
    // que haya devuelto un componente A2UI se acumula (no se sobreescribe) para
    // propagarlos todos al próximo mensaje ASSISTANT que el usuario vea.
    private async runTools(
        sessionId: number,
        userId: number,
        toolUses: NormalizedToolUse[],
    ): Promise<{ toolMessage: Message; uis: UiComponent[] }> {
        const results: NormalizedToolResult[] = [];
        const uis: UiComponent[] = [];

        for (const toolUse of toolUses) {
            const result = await this.mcpClient.callTool(toolUse.name, toolUse.input, userId);
            if (result.ui) {
                uis.push(result.ui);
            }
            results.push({
                toolUseId: toolUse.id,
                toolName: toolUse.name,
                isError: result.isError,
                content: result.text,
            });
        }

        const toolMessage = await this.prisma.message.create({
            data: {
                sessionId,
                role: MessageRole.TOOL,
                content: '',
                toolData: { results } as unknown as Prisma.InputJsonValue,
            },
        });

        return { toolMessage, uis };
    }

    private async findOwnedSession(userId: number, sessionId: number) {
        const session = await this.prisma.sessionAgent.findUnique({ where: { id: sessionId } });
        if (!session || session.userId !== userId) {
            throw new SessionNotFoundError();
        }
        return session;
    }

    private toNormalizedMessages(history: Message[]): NormalizedMessage[] {
        const messages: NormalizedMessage[] = [];

        for (const message of history) {
            if (message.role === MessageRole.USER) {
                messages.push({ role: 'user', content: message.content });
                continue;
            }

            if (message.role === MessageRole.ASSISTANT) {
                const toolData = message.toolData as { toolUse?: NormalizedToolUse[] } | null;
                messages.push({
                    role: 'assistant',
                    content: message.content,
                    toolUses: toolData?.toolUse ?? [],
                });
                continue;
            }

            if (message.role === MessageRole.TOOL) {
                const toolData = message.toolData as { results?: NormalizedToolResult[] } | null;
                messages.push({ role: 'tool', results: toolData?.results ?? [] });
            }
        }

        return messages;
    }
}
