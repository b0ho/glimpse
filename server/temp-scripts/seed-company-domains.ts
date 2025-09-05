/**
 * @module seedCompanyDomains
 * @description 한국 주요 기업 및 대학 도메인 시드 데이터 스크립트
 * 회사 인증을 위한 초기 도메인 데이터를 데이터베이스에 추가합니다.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../core/prisma/prisma.service';
import { Logger } from '@nestjs/common';

/**
 * 회사 도메인 시드 데이터
 */
const companyDomains = [
  // 대기업
  {
    domain: 'samsung.com',
    companyName: 'Samsung Electronics',
    companyNameKr: '삼성전자',
    employeeCount: 287439,
    industry: 'Electronics',
  },
  {
    domain: 'sk.com',
    companyName: 'SK Group',
    companyNameKr: 'SK그룹',
    employeeCount: 175000,
    industry: 'Conglomerate',
  },
  {
    domain: 'hyundai.com',
    companyName: 'Hyundai Motor Company',
    companyNameKr: '현대자동차',
    employeeCount: 120000,
    industry: 'Automotive',
  },
  {
    domain: 'lg.com',
    companyName: 'LG Corporation',
    companyNameKr: 'LG',
    employeeCount: 250000,
    industry: 'Electronics',
  },
  {
    domain: 'lotte.com',
    companyName: 'Lotte Corporation',
    companyNameKr: '롯데',
    employeeCount: 150000,
    industry: 'Retail',
  },
  {
    domain: 'posco.com',
    companyName: 'POSCO',
    companyNameKr: '포스코',
    employeeCount: 37000,
    industry: 'Steel',
  },
  {
    domain: 'hanwha.com',
    companyName: 'Hanwha Group',
    companyNameKr: '한화그룹',
    employeeCount: 60000,
    industry: 'Conglomerate',
  },
  {
    domain: 'gs.com',
    companyName: 'GS Group',
    companyNameKr: 'GS그룹',
    employeeCount: 50000,
    industry: 'Energy',
  },
  {
    domain: 'doosan.com',
    companyName: 'Doosan Group',
    companyNameKr: '두산그룹',
    employeeCount: 40000,
    industry: 'Heavy Industry',
  },

  // IT/Tech Companies
  {
    domain: 'kakao.com',
    companyName: 'Kakao',
    companyNameKr: '카카오',
    employeeCount: 10000,
    industry: 'IT/Internet',
  },
  {
    domain: 'kakaocorp.com',
    companyName: 'Kakao Corp',
    companyNameKr: '카카오',
    employeeCount: 10000,
    industry: 'IT/Internet',
  },
  {
    domain: 'navercorp.com',
    companyName: 'Naver Corporation',
    companyNameKr: '네이버',
    employeeCount: 4500,
    industry: 'IT/Internet',
  },
  {
    domain: 'naver.com',
    companyName: 'Naver',
    companyNameKr: '네이버',
    employeeCount: 4500,
    industry: 'IT/Internet',
  },
  {
    domain: 'coupang.com',
    companyName: 'Coupang',
    companyNameKr: '쿠팡',
    employeeCount: 63000,
    industry: 'E-commerce',
  },
  {
    domain: 'nexon.com',
    companyName: 'Nexon',
    companyNameKr: '넥슨',
    employeeCount: 7000,
    industry: 'Gaming',
  },
  {
    domain: 'ncsoft.com',
    companyName: 'NCSoft',
    companyNameKr: '엔씨소프트',
    employeeCount: 5000,
    industry: 'Gaming',
  },
  {
    domain: 'netmarble.com',
    companyName: 'Netmarble',
    companyNameKr: '넷마블',
    employeeCount: 6000,
    industry: 'Gaming',
  },
  {
    domain: 'krafton.com',
    companyName: 'Krafton',
    companyNameKr: '크래프톤',
    employeeCount: 1500,
    industry: 'Gaming',
  },
  {
    domain: 'smilegate.com',
    companyName: 'Smilegate',
    companyNameKr: '스마일게이트',
    employeeCount: 2000,
    industry: 'Gaming',
  },

  // Financial Companies
  {
    domain: 'kbfg.com',
    companyName: 'KB Financial Group',
    companyNameKr: 'KB금융그룹',
    employeeCount: 25000,
    industry: 'Finance',
  },
  {
    domain: 'shinhan.com',
    companyName: 'Shinhan Financial Group',
    companyNameKr: '신한금융그룹',
    employeeCount: 24000,
    industry: 'Finance',
  },
  {
    domain: 'wooribank.com',
    companyName: 'Woori Bank',
    companyNameKr: '우리은행',
    employeeCount: 15000,
    industry: 'Finance',
  },
  {
    domain: 'hanabank.com',
    companyName: 'Hana Bank',
    companyNameKr: '하나은행',
    employeeCount: 14000,
    industry: 'Finance',
  },
  {
    domain: 'nhbank.com',
    companyName: 'NH Bank',
    companyNameKr: 'NH농협은행',
    employeeCount: 13000,
    industry: 'Finance',
  },

  // Startups
  {
    domain: 'toss.im',
    companyName: 'Viva Republica (Toss)',
    companyNameKr: '토스',
    employeeCount: 2000,
    industry: 'Fintech',
  },
  {
    domain: 'bucketplace.com',
    companyName: 'Bucketplace',
    companyNameKr: '버킷플레이스(오늘의집)',
    employeeCount: 800,
    industry: 'E-commerce',
  },
  {
    domain: 'daangn.com',
    companyName: 'Daangn Market',
    companyNameKr: '당근마켓',
    employeeCount: 600,
    industry: 'E-commerce',
  },
  {
    domain: 'yanolja.com',
    companyName: 'Yanolja',
    companyNameKr: '야놀자',
    employeeCount: 2000,
    industry: 'Travel',
  },
  {
    domain: 'socar.kr',
    companyName: 'Socar',
    companyNameKr: '쏘카',
    employeeCount: 1000,
    industry: 'Mobility',
  },
  {
    domain: 'musinsa.com',
    companyName: 'Musinsa',
    companyNameKr: '무신사',
    employeeCount: 1500,
    industry: 'Fashion/E-commerce',
  },
  {
    domain: 'zigbang.com',
    companyName: 'Zigbang',
    companyNameKr: '직방',
    employeeCount: 500,
    industry: 'Real Estate',
  },
  {
    domain: 'hyperconnect.com',
    companyName: 'Hyperconnect',
    companyNameKr: '하이퍼커넥트',
    employeeCount: 400,
    industry: 'Social/Dating',
  },

  // Universities (주요 대학교)
  {
    domain: 'snu.ac.kr',
    companyName: 'Seoul National University',
    companyNameKr: '서울대학교',
    industry: 'Education',
  },
  {
    domain: 'yonsei.ac.kr',
    companyName: 'Yonsei University',
    companyNameKr: '연세대학교',
    industry: 'Education',
  },
  {
    domain: 'korea.ac.kr',
    companyName: 'Korea University',
    companyNameKr: '고려대학교',
    industry: 'Education',
  },
  {
    domain: 'kaist.ac.kr',
    companyName: 'KAIST',
    companyNameKr: '카이스트',
    industry: 'Education',
  },
  {
    domain: 'postech.ac.kr',
    companyName: 'POSTECH',
    companyNameKr: '포항공과대학교',
    industry: 'Education',
  },
  {
    domain: 'skku.edu',
    companyName: 'Sungkyunkwan University',
    companyNameKr: '성균관대학교',
    industry: 'Education',
  },
  {
    domain: 'hanyang.ac.kr',
    companyName: 'Hanyang University',
    companyNameKr: '한양대학교',
    industry: 'Education',
  },
  {
    domain: 'sogang.ac.kr',
    companyName: 'Sogang University',
    companyNameKr: '서강대학교',
    industry: 'Education',
  },
  {
    domain: 'ewha.ac.kr',
    companyName: 'Ewha Womans University',
    companyNameKr: '이화여자대학교',
    industry: 'Education',
  },
  {
    domain: 'cau.ac.kr',
    companyName: 'Chung-Ang University',
    companyNameKr: '중앙대학교',
    industry: 'Education',
  },

  // Consulting/Professional Services
  {
    domain: 'deloitte.com',
    companyName: 'Deloitte',
    companyNameKr: '딜로이트',
    employeeCount: 2000,
    industry: 'Consulting',
  },
  {
    domain: 'pwc.com',
    companyName: 'PwC',
    companyNameKr: 'PwC',
    employeeCount: 1500,
    industry: 'Consulting',
  },
  {
    domain: 'ey.com',
    companyName: 'EY',
    companyNameKr: 'EY한영',
    employeeCount: 1200,
    industry: 'Consulting',
  },
  {
    domain: 'kpmg.com',
    companyName: 'KPMG',
    companyNameKr: 'KPMG',
    employeeCount: 1000,
    industry: 'Consulting',
  },
  {
    domain: 'mckinsey.com',
    companyName: 'McKinsey & Company',
    companyNameKr: '맥킨지',
    employeeCount: 300,
    industry: 'Consulting',
  },
  {
    domain: 'bcg.com',
    companyName: 'Boston Consulting Group',
    companyNameKr: 'BCG',
    employeeCount: 200,
    industry: 'Consulting',
  },
  {
    domain: 'bain.com',
    companyName: 'Bain & Company',
    companyNameKr: '베인앤컴퍼니',
    employeeCount: 150,
    industry: 'Consulting',
  },
];

