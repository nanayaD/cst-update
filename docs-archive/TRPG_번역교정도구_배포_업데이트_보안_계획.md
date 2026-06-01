# TRPG 번역·교정 도구 배포 및 업데이트 구현 계획

## 0. CST 적용 기준

이 계획은 현재 앱 이름과 저장 위치를 기준으로 다음처럼 적용한다.

```text
앱 표시명 / productName: CST
현재 앱 버전: package.json의 version, 현재 0.1.0
설정 저장 위치: Electron app.getPath("userData") 하위 settings.json
현재 Windows 기준 예: C:\Users\사용자명\AppData\Roaming\CST\settings.json
로그 저장 위치: C:\Users\사용자명\AppData\Roaming\CST\logs\
```

문서 안의 예시 이름 `TRPGTranslatorProofreader`는 초기 기획명으로 보고, 실제 구현에서는 `CST`로 통일한다.

업데이트 정보는 GitHub 저장소 `nanayaD/cst-update`에서 관리한다.

```text
실배포 latest.json:
https://raw.githubusercontent.com/nanayaD/cst-update/main/latest.json

테스트 latest-test.json:
https://raw.githubusercontent.com/nanayaD/cst-update/main/latest-test.json

다운로드 안내 페이지:
https://github.com/nanayaD/cst-update/releases/latest
```

`cst-update` 저장소에는 API 키, 비밀번호, 개인 설정, 비공개 배포 메모를 넣지 않는다. Codex/GitHub MCP로 업데이트 링크를 관리할 때도 `latest.json`, `latest-test.json`, 릴리스 링크와 공개 변경점만 수정한다.

### 0-1. 현행 점검 (2026-06-01 기준)

현재 코드와 빌드 설정은 이 계획과 대체로 일치한다. 점검 결과는 다음과 같다.

- **일치**: productName `CST`, version `0.1.0`, userData `Roaming\CST`(settings.json / logs), `build:portable`/`build:installer` 산출물 이름, `win.signAndEditExecutable:false`, NSIS `deleteAppDataOnUninstall:false`, 업데이트 감지 전용(`updateService.js`) + 설정 화면 수동 확인 버튼 + 하루 1회 자동 확인, semver 비교, HTTPS 전용 latest.json, 로그 민감정보 마스킹.
- **차이 / 보완 필요**:
  1. **제공사 범위**: 현재 앱은 **OpenAI + Gemini만** 지원한다. 12절 네트워크 목록의 Claude API(`api.anthropic.com`)는 **현재 미구현**이며, 추후 제공사를 추가할 때만 해당한다.
  2. **실제 배포 산출물 미게시**: 로컬에서 `CST-0.1.0-portable.exe` / `CST-Setup-0.1.0.exe` 빌드는 검증했으나 **GitHub Release로 업로드된 적은 없다.** 따라서 `latest.json`의 `downloadUrl`은 아직 실제 다운로드 대상을 가리키지 않는다(릴리스 페이지 또는 placeholder 상태).
  3. **버전**: 0.1.0 이후 번역기·교정기 기능이 다수 추가되었다(치환 변수 번역, 미번역 가드/경고, 머리말 파서 보강, 교정기 라벨/미리보기/화자명, 프롬프트 최종 수정안, 추천 모델 정리 등). 다음 배포 시 9절 규칙상 **minor 상향(예: 0.2.0)** 이 맞다.
  4. **미착수(향후 과제)**: 인앱 도움말 팝업(16절), Windows 코드서명. 업데이트 알림 모달의 라이브 end-to-end 검증과 오류 로그 버튼 라이브 검증도 아직 남아 있다.

## 1. 배포 기본 방향

이 프로그램은 TRPG 시나리오 번역 및 교정 보조용 도구로 제작한다.

초기 배포판은 무설치 바로 실행 exe 형태로 제공한다.  
최종 안정화 이후에는 설치형 exe 배포로 전환할 수 있다.

현재 빌드 명령과 산출물 이름 규칙은 다음과 같다.

```text
무설치 빌드: npm run build:portable
무설치 산출물: dist\CST-0.1.0-portable.exe

설치형 빌드: npm run build:installer
설치형 산출물: dist\CST-Setup-0.1.0.exe
```

