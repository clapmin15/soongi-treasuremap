# 🏴‍☠️ 숭이의 보물지도

좋아하는 장소를 지역별로 소개하는 정적 HTML/CSS/JavaScript 웹사이트입니다.

## 페이지
- `index.html`: 메인 / 지역 선택 / ⭐ 비밀 페이지 링크
- `top.html`: 수도권
- `middle.html`: 중부·강원
- `bottom.html`: 남부
- `secret.html`: 비밀 메시지 + 공개 보물 기록장 / 관리자 장소 관리

## Firebase 연결 (사용자 작업 필요)
1. Firebase 콘솔에서 새 프로젝트를 만들고 **웹 앱**을 등록합니다.
2. **Authentication > Sign-in method > 이메일/비밀번호**를 활성화합니다.
3. **Authentication > 사용자**에서 본인 관리자 계정을 추가합니다. **비밀번호를 코드나 GitHub에 기록하지 마세요.**
4. 사용자 계정의 **UID**를 확인합니다.
5. **Realtime Database**를 생성합니다. 데이터베이스 URL을 확인합니다.
6. `js/firebase-config.js`에 웹 앱 설정값(`apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`)과 `ADMIN_UIDS`를 입력합니다. 웹 앱 설정값은 클라이언트에서 쓰는 공개 설정값이며 **관리자 비밀번호가 아닙니다**.
7. 제공한 두 관리자 UID는 코드와 규칙에 반영되어 있습니다. **Realtime Database > 규칙**에 내용을 적용하고 게시합니다. 향후 관리자를 바꿀 경우 코드와 규칙을 모두 함께 변경하세요.
8. **반드시** 로그아웃 상태에서 조회만 가능하고, 등록·수정·삭제는 불가능한지 확인합니다. 로그인한 관리자에서는 등록·수정·삭제를 시험합니다.
9. GitHub 저장소를 만든 뒤 모든 HTML의 footer에 표시되는 GitHub 링크를 실제 저장소 URL로 수정합니다. (`js`에서 자동 설정하지 않으므로 HTML의 `href`를 바꾸세요.)
10. GitHub Pages를 설정합니다: 저장소 Settings > Pages > Deploy from a branch > main / (root). 생성된 공개 주소에서 페이지와 사진을 시험합니다.

## 사진 저장에 대한 중요한 안내
현재 버전은 사진을 브라우저에서 640px JPEG로 축소한 후 **Realtime Database에 문자열로 저장**합니다. 별도의 Cloud Storage 결제 설정 없이 작게 시험할 수 있지만, 장소/사진이 많아지면 데이터베이스 용량과 트래픽이 커집니다. 이미지 전용 저장 방식은 아닙니다. 사용량이 늘어나면 Cloud Storage 등으로 전환하는 것이 좋습니다. 원본 사진을 그대로 보관하지 않습니다. JPG/PNG/WebP/GIF 파일(최대 20MB)을 받아 640px 이내 JPEG로 압축하며, 저장 문자열은 최대 170,000자입니다. GIF는 정지 사진으로 저장됩니다. 사진은 선택사항이며, 수정 시 새 파일을 선택하지 않으면 기존 사진을 유지합니다. “기존 사진 삭제”를 선택하면 사진만 제거합니다.

## 로컬 실행
ES Module과 Firebase CDN을 사용하므로 파일을 직접 더블클릭하는 대신 로컬 서버로 여세요. 예: VS Code Live Server. Firebase 연결 전에는 메뉴와 화면을 확인할 수 있으나 데이터 저장은 작동하지 않습니다.

## 보안
- `ADMIN_UIDS`를 HTML/JS에서 비교하는 것은 화면 표시용입니다. **실제 쓰기 권한은 데이터베이스 규칙에서 제한**합니다.
- Firebase API 키는 일반적으로 클라이언트 앱 설정값이지만, 데이터베이스 규칙을 안전하게 설정해야 합니다.
- 비밀번호를 소스 코드에 넣지 마세요.
- 두 관리자 UID가 들어 있는 `database.rules.json` 전체를 Realtime Database 규칙에 게시하세요.
- 이 사이트의 사진과 주소는 공개되므로 개인정보나 타인의 민감한 정보를 올리지 마세요.

## 강의자료 활용
- HTML 2~4주차: HTML 문서 구조, 링크, 이미지, form, header/nav/main/footer
- CSS 5~6주차: 선택자, 글꼴, 색상, flex, 간격, hover
- JS 8~9주차: 변수, 함수, 조건문
- JS 11주차: `querySelector`, `addEventListener`, `classList.toggle`을 사용한 햄버거 메뉴
- 강의자료에 없는 추가 코드는 동봉된 Word 문서 참조


