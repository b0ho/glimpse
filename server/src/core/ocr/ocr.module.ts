import { Global, Module } from '@nestjs/common';
import { OcrService } from './ocr.service';

/**
 * OCR 모듈
 * 
 * 문서 인식 및 정보 추출 기능을 제공합니다.
 * Global 모듈로 설정되어 한 번 import하면 모든 모듈에서 사용 가능합니다.
 */
@Global()
@Module({
  providers: [OcrService],
  exports: [OcrService],
})
export class OcrModule {}