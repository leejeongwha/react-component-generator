# AGENTS.md

## Operational Commands

```bash
bun install          # 의존성 설치
bun run dev          # API 서버(port 3002) + Vite 프론트엔드 동시 실행
bun run server       # API 서버만 실행
bun test             # 전체 테스트 (Vitest)
bun run build        # 프로덕션 빌드 (tsc -b && vite build)
bun run lint         # ESLint 검사
```

패키지 매니저는 **bun 고정**. npm / yarn / pnpm 사용 금지.

## Project Context

AI 프롬프트를 받아 React 컴포넌트 코드를 생성하고 react-live로 즉시 렌더링하는 도구.  
Anthropic Claude와 Google Gemini를 모두 지원하며, API 키는 환경변수 또는 UI 직접 입력으로 처리한다.

Tech Stack: React 19, TypeScript, Vite, Bun, react-live, Vitest, ESLint

## Golden Rules

### Immutable Constraints

**[GR-1] react-live noInline은 render() 호출을 요구한다.**
`src/components/LivePreview.tsx:14`의 `<LiveProvider noInline>` 때문에 생성된 코드 마지막에 반드시 `render(<ComponentName />)` 호출이 있어야 한다. 없으면 미리보기가 아무것도 표시하지 않는다(오류도 없이).

**[GR-2] render() 주입 이중 방어를 절대 한쪽만 제거하지 마라.**
SYSTEM_PROMPT(`server/index.ts:13`)가 AI에 render() 호출을 지시하고, `ensureRenderCall`(`server/generator.ts:16-24`)이 누락 시 자동 주입한다. 두 방어선 중 하나를 제거하면 AI가 비준수할 때 미리보기가 깨진다.

**[GR-3] 생성 코드에 TypeScript 문법을 포함하면 런타임 오류가 난다.**
SYSTEM_PROMPT(`server/index.ts:20`)가 명시적으로 금지한다. react-live는 TypeScript를 파싱하지 못하므로 타입 어노테이션, 제네릭, `as` 캐스트가 코드에 포함되면 LiveError가 표시된다.

**[GR-4] /api/config는 boolean 플래그만 노출한다.**
`server/index.ts:149-153`에서 `!!ENV_KEYS.anthropic`(boolean)만 반환한다. 실제 키 값을 클라이언트 응답에 포함시키면 안 된다.

### Do's & Don'ts

- 생성 코드에서 `import` 문 사용 금지 — React는 이미 전역에 있다(`server/index.ts:10`).
- 생성 코드에서 CSS import / CSS Module 사용 금지 — 인라인 스타일만 허용(`server/index.ts:9`).
- API 키 노출 금지 — `.env.example` 참고, `.env`는 .gitignore에 포함됨.

## Standards & References

커밋 메시지: `type(scope): 한국어 요약` 형식. type = feat / fix / refactor / chore / style / test / docs / perf.

코드 컨벤션: ESLint(`eslint.config.js`) + TypeScript strict. 변경 후 `bun run lint` 통과 확인.

테스트 경계: `server/generator.ts`, `server/fallback.ts`, `src/components/PromptInput.tsx`에 테스트 존재. `server/index.ts`와 대부분의 UI 컴포넌트는 테스트 없음 — HTTP 라우팅 변경 시 주의.

Maintenance Policy: 이 파일의 규칙이 실제 코드와 달라진 경우 업데이트를 제안하라.

## Context Map

- **[API 서버 수정 (Bun)](./server/AGENTS.md)** — HTTP 라우팅, AI 호출 로직, SYSTEM_PROMPT, 모델 폴백 수정 시.
