export interface MysqlConnectionOptions {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
}

/** Convierte una DATABASE_URL tipo mysql://user:pass@host:port/db en las opciones que espera @prisma/adapter-mariadb. */
export function parseMysqlUrl(url: string): MysqlConnectionOptions {
    const parsed = new URL(url);
    return {
        host: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 3306,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, ''),
    };
}
