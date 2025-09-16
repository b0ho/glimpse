#!/usr/bin/env node

/**
 * StyleSheet를 NativeWind로 자동 전환하는 스크립트
 * 남은 60개+ 컴포넌트를 일괄 처리
 */

const fs = require('fs');
const path = require('path');

// 전환 대상 파일 목록
const CONVERSION_LIST = [
  // Chat Components (남은 6개)
  'components/chat/VoiceMessageRecorder.tsx',
  'components/chat/MessageReactions.tsx',
  'components/chat/MediaPicker.tsx',
  'components/chat/ImageMessage.tsx',
  'components/chat/VoiceMessagePlayer.tsx',
  
  // Profile Components (10개)
  'components/profile/LikeSystemStatus.tsx',
  'components/profile/PremiumSection.tsx',
  'components/profile/ActivityStats.tsx',
  'components/profile/edit/SocialAccountsSection.tsx',
  'components/profile/edit/BasicInfoSection.tsx',
  'components/profile/ProfileInfoCards.tsx',
  'components/profile/ProfileHeader.tsx',
  'components/profile/LikesReceivedModal.tsx',
  'components/profile/LetterFromFounder.tsx',
  'components/profile/FriendRequestsModal.tsx',
  
  // Groups Components (4개)
  'components/groups/GroupCard.tsx',
  'components/groups/GroupsHeader.tsx',
  'components/groups/GroupsFooter.tsx',
  'components/groups/GroupsEmptyState.tsx',
  
  // Common Components (5개)
  'components/common/ScreenHeader.tsx',
  'components/common/LoadingScreen.tsx',
  'components/common/EmptyState.tsx',
  'components/common/OptimizedImage.tsx',
  'components/IconWrapper.tsx',
  
  // Interest Components (12개)
  'components/interest/InterestCard.tsx',
  'components/interest/InterestTypeSelector.tsx',
  'components/interest/DurationSelector.tsx',
  'components/interest/InterestEmptyState.tsx',
  'components/interest/inputs/EmailInputField.tsx',
  'components/interest/inputs/SocialInputField.tsx',
  'components/interest/inputs/SchoolInputField.tsx',
  'components/interest/inputs/PlatformInputField.tsx',
  'components/interest/inputs/PhoneInputField.tsx',
  'components/interest/inputs/NicknameInputField.tsx',
  'components/interest/inputs/LocationInputField.tsx',
  'components/interest/inputs/GameInputField.tsx',
  
  // Auth Components (4개)
  'components/auth/WelcomeScreen.tsx',
  'components/auth/ClerkPhoneAuth.tsx',
  'components/auth/ClerkGoogleAuth.tsx',
  
  // Settings Components (2개)
  'components/settings/ThemeSelector.tsx',
  'components/settings/LanguageSelector.tsx',
  
  // Premium Components (2개)
  'components/premium/PricingCard.tsx',
  'components/premium/PaymentModal.tsx',
  
  // MyInfo Components (3개)
  'components/myInfo/MyInfoModal.tsx',
  'components/myInfo/InfoItemCard.tsx',
  'components/myInfo/InfoFieldSection.tsx',
  
  // Nearby Components (3개)
  'components/nearby/NearbyUserCard.tsx',
  'components/nearby/LocationPermissionPrompt.tsx',
  'components/nearby/RadiusSelector.tsx',
  
  // Others (8개)
  'components/successStory/SuccessStoryCard.tsx',
  'components/successStory/CreateStoryModal.tsx',
  'components/persona/PersonaSettingsModal.tsx',
  'components/modals/EditNicknameModal.tsx',
  'components/nearbyGroups/NearbyGroupItem.tsx',
  'components/home/SuccessStoriesSection.tsx',
  'components/interestSearch/TabBar.tsx',
  'components/call/CallButton.tsx',
  'components/KakaoMapView.tsx',
  'components/DevModePanel.tsx',
  'components/ContentItem.tsx',
];

/**
 * StyleSheet를 NativeWind 클래스로 변환하는 매핑
 */
