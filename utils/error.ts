
/**
 * Replace the circular object relation
 */
const getCircularReplacer = () => {
    const seen = new WeakSet<object>();
    return (_key: string, value: unknown) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value as object)) return '[Circular]';
            seen.add(value as object);
        }
        return value;
    };
};

/**
 * Return a readable string for logging any thrown value.
 * - Includes Error.message and Error.stack (non-enumerable props included)
 * - Handles plain objects and primitives
 * - Guards against circular references
 */
export function formatError(err: unknown): string {
    try {
        if (err instanceof Error) {
            const out: Record<string, unknown> = {};
            for (const k of Object.getOwnPropertyNames(err)) {
                // copy own props (message, stack, code, etc.)
                try {
                    out[k] = (err as any)[k];
                } catch (copyErr) {
                    out[k] = `__unable_to_serialize__:${String(copyErr)}`;
                }
            }
            // ensure message & stack exist
            out.message = out.message ?? err.message;
            out.stack = out.stack ?? err.stack;
            return JSON.stringify(out, getCircularReplacer(), 2);
        }

        if (typeof err === 'object' && err !== null) {
            return JSON.stringify(err, getCircularReplacer(), 2);
        }

        return String(err);
    } catch (e) {
        return `Unserializable error: ${String(err)} (formatting failed: ${String(e)})`;
    }
}