/**
 * 회사 도메인 시드 데이터 추가
 */
async function seedCompanyDomains() {
  const logger = new Logger('SeedCompanyDomains');
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  try {
    logger.log('🌱 회사 도메인 시드 데이터 추가 시작...');

    let addedCount = 0;
    let skippedCount = 0;

    for (const domain of companyDomains) {
      const existing = await prisma.companyDomain.findUnique({
        where: { domain: domain.domain },
      });

      if (existing) {
        skippedCount++;
        logger.log(`⏭️  건너뜀: ${domain.domain} (이미 존재)`);
      } else {
        await prisma.companyDomain.create({
          data: {
            ...domain,
            isVerified: true,
          },
        });
        addedCount++;
        logger.log(
          `✅ 추가됨: ${domain.domain} - ${domain.companyNameKr || domain.companyName}`,
        );
      }
    }

    logger.log(`\n✨ 시드 데이터 추가 완료!`);
    logger.log(`   - 추가된 도메인: ${addedCount}개`);
    logger.log(`   - 건너뛴 도메인: ${skippedCount}개`);
    logger.log(`   - 전체 도메인: ${addedCount + skippedCount}개`);
  } catch (error) {
    logger.error('❌ 시드 데이터 추가 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
    await app.close();
  }
}

// 스크립트 실행
seedCompanyDomains();
