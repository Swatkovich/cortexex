export function safeParseJson(value: unknown): any | null {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    }
    return value as any;
}
