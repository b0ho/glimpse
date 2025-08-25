#!/bin/bash

# Android 에뮬레이터 자동 실행 스크립트
# iOS 시뮬레이터처럼 간편하게 Android 에뮬레이터를 실행합니다.

echo "🤖 Android 에뮬레이터 시작 중..."

# Android SDK 경로 설정
ANDROID_SDK_PATH="$HOME/Library/Android/sdk"
EMULATOR_PATH="$ANDROID_SDK_PATH/emulator/emulator"

# 에뮬레이터 실행 중인지 확인
if pgrep -x "qemu-system" > /dev/null; then
    echo "✅ Android 에뮬레이터가 이미 실행 중입니다."
else
    # 사용 가능한 AVD 목록 가져오기
    AVD_LIST=$($EMULATOR_PATH -list-avds)
    
    if [ -z "$AVD_LIST" ]; then
        echo "❌ 사용 가능한 AVD가 없습니다."
        echo "Android Studio에서 AVD를 먼저 생성해주세요."
        exit 1
    fi
    
    # 첫 번째 AVD 선택
    FIRST_AVD=$(echo "$AVD_LIST" | head -n 1)
    
    echo "📱 에뮬레이터 시작: $FIRST_AVD"
    
    # 백그라운드에서 에뮬레이터 실행 (GPU 가속 활성화)
    $EMULATOR_PATH -avd "$FIRST_AVD" -gpu host &
    
    echo "⏳ 에뮬레이터 부팅 대기 중..."
    
    # adb 경로 설정
    ADB_PATH="$ANDROID_SDK_PATH/platform-tools/adb"
    
    # 에뮬레이터가 완전히 부팅될 때까지 대기
    $ADB_PATH wait-for-device
    
    # 부팅 완료 대기 (boot animation 완료 체크)
    while [ "$($ADB_PATH shell getprop sys.boot_completed | tr -d '\r')" != "1" ]; do
        sleep 2
    done
    
    echo "✅ Android 에뮬레이터가 준비되었습니다!"
fi

# Expo에서 Android 앱 실행
echo "🚀 Expo에서 Android 앱을 시작합니다..."
echo ""
echo "Expo 터미널에서 'a' 키를 누르면 Android 앱이 실행됩니다."
echo "또는 다음 명령어를 실행하세요: npx expo run:android"