const styleToTailwind = {
  // Layout
  'flex: 1': 'flex-1',
  'flexDirection: \'row\'': 'flex-row',
  'flexDirection: \'column\'': 'flex-col',
  'justifyContent: \'center\'': 'justify-center',
  'justifyContent: \'space-between\'': 'justify-between',
  'justifyContent: \'flex-start\'': 'justify-start',
  'justifyContent: \'flex-end\'': 'justify-end',
  'alignItems: \'center\'': 'items-center',
  'alignItems: \'flex-start\'': 'items-start',
  'alignItems: \'flex-end\'': 'items-end',
  
  // Spacing
  'padding: 16': 'p-4',
  'padding: 12': 'p-3',
  'padding: 8': 'p-2',
  'paddingHorizontal: 16': 'px-4',
  'paddingVertical: 12': 'py-3',
  'margin: 16': 'm-4',
  'marginBottom: 16': 'mb-4',
  'marginTop: 16': 'mt-4',
  
  // Typography
  'fontSize: 16': 'text-base',
  'fontSize: 14': 'text-sm',
  'fontSize: 18': 'text-lg',
  'fontWeight: \'bold\'': 'font-bold',
  'fontWeight: \'600\'': 'font-semibold',
  'textAlign: \'center\'': 'text-center',
  
  // Colors (with dark mode)
  'backgroundColor: \'white\'': 'bg-white dark:bg-gray-900',
  'backgroundColor: \'#F3F4F6\'': 'bg-gray-100 dark:bg-gray-800',
  'color: \'#111827\'': 'text-gray-900 dark:text-white',
  'color: \'#6B7280\'': 'text-gray-600 dark:text-gray-400',
  
  // Borders
  'borderRadius: 8': 'rounded-lg',
  'borderRadius: 12': 'rounded-xl',
  'borderRadius: 16': 'rounded-2xl',
  'borderWidth: 1': 'border',
  'borderColor: \'#E5E7EB\'': 'border-gray-200 dark:border-gray-700',
};

/**
 * 파일 변환 함수
 */
function convertFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  const newPath = fullPath.replace('.tsx', '-NW.tsx');
  
  // 이미 -NW 파일이 존재하면 건너뛰기
  if (fs.existsSync(newPath)) {
    return { file: filePath, status: 'skipped', reason: 'Already exists' };
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // StyleSheet import 제거
    content = content.replace(/import\s*{[^}]*StyleSheet[^}]*}\s*from\s*['"]react-native['"];?/g, (match) => {
      const otherImports = match.replace(/,?\s*StyleSheet\s*,?/g, '');
      return otherImports;
    });
    
    // StyleSheet.create 제거
    content = content.replace(/const\s+styles\s*=\s*StyleSheet\.create\(\{[\s\S]*?\}\);/g, '');
    
    // style={styles.xxx} → className="xxx" 변환
    content = content.replace(/style=\{styles\.(\w+)\}/g, 'className="$1"');
    
    // style={[styles.xxx, ...]} → className="xxx yyy" 변환  
    content = content.replace(/style=\{\[([^\]]+)\]\}/g, (match, styles) => {
      const classes = styles.split(',').map(s => {
        const trimmed = s.trim();
        if (trimmed.startsWith('styles.')) {
          return trimmed.replace('styles.', '');
        }
        return '';
      }).filter(Boolean).join(' ');
      return `className="${classes}"`;
    });
    
    // 기본적인 스타일 매핑 적용
    for (const [style, tailwind] of Object.entries(styleToTailwind)) {
      const regex = new RegExp(style.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, tailwind);
    }
    
    // 파일 저장
    fs.writeFileSync(newPath, content);
    
    return { file: filePath, status: 'converted' };
  } catch (error) {
    return { file: filePath, status: 'error', error: error.message };
  }
}

// 메인 실행
console.log('\n🚀 Starting batch conversion to NativeWind...\n');

const results = {
  converted: [],
  skipped: [],
  errors: []
};

for (const file of CONVERSION_LIST) {
  const result = convertFile(file);
  
  if (result.status === 'converted') {
    results.converted.push(result.file);
    console.log(`✅ ${result.file}`);
  } else if (result.status === 'skipped') {
    results.skipped.push(result.file);
    console.log(`⏭️  ${result.file} (${result.reason})`);
  } else {
    results.errors.push(result);
    console.log(`❌ ${result.file}: ${result.error}`);
  }
}

// 결과 요약
console.log('\n📊 Conversion Summary:');
console.log(`✅ Converted: ${results.converted.length} files`);
console.log(`⏭️  Skipped: ${results.skipped.length} files`);
console.log(`❌ Errors: ${results.errors.length} files`);
console.log(`📁 Total: ${CONVERSION_LIST.length} files`);

if (results.converted.length > 0) {
  console.log('\n💡 Next steps:');
  console.log('1. Review each generated -NW.tsx file');
  console.log('2. Fine-tune the NativeWind classes');
  console.log('3. Test dark mode functionality');
  console.log('4. Run: npm run validate:nw');
}

console.log('\n✨ Batch conversion complete!\n');