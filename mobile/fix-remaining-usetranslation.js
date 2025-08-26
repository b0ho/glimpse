#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that still use useTranslation
const filesToFix = [
  './screens/NotificationSettingsScreen.tsx',
  './screens/CreateGroupScreen.tsx',
  './screens/LikeHistoryScreen.tsx',
  './screens/CreateStoryScreen.tsx',
  './screens/CreateContentScreen.tsx',
  './screens/ProfileScreen.tsx',
  './screens/ProfileSettingsScreen.tsx',
  './components/settings/ThemeSelector.tsx',
  './components/DevModePanel.tsx',
  './components/modals/EditNicknameModal.tsx',
  './components/profile/ProfileHeader.tsx'
];

let totalFixed = 0;

filesToFix.forEach(file => {
  const filePath = path.resolve(file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Check if already uses useAndroidSafeTranslation
  if (content.includes("from '@/hooks/useAndroidSafeTranslation'")) {
    // Just fix the hook usage
    const hookPattern = /const\s+{\s*t(?:,\s*i18n)?\s*}\s*=\s*useTranslation\(/g;
    if (hookPattern.test(content)) {
      content = content.replace(/const\s+{\s*t\s*}\s*=\s*useTranslation\(\[[^\]]+\]\)/g, (match) => {
        // Extract first namespace
        const namespaceMatch = match.match(/\['([^']+)'/);
        const namespace = namespaceMatch ? namespaceMatch[1] : 'common';
        return `const { t } = useAndroidSafeTranslation('${namespace}')`;
      });
      
      content = content.replace(/const\s+{\s*t,\s*i18n\s*}\s*=\s*useTranslation\(\[[^\]]+\]\)/g, (match) => {
        const namespaceMatch = match.match(/\['([^']+)'/);
        const namespace = namespaceMatch ? namespaceMatch[1] : 'common';
        return `const { t, i18n } = useAndroidSafeTranslation('${namespace}')`;
      });
      
      hasChanges = true;
    }
  } else {
    // Need to add import and fix usage
    
    // Check for existing react-i18next import
    const hasReactI18nextImport = /import\s+.*\s+from\s+['"]react-i18next['"]/.test(content);
    
    if (hasReactI18nextImport) {
      // Replace import
      content = content.replace(
        /import\s+{\s*useTranslation\s*}\s+from\s+['"]react-i18next['"]/g,
        "import { useAndroidSafeTranslation } from '@/hooks/useAndroidSafeTranslation'"
      );
      
      // Fix usage
      content = content.replace(/const\s+{\s*t\s*}\s*=\s*useTranslation\(\[[^\]]+\]\)/g, (match) => {
        const namespaceMatch = match.match(/\['([^']+)'/);
        const namespace = namespaceMatch ? namespaceMatch[1] : 'common';
        return `const { t } = useAndroidSafeTranslation('${namespace}')`;
      });
      
      content = content.replace(/const\s+{\s*t,\s*i18n\s*}\s*=\s*useTranslation\(\[[^\]]+\]\)/g, (match) => {
        const namespaceMatch = match.match(/\['([^']+)'/);
        const namespace = namespaceMatch ? namespaceMatch[1] : 'common';
        return `const { t, i18n } = useAndroidSafeTranslation('${namespace}')`;
      });
      
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${file}`);
    totalFixed++;
  } else {
    console.log(`⏭️  No changes needed: ${file}`);
  }
});

console.log(`\n📊 Total files fixed: ${totalFixed}`);