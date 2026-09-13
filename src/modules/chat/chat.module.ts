import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module.js';
import { AccountsModule } from '../accounts/accounts.module.js';
import { SavingsGoalsModule } from '../savings-goals/savings-goals.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { BudgetsModule } from '../budgets/budgets.module.js';
import { TransfersModule } from '../transfers/transfers.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';
import { ClaudeService } from './claude.service.js';
import { GeminiService } from './gemini.service.js';
import { LLM_PROVIDER, type LlmProvider } from './llm/llm-provider.interface.js';
import { McpServerProvider } from './mcp/mcp-server.provider.js';
import { McpClientService } from './mcp/mcp-client.service.js';

@Module({
    imports: [
        AuthModule,
        AccountsModule,
        SavingsGoalsModule,
        TransactionsModule,
        BudgetsModule,
        TransfersModule,
        CategoriesModule,
    ],
    controllers: [ChatController],
    providers: [
        ChatService,
        ClaudeService,
        GeminiService,
        McpServerProvider,
        McpClientService,
        {
            provide: LLM_PROVIDER,
            useFactory: (
                config: ConfigService,
                claude: ClaudeService,
                gemini: GeminiService,
            ): LlmProvider => (config.get<string>('llm.provider') === 'gemini' ? gemini : claude),
            inject: [ConfigService, ClaudeService, GeminiService],
        },
    ],
})
export class ChatModule { }
