# Android 에뮬레이터 실행 가이드

## 🚀 빠른 시작

iOS 시뮬레이터처럼 간편하게 Android 에뮬레이터를 실행할 수 있습니다!

### 에뮬레이터만 실행
```bash
npm run android:emulator
```

### 에뮬레이터 실행 + Expo 시작
```bash
npm run android:start
```

## 📱 사용 가능한 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run android:emulator` | Android 에뮬레이터만 실행 |
| `npm run android:start` | 에뮬레이터 실행 후 Expo 시작 |
| `npm run android` | Expo에서 Android 앱 빌드 및 실행 |

## 🔧 동작 방식

1. **에뮬레이터 체크**: 이미 실행 중인지 확인
2. **자동 실행**: 실행 중이 아니면 자동으로 시작
3. **부팅 대기**: 완전히 부팅될 때까지 대기
4. **준비 완료**: Expo에서 'a' 키를 눌러 앱 실행

## ⚙️ 초기 설정 (처음 한 번만)

### 1. Android Studio 설치
- [Android Studio 다운로드](https://developer.android.com/studio)
- 설치 후 AVD Manager에서 가상 디바이스 생성

### 2. 환경 변수 설정 (선택사항)
```bash
# ~/.zshrc 또는 ~/.bash_profile에 추가
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 🎯 특징

- **iOS처럼 간편**: Android Studio 실행 불필요
- **자동화**: 모든 과정이 자동으로 진행
- **빠른 시작**: 한 번의 명령으로 개발 시작
- **GPU 가속**: 빠른 에뮬레이터 성능

## 📝 문제 해결

### AVD가 없는 경우
```
❌ 사용 가능한 AVD가 없습니다.
```
→ Android Studio의 AVD Manager에서 가상 디바이스를 생성하세요.

### 에뮬레이터가 느린 경우
- Intel HAXM 또는 AMD 가상화 활성화 확인
- AVD 설정에서 RAM 크기 조정 (권장: 2048MB)

### adb 명령어를 찾을 수 없는 경우
```bash
# platform-tools 설치
~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager "platform-tools"
```

## 🔍 유용한 명령어

### 실행 중인 에뮬레이터 확인
```bash
~/Library/Android/sdk/platform-tools/adb devices
```

### 에뮬레이터 종료
```bash
~/Library/Android/sdk/platform-tools/adb emu kill
```

### AVD 목록 확인
```bash
~/Library/Android/sdk/emulator/emulator -list-avds
```

---

이제 iOS처럼 간편하게 Android 개발을 시작할 수 있습니다! 🎉