import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContentFilterService } from './content-filter.service';
import { AuthGuard } from '../auth/auth.guard';

/**
 * 콘텐츠 필터 컨트롤러
 */
@ApiTags('content-filter')
@Controller('content-filter')
export class ContentFilterController {
  constructor(private readonly contentFilterService: ContentFilterService) {}

  /**
   * 텍스트 검증
   */
  @Post('validate-text')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '텍스트 검증' })
  @ApiResponse({ status: 200, description: '검증 결과' })
  async validateText(
    @Body() body: { 
      text: string; 
      context: 'PROFILE' | 'CHAT' | 'GROUP' | 'REVIEW' 
    }
  ) {
    return this.contentFilterService.validateText(body.text, body.context);
  }

  /**
   * 이미지 검증
   */
  @Post('validate-image')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '이미지 검증' })
  @ApiResponse({ status: 200, description: '검증 결과' })
  async validateImage(
    @Body() body: { 
      imageUrl: string; 
      context: 'PROFILE' | 'CHAT' | 'GROUP' 
    }
  ) {
    return this.contentFilterService.validateImage(body.imageUrl, body.context);
  }

  /**
   * 신고 내용 분석
   */
  @Post('analyze-report')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '신고 내용 분석' })
  @ApiResponse({ status: 200, description: '분석 결과' })
  async analyzeReport(
    @Body() body: { 
      reportedContent: string; 
      reportReason: string 
    }
  ) {
    return this.contentFilterService.analyzeReport(
      body.reportedContent,
      body.reportReason
    );
  }

  /**
   * 금지어 추가 (관리자용)
   */
  @Post('banned-words')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '금지어 추가 (관리자용)' })
  @ApiResponse({ status: 201, description: '금지어 추가됨' })
  async addBannedWord(
    @Body() body: { 
      word: string; 
      category?: string 
    }
  ) {
    // TODO: Add admin check
    await this.contentFilterService.addBannedWord(body.word, body.category);
    return { success: true, message: '금지어가 추가되었습니다.' };
  }
}