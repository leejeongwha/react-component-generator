---
name: create-pr
description: |
  현재 브랜치의 변경사항을 분석해 PR(Pull Request)을 자동으로 생성하는 스킬.
  fork 서브에이전트가 diff 분석 → 언어 감지 → 템플릿 선택 → PR 생성 전 과정을 처리한다.

  다음 상황에서 반드시 이 스킬을 사용하세요:
  - "PR 만들어줘", "풀리퀘 올려줘", "PR 생성해줘", "PR 열어줘" 등 PR 생성 요청
  - "create PR", "open a pull request", "submit PR" 등 영문 PR 요청
  - 브랜치 작업 완료 후 PR을 올리려는 상황
  - 코드 리뷰를 요청하기 위해 PR이 필요한 상황
---

# create-pr 스킬

변경사항을 분석하고 프로젝트 언어에 맞는 PR을 자동으로 생성한다.

## 동작 방식

이 스킬을 사용할 때는 **fork 서브에이전트**를 즉시 띄워 전체 PR 생성 작업을 위임한다.
fork는 현재 대화 컨텍스트를 그대로 이어받으므로 별도 브리핑 없이 작업을 시작할 수 있다.

```
Agent({
  subagent_type: "fork",
  description: "PR 생성",
  prompt: <아래 'fork에게 전달할 프롬프트' 섹션 참고>
})
```

fork를 띄운 뒤 사용자에게 "PR 생성 중입니다. 완료되면 알려드리겠습니다."라고 짧게 알린다.

---

## fork에게 전달할 프롬프트 (그대로 사용)

```
다음 절차대로 PR을 생성해줘.

## 1단계: 현재 상태 파악

- `git status` — 커밋되지 않은 변경사항 확인 (있으면 먼저 커밋 요청)
- `git branch --show-current` — 현재 브랜치 이름
- `git log --oneline origin/HEAD..HEAD` 또는 `git log --oneline main..HEAD` — 이 브랜치의 커밋 목록
- `git diff origin/HEAD..HEAD` (또는 main..HEAD) — 전체 변경 내용
- `git remote -v` — 원격 저장소 URL

## 2단계: 언어 감지 (템플릿 선택)

다음 신호를 보고 프로젝트 언어를 판단한다:

**한국어 템플릿 사용 조건 (하나라도 해당하면 한국어):**
- remote URL에 한국 기업/팀 패턴 포함 (nhn, kakao, naver, line, krafton, woowabros, toss, coupang 등)
- README.md 상단 500자에 한글 포함
- 최근 커밋 메시지 절반 이상이 한글

**영문 템플릿 사용 조건:**
- 위 조건에 해당하지 않는 경우
- 해외 오픈소스 조직 (microsoft, facebook, google, vercel, vitejs, reactjs 등)
- CONTRIBUTING.md가 영어로만 작성된 경우

판단 기준: README와 커밋 언어가 가장 신뢰도 높은 신호다.
애매하면 사용자에게 한 줄로 물어보고 진행한다.

## 3단계: 템플릿 읽기

- 한국어: `.claude/skills/create-pr/references/pr-template-ko.md`
- 영문: `.claude/skills/create-pr/references/pr-template-en.md`

## 4단계: PR 내용 작성

1단계에서 수집한 커밋 목록과 diff를 바탕으로 템플릿을 채운다.
- PR 제목: 가장 핵심 변경을 한 줄로 요약 (50자 이내)
- 본문: 템플릿 섹션을 채우되, 해당 없는 섹션(스크린샷 등)은 자연스럽게 생략
- 빈 체크박스 항목은 그대로 남겨둬 리뷰어가 체크할 수 있게 한다

## 5단계: PR 생성

```bash
gh pr create \
  --title "<PR 제목>" \
  --body "$(cat <<'EOF'
<채운 템플릿 본문>
EOF
)"
```

base 브랜치는 `gh pr create`의 기본값을 사용한다. 명시적으로 지정이 필요하면 `--base main`을 추가한다.

생성 후 PR URL을 사용자에게 반환한다.
```

---

## 참고

- 템플릿 경로: `.claude/skills/create-pr/references/`
  - `pr-template-ko.md` — 한국어 팀 프로젝트용
  - `pr-template-en.md` — 해외 오픈소스 기여용
- 커밋되지 않은 변경사항이 있으면 PR 생성 전에 사용자에게 알린다 (커밋 스킬 사용 권유)
- `gh` CLI가 인증되어 있지 않으면 `gh auth login` 안내 후 중단한다
