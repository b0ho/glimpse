#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function copyLocales() {
  const srcPath = path.join(__dirname, '../src/locales');
  const distPath = path.join(__dirname, '../dist/src/locales');

  try {
    // dist/src/locales 디렉토리 생성
    await fs.ensureDir(distPath);
    
    // 로케일 파일 복사
    await fs.copy(srcPath, distPath, {
      overwrite: true,
      errorOnExist: false
    });
    
    console.log('✅ Locales copied successfully to dist folder');
    
    // 복사된 파일 확인
    const languages = await fs.readdir(distPath);
    for (const lang of languages) {
      const files = await fs.readdir(path.join(distPath, lang));
      console.log(`  - ${lang}: ${files.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Error copying locales:', error);
    process.exit(1);
  }
}

copyLocales();