## 이번 기능 완성본
- 원본 CSS, 이미지, 메인 페이지와 기존 지역 소개 디자인을 그대로 유지했습니다.
- 시크릿 소개 아래에 기존 지역 페이지와 같은 기록장을 추가했습니다.
- 네 기록장은 `places/top`, `places/middle`, `places/bottom`, `places/secret`으로 각각 저장합니다.
- 비로그인 방문자는 사진과 기록을 조회할 수 있습니다. **시크릿 페이지도 공개 조회 대상이며 비공개 저장소가 아닙니다.**
- 지정된 관리자 UID만 입력창과 카드 관리 버튼을 볼 수 있습니다. 실제 쓰기 제한은 DB 규칙에서 수행합니다.
- 사진 미리보기, 등록, 수정, 삭제 확인, 취소, 중복 저장 방지, 저장 오류 표시를 지원합니다.
- 로그인 지속 상태를 구독하여 페이지 이동 후에도 관리자 도구를 표시합니다. 로그아웃 시 수정 중인 입력을 초기화합니다.
- Firebase CDN 연결 실패 때도 메뉴/페이지 이동은 동작하며 오류를 표시합니다.

## 연결 전 꼭 완료할 설정
첨부 원본에는 Firebase 값과 관리자 UID가 모두 비어 있었습니다. 현재 ZIP에는 사용자가 제공한 웹 앱 설정과 두 관리자 UID를 반영했습니다. 비밀번호는 포함하지 않았습니다. Realtime Database URL도 반영했습니다. 이제 Firebase 콘솔에서 저장 규칙을 게시하고 사이트를 올리면 됩니다.
1. `js/firebase-config.js`에 제공한 공개 웹 앱 설정과 databaseURL을 반영했습니다.
2. 두 관리자 UID는 `ADMIN_UIDS`와 `database.rules.json`에 이미 동일하게 반영했습니다. 두 계정은 모든 지역의 기록을 함께 관리합니다.
3. 이메일/비밀번호 로그인을 활성화하고 관리자 계정을 생성합니다. Authentication의 승인된 도메인 설정에서 실제 서비스 도메인과 필요 시 `localhost`를 확인합니다.
4. Realtime Database 규칙 탭에 이 ZIP의 규칙 전체를 적용하고 게시합니다. Firestore 규칙이 아닙니다.
5. 웹 서버에서 열어 관리자 로그인 → 네 페이지 각각 기록 등록 → 새로고침 → 수정 → 로그아웃 공개 조회 → 재로그인 후 삭제를 확인합니다.

`firebase.json`은 Realtime Database 규칙 파일 위치를 지정합니다. Firebase CLI를 사용하는 경우 본인 프로젝트를 선택한 다음 규칙을 배포할 수도 있습니다. 이 작업 중 실제 프로젝트에 연결하거나 규칙을 게시하지는 않았습니다.

## 데이터 규칙
기존 `name`, `address`, `review`, `photo`, `createdAt` 구조를 유지했습니다. `photo`는 선택사항이며 빈 문자열도 허용합니다.
장소명 60자, 주소 160자, 한줄평 300자 이내의 비어 있지 않은 문자열을 검증합니다. 사진은 제한 길이 이내의 JPEG/PNG/WebP data URL 또는 기존 HTTPS 이미지 URL을 허용합니다.
관리자 외 쓰기, 허용하지 않은 지역 경로, 알 수 없는 필드, 잘못된 필드 형식은 거부합니다. 작성 시간은 수정 시 유지합니다.
기존 데이터가 이 형식과 다르면 조회는 가능하지만 수정 전 해당 레코드 형식을 정리해야 할 수 있습니다.

## 기능 테스트
`TEST_RESULTS.md`에 확인 범위와 제한을 기록했습니다. 실제 Firebase 프로젝트 테스트는 위 설정 이후 별도로 필요합니다.
Node.js가 설치되어 있으면 `node tests/functional.test.cjs`로 외부 서비스 연결 없이 이벤트 처리 테스트를 실행할 수 있습니다.
브라우저 테스트는 `playwright` 패키지와 Microsoft Edge가 설치된 환경에서 `node tests/browser.test.cjs`로 실행합니다. 이 테스트는 로컬 임시 서버와 테스트용 Firebase 응답을 사용합니다.

Firebase 공식 문서: [인증 시작하기](https://firebase.google.com/docs/auth/web/start), [Realtime Database 규칙](https://firebase.google.com/docs/database/security), [데이터 검증](https://firebase.google.com/docs/rules/data-validation).
