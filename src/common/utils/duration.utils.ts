

export function parseDurationToMs(duration: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(duration.trim());

    if (!match) {
        throw new Error(
            `Formato de duración inválido: "${duration}" (usa algo como 15m, 2h, 7d)`,
        );
    }

    const value = Number(match[1]);
    const unit = match[2];

    const unitToMs: Record<string, number> = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return value * unitToMs[unit];
}