실제 버전 번호는 `package.json`의 `version` 값을 따른다.

현재 배포는 지인 범위의 비공개/제한 공유용 unsigned 빌드다. Windows 코드서명 인증서를 도입하기 전까지는 `win.signAndEditExecutable: false`로 둔다. 이 설정은 일부 Windows 환경에서 electron-builder의 코드서명 도구가 심볼릭 링크를 만들 권한이 없어 빌드가 실패하는 문제를 피하기 위한 것이다. 정식 공개 배포나 SmartScreen 경고 완화를 목표로 할 때는 코드서명 인증서 도입을 별도 계획으로 다룬다.

초기 무설치판에서도 업데이트 감지 기능을 포함한다.  
나중에 설치형 배포로 전환할 경우, 무설치판의 업데이트 알림에서 설치형 setup.exe 다운로드 링크를 안내한다.

프로그램은 공개 배포를 전제로 하지 않는다.  
기본 배포 범위는 지인 및 지인의 지인 수준의 제한적 공유로 둔다.

## 2. API 키 관리 원칙

API 키는 각 사용자가 직접 발급하고 직접 입력한다.

개발자 또는 배포자는 API 키를 제공하지 않는다.  
프로그램 코드, 배포 파일, 업데이트 정보 파일 안에 개발자 API 키를 포함하지 않는다.

API 키 사용량, 과금, 계정 제한 등은 각 API 키 소유자가 관리한다.

프로그램은 사용자의 API 키를 개발자 서버로 전송하지 않는다.  
API 키는 사용자가 선택한 API 제공사 요청에만 사용한다.

## 3. 사용자 설정 저장 위치

API 키와 사용자 설정은 프로그램 실행 파일 옆에 저장하지 않는다.

사용자 설정은 Windows 사용자별 설정 폴더에 저장한다.

예시:

```text
C:\Users\사용자명\AppData\Roaming\CST\settings.json
```

캐시, 임시 파일, 로그가 필요한 경우에는 프로그램 전용 폴더만 사용한다.

예시:

```text
C:\Users\사용자명\AppData\Roaming\CST\logs\
```

무설치판과 설치형판은 동일한 설정 폴더명을 사용한다.  
이렇게 해야 무설치판에서 설치형판으로 전환해도 API 키와 사용자 설정이 유지된다.

## 4. 프로그램 파일과 사용자 설정 분리

프로그램 실행 파일과 사용자 설정 파일은 분리한다.

무설치판 예시:

```text
프로그램 파일:
D:\Tools\CST\CST.exe

사용자 설정:
C:\Users\사용자명\AppData\Roaming\CST\settings.json
```

설치형판 예시:

```text
프로그램 파일:
C:\Program Files\CST\CST.exe

사용자 설정:
C:\Users\사용자명\AppData\Roaming\CST\settings.json
```

같은 PC, 같은 Windows 계정에서 프로그램 위치만 바뀌는 경우 설정은 유지되어야 한다.

다른 PC로 exe만 복사하는 경우 설정은 따라가지 않아야 한다.  
새 PC에서는 API 키를 다시 입력하게 한다.

## 5. 공유 및 재압축 금지 안내

사용자가 본인이 사용하던 프로그램 폴더를 다시 압축해서 다른 사람에게 공유하지 않도록 안내한다.

프로그램 내 안내문, 사용설명서, 배포 안내문에 다음 내용을 포함한다.

```text
본인이 사용하던 프로그램 폴더를 재압축하여 다른 사람에게 공유하지 마십시오.
설정 파일에 API 키 또는 개인 설정이 포함될 수 있습니다.

다른 사람에게 전달할 때는 제작자가 제공한 배포용 exe 또는 배포용 압축파일만 공유하십시오.
API 키는 각 사용자가 직접 발급하고 직접 입력해야 합니다.
```

무설치판이라도 API 키와 사용자 설정은 AppData에 저장하여, exe만 전달했을 때 API 키가 같이 전달되지 않도록 한다.

## 6. 업데이트 감지 방식

업데이트 기능은 자동 설치가 아니라 업데이트 감지와 다운로드 링크 열기까지만 구현한다.

