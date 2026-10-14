export const PROMPT_MAX_LENGTH = 500;

export interface PromptValidation {
  ok: boolean;
  message: string | null;
}

export function validatePromptLength(prompt: string): PromptValidation {
  if (prompt.length <= PROMPT_MAX_LENGTH) {
    return { ok: true, message: null };
  }
  return {
    ok: false,
    message: `프롬프트는 ${PROMPT_MAX_LENGTH}자 이하여야 합니다. (현재 ${prompt.length}자)`,
  };
}
