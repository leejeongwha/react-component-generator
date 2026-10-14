# server/AGENTS.md

## Module Context

Bun 런타임 기반 API 프록시 서버. Vite 프론트엔드(`/api/*` 프록시)와 통신하며 Anthropic / Google AI API를 호출해 React 컴포넌트 코드를 생성한다. 포트 3002.

## Tech Stack & Constraints

- **런타임**: Bun (Node.js API 아님). `Bun.serve`, `bun --watch` 사용.
- **HTTP 클라이언트**: 전역 `fetch` 사용. axios 또는 node:http 금지.
- **테스트**: Vitest (`bun test` 또는 `bun test server/`). Bun test runner 아님.
- **TypeScript**: 서버 코드 자체는 TypeScript. 생성하는 컴포넌트 코드는 plain JavaScript만 허용.

## Implementation Patterns

**파일 역할 분리:**
- `generator.ts` — 순수 함수(부수효과 없음). 단위 테스트 가능한 텍스트 변환 로직.
- `fallback.ts` — 모델 순차 폴백 유틸리티.
- `index.ts` — `Bun.serve` 진입점. 라우팅, API 호출, 에러 핸들링.

**모델 폴백 패턴:**
```ts
// server/index.ts:5, fallback.ts:3
const GOOGLE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];
return withModelFallback(GOOGLE_MODELS, (model) => callGoogleModel(prompt, apiKey, model));
```
새 Google 모델 추가는 `GOOGLE_MODELS` 배열 앞에 삽입한다(우선순위 순).

**API 키 해석 순서:** 클라이언트 제공 키 → 환경변수 → null(400 반환). `server/index.ts:64-66`.

**CORS 처리:** 모든 응답에 `CORS_HEADERS`를 포함한다. OPTIONS 메서드는 별도 분기로 즉시 반환. `server/index.ts:51-55, 141-143`.

## Testing Strategy

```bash
bun test server/          # server 디렉토리만 테스트
bun test server/generator # generator.ts 테스트만
```

순수 함수(`generator.ts`, `fallback.ts`)만 단위 테스트 대상. `index.ts`의 HTTP 라우팅은 수동 검증 또는 통합 테스트로 확인.

테스트 파일 위치: 테스트 대상과 같은 디렉토리, `*.test.ts` 접미사.

## Local Golden Rules

**[LGR-1] SYSTEM_PROMPT를 수정하면 ensureRenderCall도 함께 검토하라.**
두 곳이 render() 규칙에 대해 이중 방어한다(`index.ts:13`, `generator.ts:16`). SYSTEM_PROMPT 변경으로 생성 코드 형식이 달라지면 `ensureRenderCall`의 정규식도 맞게 갱신해야 한다.

**[LGR-2] Google Gemini MAX_TOKENS는 불완전한 코드를 반환한다.**
`index.ts:123-125`에서 `finishReason === 'MAX_TOKENS'`를 별도로 잡아 에러를 던진다. 코드가 잘린 상태로 react-live에 전달되면 파싱 오류가 발생하므로 이 체크를 제거하지 마라.

**[LGR-3] 새 Provider 추가 시 /api/config 응답도 갱신하라.**
`index.ts:59-62`의 `ENV_KEYS`와 `index.ts:149-153`의 `/api/config` 응답이 연동된다. Provider 추가 시 두 곳을 함께 수정해야 프론트엔드가 키 존재 여부를 올바르게 인식한다.
