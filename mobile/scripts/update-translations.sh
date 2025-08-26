#!/bin/bash

# Android 안전 번역 훅으로 업데이트하는 스크립트
# 주요 화면들의 useTranslation을 useAndroidSafeTranslation으로 변경

echo "🔄 Updating translation hooks for Android compatibility..."

# screens 디렉토리의 파일들 업데이트
for file in screens/*.tsx screens/**/*.tsx; do
  if [ -f "$file" ]; then
    # useTranslation import를 useAndroidSafeTranslation으로 변경
    sed -i '' "s/import { useTranslation } from 'react-i18next';/import { useAndroidSafeTranslation } from '@\/hooks\/useAndroidSafeTranslation';/g" "$file"
    
    # useTranslation 호출을 useAndroidSafeTranslation으로 변경
    sed -i '' "s/const { t } = useTranslation(/const { t } = useAndroidSafeTranslation(/g" "$file"
    sed -i '' "s/const { t, i18n } = useTranslation(/const { t, i18n } = useAndroidSafeTranslation(/g" "$file"
    
    echo "✅ Updated: $file"
  fi
done

# components 디렉토리의 파일들 업데이트
for file in components/*.tsx components/**/*.tsx; do
  if [ -f "$file" ]; then
    # useTranslation import를 useAndroidSafeTranslation으로 변경
    sed -i '' "s/import { useTranslation } from 'react-i18next';/import { useAndroidSafeTranslation } from '@\/hooks\/useAndroidSafeTranslation';/g" "$file"
    
    # useTranslation 호출을 useAndroidSafeTranslation으로 변경
    sed -i '' "s/const { t } = useTranslation(/const { t } = useAndroidSafeTranslation(/g" "$file"
    sed -i '' "s/const { t, i18n } = useTranslation(/const { t, i18n } = useAndroidSafeTranslation(/g" "$file"
    
    echo "✅ Updated: $file"
  fi
done

echo "✨ Translation hooks updated successfully!"