프로그램은 실행 시 원격의 `latest.json` 파일을 확인한다.  
현재 앱 버전보다 원격 버전이 높으면 업데이트 안내창을 표시한다.

현재 CST의 실배포 업데이트 정보 주소는 다음으로 둔다.

```text
https://raw.githubusercontent.com/nanayaD/cst-update/main/latest.json
```

테스트 빌드 또는 개발 확인에서는 다음 주소를 사용할 수 있다.

```text
https://raw.githubusercontent.com/nanayaD/cst-update/main/latest-test.json
```

업데이트 안내창에는 다음 정보를 표시한다.

```text
현재 버전
최신 버전
변경점
다운로드 페이지 열기 버튼
나중에 버튼
```

다운로드 페이지 열기 버튼을 누르면 OS 기본 브라우저로 `downloadUrl`을 연다.

프로그램이 직접 설치파일을 다운로드하거나 실행하지 않는다.  
프로그램이 자동으로 기존 exe를 교체하지 않는다.  
백그라운드 상주 업데이트 기능은 구현하지 않는다.

## 7. latest.json 구조

원격 업데이트 정보 파일은 JSON 형식으로 둔다.

예시:

```json
{
  "version": "0.2.0",
  "releaseDate": "2026-06-01",
  "downloadUrl": "https://example.com/download",
  "packageType": "portable",
  "required": false,
  "notes": [
    "번역기와 교정기를 별도 탭으로 통합",
    "업데이트 확인 기능 추가",
    "일부 UI 오류 수정"
  ]
}
```

설치형 전환 시 예시:

```json
{
  "version": "1.0.0",
  "releaseDate": "2026-06-01",
  "downloadUrl": "https://example.com/setup",
  "packageType": "installer",
  "required": false,
  "migrationMessage": "이번 버전부터 설치형 프로그램으로 배포됩니다. 설치 완료 후 기존 무설치 exe는 삭제해도 됩니다.",
  "notes": [
    "설치형 배포로 전환",
    "시작 메뉴 바로가기 지원",
    "언인스톨러 추가",
    "사용자 설정 유지"
  ]
}
```

`latest.json`에는 API 키, 비밀번호, 개인 연락처, 민감한 정보를 넣지 않는다.

## 8. 업데이트 확인 세부 동작

프로그램 실행 후 기본 UI를 먼저 표시한다.  
그다음 업데이트 확인을 백그라운드로 수행한다.

업데이트 확인 실패가 프로그램 실행 실패로 이어지면 안 된다.

네트워크 오류, JSON 파싱 오류, 서버 접속 실패가 발생해도 번역기와 교정기 기능은 정상 실행되어야 한다.

업데이트 확인 실패 메시지는 사용자에게 과하게 표시하지 않는다.  
필요한 경우 설정 화면 또는 개발자용 로그에만 간단히 남긴다.

설정 화면에 `업데이트 확인` 버튼을 제공하여 사용자가 수동으로 확인할 수 있게 한다.

자동 확인은 실행 시 1회 또는 하루 1회 정도로 제한한다.

## 9. 버전 비교 규칙

버전은 `major.minor.patch` 형식을 사용한다.

예시:

```text
0.1.0
0.1.1
0.2.0
1.0.0
```

버전 비교는 단순 문자열 비교로 처리하지 않는다.

다음 비교가 올바르게 동작해야 한다.

```text
0.10.0 > 0.2.0
1.0.0 > 0.9.9
0.2.1 > 0.2.0
```

일반 기준:

```text
patch 증가: 버그 수정
minor 증가: 기능 추가 또는 UI 변경
major 증가: 큰 구조 변경 또는 안정판 전환
```

## 10. 업데이트 테스트 기준

본인 PC 한 대에서도 업데이트 알림 테스트가 가능해야 한다.

테스트용 `latest-test.json`과 실배포용 `latest.json`을 분리할 수 있게 한다.

예시:

```text
테스트용:
https://raw.githubusercontent.com/nanayaD/cst-update/main/latest-test.json

실배포용:
https://raw.githubusercontent.com/nanayaD/cst-update/main/latest.json
```

필수 테스트 항목:

