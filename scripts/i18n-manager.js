#!/usr/bin/env node

/**
 * i18n 번역 키 관리 스크립트
 * 
 * 기능:
 * 1. 소스 코드에서 t() 함수 호출 추출
 * 2. 누락된 번역 키 찾기
 * 3. 사용하지 않는 번역 키 찾기
 * 4. 번역 파일 동기화
 * 5. 번역 통계 출력
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 설정
const CONFIG = {
  sourcePatterns: [
    'mobile/**/*.{ts,tsx}',
    'server/src/**/*.{ts,tsx}',
  ],
  localesPath: {
    mobile: 'mobile/locales',
    server: 'server/src/locales',
  },
  defaultLanguage: 'ko',
  supportedLanguages: ['ko', 'en', 'ja', 'zh', 'vi', 'th', 'es', 'fr'],
  namespaces: ['common', 'auth', 'group', 'matching', 'chat', 'payment', 'profile', 'settings', 'errors', 'notifications'],
};

// 컬러 출력을 위한 헬퍼
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}`),
};

/**
 * 소스 코드에서 번역 키 추출
 */
function extractTranslationKeys() {
  const keys = new Set();
  const keyUsage = new Map(); // 키별 사용 위치 추적

  CONFIG.sourcePatterns.forEach(pattern => {
    const files = glob.sync(pattern, { ignore: ['**/node_modules/**', '**/*.test.*'] });
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // t() 함수 호출 패턴 매칭
      const patterns = [
        /t\(['"`]([^'"`]+)['"`]/g,                    // t('key')
        /t\(['"`]([^'"`]+)['"`],/g,                   // t('key', ...)
        /\{t\(['"`]([^'"`]+)['"`]\)/g,               // {t('key')}
        /\bt\(['"`]([^:]+):([^'"`]+)['"`]/g,         // t('namespace:key')
      ];
      
      patterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const key = match[1] + (match[2] ? ':' + match[2] : '');
          keys.add(key);
          
          if (!keyUsage.has(key)) {
            keyUsage.set(key, []);
          }
          keyUsage.get(key).push(file);
        }
      });
    });
  });

  return { keys: Array.from(keys), keyUsage };
}

/**
 * 번역 파일 읽기
 */
function loadTranslations(type = 'mobile') {
  const translations = {};
  const localesPath = CONFIG.localesPath[type];
  
  CONFIG.supportedLanguages.forEach(lang => {
    translations[lang] = {};
    
    CONFIG.namespaces.forEach(ns => {
      const filePath = path.join(localesPath, lang, `${ns}.json`);
      if (fs.existsSync(filePath)) {
        try {
          translations[lang][ns] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
          log.error(`Failed to parse ${filePath}: ${error.message}`);
        }
      }
    });
  });
  
  return translations;
}

/**
 * 번역 키를 중첩 객체 경로로 파싱
 */
function parseKeyPath(key) {
  const parts = key.split(':');
  if (parts.length === 2) {
    return { namespace: parts[0], path: parts[1] };
  }
  return { namespace: 'common', path: key };
}

/**
 * 중첩 객체에서 값 가져오기
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * 중첩 객체에 값 설정
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  target[lastKey] = value;
}

/**
 * 누락된 번역 키 찾기
 */
function findMissingKeys(extractedKeys, translations) {
  const missing = {};
  
  CONFIG.supportedLanguages.forEach(lang => {
    missing[lang] = [];
    
    extractedKeys.forEach(key => {
      const { namespace, path } = parseKeyPath(key);
      const value = getNestedValue(translations[lang][namespace], path);
      
      if (!value) {
        missing[lang].push(key);
      }
    });
  });
  
  return missing;
}

/**
 * 사용하지 않는 번역 키 찾기
 */
function findUnusedKeys(extractedKeys, translations) {
  const unused = {};
  const extractedSet = new Set(extractedKeys);
  
  CONFIG.supportedLanguages.forEach(lang => {
    unused[lang] = [];
    
    CONFIG.namespaces.forEach(ns => {
      const nsTranslations = translations[lang][ns] || {};
      
      function checkUnused(obj, prefix = '') {
        Object.keys(obj).forEach(key => {
          const fullKey = prefix ? `${prefix}.${key}` : key;
          const translationKey = `${ns}:${fullKey}`;
          
          if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
            checkUnused(obj[key], fullKey);
          } else {
            if (!extractedSet.has(translationKey) && !extractedSet.has(fullKey)) {
              unused[lang].push(translationKey);
            }
          }
        });
      }
      
      checkUnused(nsTranslations);
    });
  });
  
  // 모든 언어에서 공통으로 사용하지 않는 키만 반환
  const commonUnused = unused[CONFIG.defaultLanguage].filter(key => 
    CONFIG.supportedLanguages.every(lang => unused[lang].includes(key))
  );
  
  return commonUnused;
}

/**
 * 번역 통계 생성
 */
function generateStatistics(translations) {
  const stats = {};
  
  CONFIG.supportedLanguages.forEach(lang => {
    let totalKeys = 0;
    let translatedKeys = 0;
    
    CONFIG.namespaces.forEach(ns => {
      const nsTranslations = translations[lang][ns] || {};
      
      function countKeys(obj) {
        Object.values(obj).forEach(value => {
          if (typeof value === 'object' && !Array.isArray(value)) {
            countKeys(value);
          } else {
            totalKeys++;
            if (value && value !== '') {
              translatedKeys++;
            }
          }
        });
      }
      
      countKeys(nsTranslations);
    });
    
    stats[lang] = {
      total: totalKeys,
      translated: translatedKeys,
      percentage: totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 0,
    };
  });
  
  return stats;
}

/**
 * 번역 파일 동기화
 */
function syncTranslations(missingKeys, type = 'mobile') {
  const localesPath = CONFIG.localesPath[type];
  
  Object.entries(missingKeys).forEach(([lang, keys]) => {
    if (keys.length === 0) return;
    
    keys.forEach(key => {
      const { namespace, path } = parseKeyPath(key);
      const filePath = path.join(localesPath, lang, `${namespace}.json`);
      
      let translations = {};
      if (fs.existsSync(filePath)) {
        translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      
      // 기본 언어에서 값 가져오기
      const defaultFilePath = path.join(localesPath, CONFIG.defaultLanguage, `${namespace}.json`);
      let defaultValue = '';
      
      if (fs.existsSync(defaultFilePath)) {
        const defaultTranslations = JSON.parse(fs.readFileSync(defaultFilePath, 'utf8'));
        defaultValue = getNestedValue(defaultTranslations, path) || `[TODO: ${path}]`;
      }
      
      setNestedValue(translations, path, lang === CONFIG.defaultLanguage ? `[TODO: ${path}]` : defaultValue);
      
      // 파일 저장
      fs.writeFileSync(filePath, JSON.stringify(translations, null, 2) + '\n', 'utf8');
    });
  });
}

/**
 * 메인 실행 함수
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  log.header('🌍 i18n Translation Manager');
  
  // 번역 키 추출
  log.info('Extracting translation keys from source code...');
  const { keys: extractedKeys, keyUsage } = extractTranslationKeys();
  log.success(`Found ${extractedKeys.length} translation keys`);
  
  // 번역 파일 로드
  log.info('Loading translation files...');
  const mobileTranslations = loadTranslations('mobile');
  const serverTranslations = loadTranslations('server');
  
  // 통계 생성
  const mobileStats = generateStatistics(mobileTranslations);
  const serverStats = generateStatistics(serverTranslations);
  
  // 통계 출력
  log.header('📊 Translation Statistics');
  console.log('\nMobile App:');
  Object.entries(mobileStats).forEach(([lang, stats]) => {
    const flag = getLanguageFlag(lang);
    const bar = generateProgressBar(stats.percentage);
    console.log(`  ${flag} ${lang}: ${bar} ${stats.percentage}% (${stats.translated}/${stats.total})`);
  });
  
  console.log('\nServer API:');
  Object.entries(serverStats).forEach(([lang, stats]) => {
    const flag = getLanguageFlag(lang);
    const bar = generateProgressBar(stats.percentage);
    console.log(`  ${flag} ${lang}: ${bar} ${stats.percentage}% (${stats.translated}/${stats.total})`);
  });
  
  // 누락된 키 찾기
  const mobileMissing = findMissingKeys(extractedKeys, mobileTranslations);
  const serverMissing = findMissingKeys(extractedKeys, serverTranslations);
  
  // 누락된 키 출력
  const totalMissing = Object.values(mobileMissing).flat().length;
  if (totalMissing > 0) {
    log.header('⚠️  Missing Translation Keys');
    Object.entries(mobileMissing).forEach(([lang, keys]) => {
      if (keys.length > 0) {
        console.log(`\n${getLanguageFlag(lang)} ${lang}: ${keys.length} missing keys`);
        keys.slice(0, 5).forEach(key => console.log(`  - ${key}`));
        if (keys.length > 5) {
          console.log(`  ... and ${keys.length - 5} more`);
        }
      }
    });
  }
  
  // 사용하지 않는 키 찾기
  const unusedKeys = findUnusedKeys(extractedKeys, mobileTranslations);
  if (unusedKeys.length > 0) {
    log.header('🗑️  Unused Translation Keys');
    console.log(`Found ${unusedKeys.length} unused keys:`);
    unusedKeys.slice(0, 10).forEach(key => console.log(`  - ${key}`));
    if (unusedKeys.length > 10) {
      console.log(`  ... and ${unusedKeys.length - 10} more`);
    }
  }
  
  // 명령어 처리
  if (command === 'sync') {
    log.header('🔄 Syncing Translations');
    syncTranslations(mobileMissing, 'mobile');
    syncTranslations(serverMissing, 'server');
    log.success('Translation files synchronized');
  } else if (command === 'clean') {
    log.header('🧹 Cleaning Unused Keys');
    // TODO: Implement cleaning unused keys
    log.warning('Clean command not yet implemented');
  }
  
  log.success('\nDone! 🎉');
}

/**
 * 언어별 플래그 이모지
 */
function getLanguageFlag(lang) {
  const flags = {
    ko: '🇰🇷',
    en: '🇺🇸',
    ja: '🇯🇵',
    zh: '🇨🇳',
    vi: '🇻🇳',
    th: '🇹🇭',
    es: '🇪🇸',
    fr: '🇫🇷',
  };
  return flags[lang] || '🏳️';
}

/**
 * 진행률 바 생성
 */
function generateProgressBar(percentage, width = 20) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// 스크립트 실행
if (require.main === module) {
  main();
}