# Pururum 개발 로그

> `.qmd` / `.md`(Quarto/Markdown)를 Obsidian/Typora처럼 **라이브 프리뷰**로 편집하는
> 백엔드 없는 macOS 앱. Tauri(Rust) 데스크톱 + 웹 버전이 **하나의 프론트엔드**를 공유.
> 최종 배포: **github.com/guebin/pururum** (릴리즈 v1.1.0).

---

## 1. 앱 구조 (핵심 파일)

| 경로 | 역할 |
|---|---|
| `quarto_viewer/static/index.html` | 공유 프론트엔드 — UI·툴바·모든 팝업 편집기·렌더 파이프라인(marked+hljs+MathJax)·Tauri/web 어댑터 |
| `quarto_viewer/static/doc.css` | 문서 테마 (신록예찬 블로그 실측값: 산호색 제목, 보라 인라인코드 등) |
| `quarto_viewer/static/fonts.css` | **base64 임베드 폰트** (Noto Serif + 나눔명조) |
| `editor-src/src/editor.js` | CodeMirror 6 라이브 프리뷰 — 데코레이션·위젯·커서·키맵. `npm run build`로 `vendor/cm6/editor.bundle.js` 생성 |
| `verdure-tauri/src-tauri/src/lib.rs` | Rust 백엔드 — 파일 I/O, 저장 대화상자, 자동저장, `export_html` 등 |
| `verdure-tauri/src-tauri/tauri.conf.json` | 앱명(Pururum)·식별자(`com.local.verdure`)·**버전** |
| `Casks/pururum.rb` | Homebrew cask |
| `.github/workflows/pages.yml` | GitHub Pages 배포(웹) |

**빌드**: `export PATH="$HOME/.cargo/bin:$PATH"` 후
`cd verdure-tauri && npm run tauri build -- --bundles app`(또는 `dmg`).
에디터 변경 시 `cd editor-src && npm run build` 선행.

---

## 2. 통합 오브젝트 모델 (이번 세션의 큰 축)

**표·콜아웃·탭셋·이미지·프론트매터**가 전부 같은 로직을 공유하고, **타입별 팝업만** 다름.

- **삽입**: 공용 `insertBlockText()` — 위아래 **빈 줄로 격리**(파싱 오류 방지).
  ⚠️ 초기에 `insertBlock`이라는 동명 함수를 만들어 삽입 메뉴 전체가 깨진 사고 →
  `insertBlockText`로 개명. **교훈: 전역 함수는 grep으로 동명 확인.**
- **삭제**: 호버 시 **빨간 × 배지**(`addDeleteBadge`) + 캐럿 인접 시 **Backspace/Delete**
  (`deleteAtomicAt` 키맵). placeCursor가 위젯 뒤에 캐럿을 둠.
- **편집(클릭→팝업)**:
  - **표** — 스프레드시트 그리드 + 열 정렬·가운데·캡션·삭제
  - **콜아웃** — 종류(노트/팁/경고/주의/중요) + 제목 + 본문 + 삭제
  - **탭셋** — 탭 추가/삭제/이름변경 + 본문 + 삭제
  - **이미지** — 정렬 + **낙서(캔버스)** + 캡션 + 삭제 (크기는 모서리 드래그)
  - **프론트매터** — 제목/부제/저자/날짜 + 기타 YAML (삽입 메뉴엔 없음)
- **위치 탐색 견고화**: 공용 `findObjRange` — DOM 위치 우선, 실패 시 **문서 전체 유일매치**로
  폴백. 팝업 포커스 핸드오프로 위젯이 재렌더/끊겨도 수정이 반영됨(실기 WKWebView 대응).
- **실시간 미리보기**: 표·콜아웃·탭셋 팝업에 편집 필드 아래 **실제 렌더 미리보기**.
  탭셋 미리보기는 편집 중인 탭과 동기화(양방향).

