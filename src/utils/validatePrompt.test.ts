import { describe, it, expect } from 'vitest';
import { validatePromptLength } from './validatePrompt';

const MAX = 500;

describe('validatePromptLength', () => {
  it('빈 문자열은 유효하다', () => {
    expect(validatePromptLength('')).toEqual({ ok: true, message: null });
  });

  it('500자 이하는 유효하다', () => {
    expect(validatePromptLength('a'.repeat(MAX))).toEqual({ ok: true, message: null });
  });

  it('501자는 유효하지 않고 에러 메시지를 반환한다', () => {
    const result = validatePromptLength('a'.repeat(MAX + 1));
    expect(result.ok).toBe(false);
    expect(result.message).toContain('500');
  });

  it('에러 메시지에 현재 글자 수가 포함된다', () => {
    const input = 'a'.repeat(520);
    const result = validatePromptLength(input);
    expect(result.message).toContain('520');
  });
});