```text
1. 원격 버전이 현재 버전보다 높으면 알림이 뜨는가
2. 원격 버전이 현재 버전과 같으면 알림이 뜨지 않는가
3. 원격 버전이 현재 버전보다 낮으면 알림이 뜨지 않는가
4. 0.10.0을 0.2.0보다 높은 버전으로 판단하는가
5. 인터넷 연결이 없어도 프로그램이 정상 실행되는가
6. latest.json 주소가 틀려도 프로그램이 멈추지 않는가
7. downloadUrl 버튼을 누르면 기본 브라우저가 열리는가
8. notes가 여러 줄일 때 정상 표시되는가
9. packageType이 installer일 때 설치형 전환 안내문이 표시되는가
10. required가 true일 때 일반 업데이트보다 강한 안내가 표시되는가
```

## 11. 무설치판 업데이트 안내 문구

무설치판에서 새 무설치 버전을 안내할 때는 다음 문구를 사용한다.

```text
새 버전이 있습니다.

새 버전을 다운로드한 뒤, 현재 실행 중인 프로그램을 종료하고 기존 exe를 새 exe로 교체해 주세요.
API 키와 사용자 설정은 유지됩니다.
```

무설치판에서 설치형 버전을 안내할 때는 다음 문구를 사용한다.

```text
새 설치형 버전이 있습니다.

이번 버전부터 설치형 프로그램으로 배포됩니다.
기존 무설치 exe를 삭제하기 전에 새 설치형 버전을 먼저 설치해 주세요.

API 키와 사용자 설정은 유지됩니다.
설치 완료 후 기존 무설치 exe는 삭제해도 됩니다.
```

## 12. 보안 기본 원칙

프로그램은 필요한 기능만 수행한다.

보안상 지켜야 할 기준:

```text
1. 프로그램 코드에 개발자 API 키를 넣지 않는다.
2. 사용자의 API 키는 사용자별 설정 폴더 또는 OS 보안 저장소에 저장한다.
3. API 키와 원문 텍스트를 로그에 남기지 않는다.
4. latest.json은 HTTPS 주소에서만 읽는다.
5. latest.json에는 API 키, 비밀번호, 민감한 정보를 넣지 않는다.
6. 업데이트는 자동 실행하지 않고 다운로드 링크만 연다.
7. 파일은 사용자가 직접 선택한 것만 읽는다.
8. 출력 파일은 사용자가 지정한 위치에만 저장한다.
9. 삭제 기능은 프로그램 전용 폴더만 대상으로 한다.
10. 배포용 파일과 사용 중인 개인 설정 파일을 분리한다.
```

프로그램이 사용하는 네트워크 연결은 명확하게 분리한다.

예시:

```text
업데이트 확인:
https://raw.githubusercontent.com/nanayaD/cst-update/main/latest.json

OpenAI API:
https://api.openai.com/

Gemini API:
https://generativelanguage.googleapis.com/

Claude API (현재 미구현, 추후 제공사 추가 시에만 사용):
https://api.anthropic.com/
```

위 주소 외의 불필요한 외부 통신은 추가하지 않는다.

## 13. 로그 처리 기준

로그에는 민감한 정보를 남기지 않는다.

로그에 남겨도 되는 정보:

```text
업데이트 확인 성공 여부
업데이트 확인 실패 사유
API 요청 실패 여부
응답 파싱 실패 여부
프로그램 오류 발생 위치
```

로그에 남기지 말아야 하는 정보:

```text
API 키
번역 원문 전문
교정 원문 전문
번역 결과 전문
사용자가 입력한 긴 텍스트
개인 설정 전체 내용
```

오류 로그에 API 요청 헤더 전체를 출력하지 않는다.  
API 요청 본문 전체를 출력하지 않는다.

## 14. 파일 처리 기준

프로그램은 사용자가 직접 선택한 파일만 읽는다.

사용자의 문서 폴더, 다운로드 폴더, 드라이브 전체를 자동으로 스캔하지 않는다.

출력 파일은 사용자가 지정한 위치에만 저장한다.

삭제 기능이 필요한 경우, 삭제 대상은 프로그램 전용 폴더로 제한한다.

삭제 가능한 경로 예시:

