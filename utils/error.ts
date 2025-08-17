/**
 * Convert error to redable object
 */

export function errorToPOJO(error: unknown): Record<string, unknown> {
  const plain: Record<string, unknown> = {};

  if (error instanceof Error) {
    for (const key of Object.getOwnPropertyNames(error)) {
      // @ts-ignore: Accessing dynamic property names
      plain[key] = (error as any)[key];
    }
  } else {
    plain.error = typeof error === 'string' ? error : JSON.stringify(error);
  }

  return plain;
}
