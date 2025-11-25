"use client";

export type Translator = (key: string) => string;

export function resolveErrorMessage(
  message: string | null | undefined,
  mapping: Record<string, string>,
  t: Translator
) {
  if (!message) return null;
  const key = mapping[message];
  return key ? t(key) : message;
}