```text
C:\Users\사용자명\AppData\Roaming\CST\
C:\Users\사용자명\AppData\Roaming\CST\logs\
```

삭제하면 안 되는 경로 예시:

```text
C:\Users\사용자명\AppData\
C:\Users\사용자명\Documents\
C:\Users\사용자명\Downloads\
드라이브 루트
사용자가 직접 저장한 작업물 폴더
```

## 15. 설치형 전환 시 언인스톨 기준

설치형으로 전환할 경우 언인스톨러를 제공한다.

기본 제거는 프로그램 파일만 삭제한다.  
API 키와 사용자 설정은 기본적으로 유지한다.

완전 제거 옵션을 따로 제공할 수 있다.

완전 제거 옵션 문구:

```text
사용자 설정도 함께 삭제하시겠습니까?

이 항목을 선택하면 저장된 API 키, 사용자 설정, 최근 사용 기록이 삭제됩니다.
나중에 다시 설치해도 기존 설정을 복구할 수 없습니다.
```

완전 제거 시에도 프로그램 전용 폴더만 삭제한다.

사용자가 직접 저장한 번역 결과, 교정 결과, 외부 작업 파일은 삭제하지 않는다.

## 16. 사용자 안내문

프로그램 또는 설명서에 다음 안내문을 포함한다.

```text
이 프로그램은 사용자가 직접 입력한 API 키를 통해 번역 및 교정 요청을 보냅니다.
개발자는 사용자의 API 키를 제공하거나 수집하지 않습니다.

입력한 텍스트는 사용자가 선택한 API 제공사로 전송될 수 있습니다.
전송 범위와 보관 정책은 각 API 제공사의 약관과 설정을 따릅니다.

API 키, 입력 원문, 번역 결과는 개발자 서버로 전송되지 않습니다.
업데이트 확인 시에는 최신 버전 정보 파일만 확인합니다.

본인이 사용하던 프로그램 폴더를 재압축하여 공유하지 마십시오.
설정 파일에 API 키 또는 개인 설정이 포함될 수 있습니다.
```

추후 사용설명서가 너무 길어지는 문제를 줄이기 위해, 프로그램 내부에 설명서 팝업을 추가하는 방안을 고려한다. 형태는 긴 TXT를 그대로 보여주는 방식이 아니라, 목차가 있는 작은 서적형/도움말 UI로 구성한다. 이 도움말은 로컬 문서만 표시하고 외부 웹페이지를 자동으로 열지 않는다.

## 17. 코딩 AI 구현 지시 요약

코딩 AI에게 전달할 핵심 요구사항은 다음과 같다.

```text
자동 설치 기능은 만들지 말고, 업데이트 확인과 다운로드 링크 열기만 구현한다.

요구사항:
1. 앱 내부에 현재 버전을 상수로 둔다.
2. 앱 실행 시 원격 latest.json을 가져온다.
3. latest.json에는 version, releaseDate, downloadUrl, packageType, required, notes, migrationMessage 필드를 둘 수 있다.
4. 현재 버전보다 latest.json의 version이 높으면 업데이트 안내 모달을 띄운다.
5. 안내 모달에는 현재 버전, 최신 버전, 변경점, 다운로드 페이지 열기 버튼, 나중에 버튼을 표시한다.
6. 다운로드 페이지 열기 버튼을 누르면 OS 기본 브라우저로 downloadUrl을 연다.
7. 네트워크 오류가 나도 앱 실행은 막지 않는다.
8. 업데이트 확인 실패 메시지는 사용자에게 과하게 표시하지 않는다.
9. 설정 화면에 업데이트 확인 버튼을 추가하여 수동 확인도 가능하게 한다.
10. 자동 다운로드, 자동 설치, 실행 중 exe 교체, 백그라운드 상주 기능은 구현하지 않는다.
11. 버전 비교는 문자열 비교가 아니라 semver 방식으로 처리한다.
12. API 키와 사용자 설정은 실행 파일 옆이 아니라 사용자별 설정 폴더에 저장한다.
13. API 키와 원문 텍스트를 로그에 남기지 않는다.
14. latest.json에는 민감한 정보를 넣지 않는다.
15. 무설치판과 설치형판은 같은 설정 폴더명을 사용한다.
```
