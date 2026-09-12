import Joi from 'joi';

const envValidationSchema = Joi.object({
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.number().default(28800),
    PORT: Joi.number().default(3000),
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
