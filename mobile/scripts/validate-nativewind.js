#!/usr/bin/env node

/**
 * NativeWind v4 검증 스크립트
 * 모든 NW 파일이 올바르게 변환되었는지 검증
 */

const fs = require('fs');
const path = require('path');

// 색상 출력용 간단한 헬퍼
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

function findFiles(dir, pattern) {
  const results = [];
  
  function walk(currentDir) {
    try {
      const files = fs.readdirSync(currentDir);
      
      for (const file of files) {
        const filePath = path.join(currentDir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          walk(filePath);
        } else if (stat.isFile() && pattern.test(file)) {
          results.push(filePath);
        }
      }
    } catch (err) {
      // 권한 문제 등으로 읽을 수 없는 디렉토리 무시
    }
  }
  
  walk(dir);
  return results;
}

function validateFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  const issues = [];
  
  // NW 파일인지 확인
  const isNWFile = fileName.includes('-NW');
  
  // 검증 규칙
  if (isNWFile) {
    // isDarkMode 조건문 체크
    const isDarkModeMatches = content.match(/isDarkMode\s*\?.*:/g);
    if (isDarkModeMatches) {
      issues.push({
        type: 'error',
        message: `Found ${isDarkModeMatches.length} isDarkMode conditionals (should be 0)`
      });
    }
    
    // StyleSheet 사용 체크
    const styleSheetMatches = content.match(/StyleSheet\.create/g);
    if (styleSheetMatches) {
      issues.push({
        type: 'error',
        message: `Found StyleSheet.create usage (should use NativeWind classes)`
      });
    }
    
    // dark: prefix 사용 체크
    const darkPrefixMatches = content.match(/dark:/g);
    if (!darkPrefixMatches || darkPrefixMatches.length === 0) {
      issues.push({
        type: 'warning',
        message: `No dark: prefix found (might not support dark mode)`
      });
    }
  }
  
  return issues;
}

console.log(colors.bold('\n=== NativeWind v4 Validation ===\n'));

// 검증할 디렉토리
const dirs = [
  path.join(__dirname, '..', 'screens'),
  path.join(__dirname, '..', 'components')
];

let totalFiles = 0;
let passedFiles = 0;
let failedFiles = 0;
let warningFiles = 0;

for (const dir of dirs) {
  console.log(colors.blue(`\nChecking ${path.basename(dir)}...`));
  
  const files = findFiles(dir, /-NW\.tsx?$/);
  
  for (const file of files) {
    totalFiles++;
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    const issues = validateFile(file);
    
    if (issues.length === 0) {
      console.log(colors.green(`  ✓ ${relativePath}`));
      passedFiles++;
    } else {
      const errors = issues.filter(i => i.type === 'error');
      const warnings = issues.filter(i => i.type === 'warning');
      
      if (errors.length > 0) {
        console.log(colors.red(`  ✗ ${relativePath}`));
        errors.forEach(e => console.log(colors.red(`    - ${e.message}`)));
        failedFiles++;
      } else if (warnings.length > 0) {
        console.log(colors.yellow(`  ⚠ ${relativePath}`));
        warnings.forEach(w => console.log(colors.yellow(`    - ${w.message}`)));
        warningFiles++;
      }
    }
  }
}

// 결과 요약
console.log(colors.bold('\n=== Validation Summary ===\n'));
console.log(`Total NW files: ${totalFiles}`);
console.log(colors.green(`✓ Passed: ${passedFiles}`));
console.log(colors.red(`✗ Failed: ${failedFiles}`));
console.log(colors.yellow(`⚠ Warnings: ${warningFiles}`));

const passRate = totalFiles > 0 ? ((passedFiles / totalFiles) * 100).toFixed(1) : 0;
console.log(`\nPass rate: ${passRate}%`);

if (failedFiles === 0 && totalFiles > 0) {
  console.log(colors.green(colors.bold('\n✅ All NativeWind v4 files are valid!')));
} else if (failedFiles > 0) {
  console.log(colors.red(colors.bold('\n❌ Some files need fixing')));
  process.exit(1);
}

console.log();