### 코드 블록은 오브젝트화 **안 함**
사용자 요청으로 되돌림 — 커서 밖=하이라이팅 패널, 커서 안=원문 편집(구문 강조 유지).
삽입은 언어 하드코딩 없이 빈 ```` ``` ````에 커서.

---

## 3. 타이포그래피 (신록예찬 블로그 정합)

- **폰트**: 라틴·숫자·기호=**Noto Serif**, 한글=**나눔명조**(Noto Serif에 한글 없어 폴백).
  둘 다 `fonts.css`에 **base64 data URI**로 임베드.
  ⚠️ `url('fonts/*.otf')` 방식은 실기 Tauri/WKWebView서 로드 실패(에셋 프로토콜/MIME) →
  base64로 확실히 로드.
- **리스트 들여쓰기**: **Quarto cosmo를 실제 렌더해 실측** → 본문 대비 레벨당 정확히 2em.
  에디터는 불릿 in-flow라 depth 계산해 `padding = depth·1.4 − 0.66em`로 맞춤(레벨1=2.00em,
  레벨2=4.00em). 눈대중값(1.6em·0.6em)은 다 틀렸고 **실측이 정답**.

---

## 4. 캡션

- **이미지/낙서**: 캡션 = **alt 텍스트**(Quarto figure). 팝업 입력, 에디터 위젯은 이미지 바로
  아래 `.qv-imgcap`, 프리뷰/출력은 단독 이미지를 `<figure><figcaption>`으로.
- **표**: pandoc **`: Caption` 줄**을 표 위젯이 흡수 → 팝업 캡션 필드 + `<caption>` 렌더.

---

## 5. 출력: 인쇄 폐기 → 단일 HTML export (1.1.0)

- 네이티브 인쇄는 **탭셋 때문에 안 됨** → 전면 제거.
- **출력 버튼(⌘P) = `doExport`**: 문서를 **자체완결 .html 한 파일**로 저장.
  - 폰트(base64)·CSS·MathJax woff(base64)·수식 pre-render 전부 인라인
  - 이미지 = data/attachment URI
  - **탭셋은 작은 인라인 스크립트로 인터랙티브 유지**
  - 저장: 데스크톱=OS 저장 대화상자(Rust `export_html`), 웹=Blob 다운로드
  - 검증: 5.7MB 파일이 `file://`에서 폰트·수식·탭셋까지 독립 렌더
- ⚠️ 저장 경로 토스트는 **NFC 정규화**(macOS가 한글 파일명을 NFD로 저장).

---

## 6. UI 정리

- **삽입 메뉴 아이콘**: 흐릿한 박스 문자 → 또렷한 **라인 SVG**(콜아웃·표·탭셋·`</>`·연필).
- **소스/도움말 버튼**: 원형 아웃라인 쌍(소스는 on 시 코랄+글로우). **소스 토글 ⌘E**(⌘/는 주석
  충돌로 이전).
- **웹 툴바**: 사이드바 없는 웹에서 아이콘이 탭과 겹치던 것 → flex 흐름으로 정리.
- 이미지 팝업의 크기 슬라이더 제거(모서리 드래그로), 캡션은 이미지 바로 아래로.

---

## 7. 주요 버그 & 근본 원인 (WKWebView divergence 교훈)

**헤드리스 WebKit ≠ 실기 macOS WKWebView.** 이번에 반복 확인:

1. **낙서 사각지대** — 캔버스를 자연해상도로 잡아 **Retina(DPR 2)**서 포인터 매핑이 어긋남.
   → 캔버스를 **표시 크기 × DPR**로, CSS 픽셀로 그림. (헤드리스 DPR 1이라 안 드러남)
2. **오브젝트 수정 반영 안 됨** — 팝업 포커스 핸드오프로 위젯 재렌더→`el.isConnected=false`
   → 문서 전체 유일매치 폴백으로 해결.
3. **탭 두 번 클릭** — 탭 바를 클릭 중 재렌더해 첫 클릭이 씹힘 → 재렌더 없이 활성 클래스만 토글.
4. **폰트 미적용** — 위 3번(에셋 프로토콜) → base64 임베드.
5. **재설치 함정** — 앱 실행 중 재설치하면 옛 인스턴스가 새 코드 반영 못 함 → **⌘Q 후 재실행**.
6. **폴더 rename 후 빌드 실패** — cargo 캐시에 옛 절대경로 → `cargo clean` 후 재빌드.

---

## 8. 배포 상태

- **원격 2개**: `origin`=miruetoto/verdure(개발·웹), `guebin`=github.com/guebin/pururum(공식).
- **릴리즈 v1.1.0** + `Pururum.dmg`(Apple Silicon, ad-hoc 서명). `releases/latest/download/Pururum.dmg`.
- **설치 3방식**(README): Homebrew tap / 원커맨드 curl / 수동 dmg. (`xattr -dr com.apple.quarantine` 필요)
- **Homebrew cask** `Casks/pururum.rb` (dmg 갱신 시 version·sha256 수정).

---

## 9. 남은 일 (TODO)

- [ ] **웹 Pages 활성화** — guebin 계정에서 Settings → Pages → Source "GitHub Actions" (1회).
      그전 동작 웹 = miruetoto.github.io/verdure.
- [ ] **zoom 기능** (⌘+/⌘− 문서 확대/축소) — 사용자 요청, 미구현.
- [ ] Intel(Universal) 빌드는 미제공(현재 aarch64만).
- [ ] 새 dmg 낼 때마다 `Casks/pururum.rb`의 version·sha256 갱신 + 릴리즈 재업로드.
