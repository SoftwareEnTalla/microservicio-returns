// Third´s Modules
import * as joi from 'joi';
import 'dotenv/config';

/**
 * Variables de entorno
 */
type EnvVars = {
    APP_NAME: string,
    STAGE: 'PROD' | 'DEV',
    PORT: number,
    LANDING_APP: string,
    ADMIN_APP: string,
    JWT_SECRET: string,
    DB_HOST: string,
    DB_PORT: number,
    DB_USERNAME: string,
    DB_PASSWORD: string,
    DB_NAME: string,
    API_KEY: string,
    SA_EMAIL: string,
    SA_PWD: string,
    REDIS_HOST: string,
    REDIS_PORT: number,
    REDIS_TTL: string,
    CLD_NAME: string,
    CLD_FOLDER: string,
    CLD_API_KEY: string,
    CLD_API_SECRET: string,
    SWAGGER_USER: string,
    SWAGGER_PWD: string,
    MAIL_HOST_API: string,
    MAIL_HOST: string,
    MAIL_USER: string,
    MAIL_PORT_SSL: number,
    MAIL_PASS: string,
    MAIL_API_USER_ID: string,
    MAIL_API_SECRET: string,
}

/**
 * Validar las variables de entorno
 */
export const envsSchema = joi.object({
    APP_NAME: joi.string().required(),
    STAGE: joi.string().valid('PROD', 'DEV').required(),
    PORT: joi.number().required(),
    LANDING_APP: joi.string().required(),
    ADMIN_APP: joi.string().required(),
    JWT_SECRET: joi.string().required(),
    DB_HOST: joi.string().required(),
    DB_PORT: joi.number().required(),
    DB_USERNAME: joi.string().required(),
    DB_PASSWORD: joi.string().required(),
    DB_NAME: joi.string().required(),
    API_KEY: joi.string().required(),
    SA_EMAIL: joi.string().required(),
    SA_PWD: joi.string().required(),
    REDIS_HOST: joi.string().required(),
    REDIS_PORT: joi.number().required(),
    REDIS_TTL: joi.string().required(),
    CLD_NAME: joi.string().required(),
    CLD_FOLDER: joi.string().required(),
    CLD_API_KEY: joi.string().required(),
    CLD_API_SECRET: joi.string().required(),
    SWAGGER_USER: joi.string().required(),
    SWAGGER_PWD: joi.string().required(),
    MAIL_HOST_API: joi.string().required(),
    MAIL_HOST: joi.string().required(),
    MAIL_USER: joi.string().required(),
    MAIL_PORT_SSL: joi.number().required(),
    MAIL_PASS: joi.string().required(),
    MAIL_API_USER_ID: joi.string().required(),
    MAIL_API_SECRET: joi.string().required(),
}).unknown(true);

// Validar las variables de entorno
const { error, value } = envsSchema.validate(process.env);

// Lanzar error si hay un error en la validación
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

/**
 * Variables de entorno
 */
const envVars: EnvVars = value;

/**
 * Exportar las variables de entorno
 */
export const envs = {
    APP_NAME: envVars.APP_NAME,
    STAGE: envVars.STAGE,
    PORT: envVars.PORT,
    LANDING_APP: envVars.LANDING_APP,
    ADMIN_APP: envVars.ADMIN_APP,
    JWT_SECRET: envVars.JWT_SECRET,
    DB_HOST: envVars.DB_HOST,
    DB_PORT: envVars.DB_PORT,
    DB_USERNAME: envVars.DB_USERNAME,
    DB_PASSWORD: envVars.DB_PASSWORD,
    DB_NAME: envVars.DB_NAME,
    API_KEY: envVars.API_KEY,
    SA_EMAIL: envVars.SA_EMAIL,
    SA_PWD: envVars.SA_PWD,
    REDIS_HOST: envVars.REDIS_HOST,
    REDIS_PORT: envVars.REDIS_PORT,
    REDIS_TTL: envVars.REDIS_TTL,
    CLD_NAME: envVars.CLD_NAME,
    CLD_FOLDER: envVars.CLD_FOLDER,
    CLD_API_KEY: envVars.CLD_API_KEY,
    CLD_API_SECRET: envVars.CLD_API_SECRET,
    SWAGGER_USER: envVars.SWAGGER_USER,
    SWAGGER_PWD: envVars.SWAGGER_PWD,
    MAIL_HOST_API: envVars.MAIL_HOST_API,
    MAIL_HOST: envVars.MAIL_HOST,
    MAIL_USER: envVars.MAIL_USER,
    MAIL_PORT_SSL: envVars.MAIL_PORT_SSL,
    MAIL_PASS: envVars.MAIL_PASS,
    MAIL_API_USER_ID: envVars.MAIL_API_USER_ID,
    MAIL_API_SECRET: envVars.MAIL_API_SECRET,
};
