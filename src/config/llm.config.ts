import { registerAs } from '@nestjs/config';

/**
 * Qué proveedor de LLM usa el chat: "claude" (default) o "gemini".
 * Ver ChatModule -> factory de LLM_PROVIDER.
 */
export default registerAs('llm', () => ({
    provider: process.env.LLM_PROVIDER ?? 'claude',
}));
