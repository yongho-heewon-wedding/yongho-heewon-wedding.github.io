모바일 청첩장 구성 안내

1) 배포 경로
- 루트 `/index.html`에서 `/invitation/`로 자동 리다이렉트됩니다.

2) 이미지 경로
- 메인 이미지: `invitation/pictures/header/main_image.png` (파일명 그대로 사용 권장)
- 갤러리 이미지: `invitation/pictures/gallery/` 폴더에 `01.jpg, 02.jpg ...`처럼 작은 숫자부터 큰 숫자 순으로 배치 권장

3) 연락처/계좌 수정
- `invitation/app.js`의 `renderContacts`, `renderAccounts` 함수 내부 배열을 수정하세요.

4) 지도 연동
- 현재는 네이버 지도 앱/웹으로 깊은 링크를 제공하며, Static/JS API 키 연동은 추후 확장 가능합니다.

5) 카카오 공유
- `invitation/app.js`의 `setupShare`에 Kakao SDK를 연결해 키 설정 후 사용하세요.

6) 로컬 미리보기
- GitHub Pages 특성상 로컬 파일 열기보다 간단한 정적 서버(예: `npx serve invitation`)로 확인하는 것을 권장합니다.

7) 스타일 커스터마이즈
- `invitation/styles.css`의 변수(`:root`) 및 섹션 클래스를 수정하세요.

