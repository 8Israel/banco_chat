import Joi from 'joi';

const envValidationSchema = Joi.object({
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.number().default(28800),
    PORT: Joi.number().default(3000),
    // Opcionales: sin la clave del proveedor elegido el servidor levanta igual,
    // pero el chat con el LLM falla al usarse.
    LLM_PROVIDER: Joi.string().valid('claude', 'gemini').optional(),
    ANTHROPIC_API_KEY: Joi.string().allow('').optional(),
    ANTHROPIC_MODEL: Joi.string().optional(),
    GEMINI_API_KEY: Joi.string().allow('').optional(),
    GEMINI_MODEL: Joi.string().optional(),
}).unknown(true);

export function validateEnv(config: Record<string, unknown>) {
    const { error, value } = envValidationSchema.validate(config, {
        abortEarly: false,
    });

    if (error) {
        throw new Error(`Configuración de entorno inválida: ${error.message}`);
    }

    return value;
}
