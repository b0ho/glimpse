import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompanyDomainService } from './company-domain.service';
import { AuthGuard } from '../auth/auth.guard';

/**
 * 회사 도메인 관리 컨트롤러
 */
@ApiTags('company-domains')
@Controller('company-domains')
export class CompanyDomainController {
  constructor(private readonly companyDomainService: CompanyDomainService) {}

  /**
   * 인증된 도메인 목록 조회
   */
  @Get()
  @ApiOperation({ summary: '인증된 도메인 목록 조회' })
  @ApiResponse({ status: 200, description: '도메인 목록' })
  async getVerifiedDomains() {
    return this.companyDomainService.getVerifiedDomains();
  }

  /**
   * 도메인 검색
   */
  @Get('search')
  @ApiOperation({ summary: '도메인 검색' })
  @ApiResponse({ status: 200, description: '검색 결과' })
  async searchDomains(@Query('q') query: string) {
    return this.companyDomainService.searchDomains(query);
  }

  /**
   * 이메일 인증 요청
   */
  @Post('verify-email')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '이메일 인증 요청' })
  @ApiResponse({ status: 201, description: '인증 이메일 전송됨' })
  async requestEmailVerification(
    @Req() req: any,
    @Body('email') email: string,
  ) {
    const userId = req.user.id;
    return this.companyDomainService.createEmailVerification(userId, email);
  }

  /**
   * 이메일 인증 코드 확인
   */
  @Post('verify-code')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '이메일 인증 코드 확인' })
  @ApiResponse({ status: 200, description: '인증 성공' })
  async verifyEmailCode(
    @Req() req: any,
    @Body() body: { email: string; code: string },
  ) {
    const userId = req.user.id;
    const success = await this.companyDomainService.verifyEmailCode(
      userId,
      body.email,
      body.code,
    );
    return { success };
  }

  /**
   * 회사 도메인 추가 (관리자용)
   */
  @Post()
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '회사 도메인 추가 (관리자용)' })
  @ApiResponse({ status: 201, description: '도메인 추가됨' })
  async addCompanyDomain(
    @Req() req: any,
    @Body()
    data: {
      domain: string;
      companyName: string;
      companyNameKr?: string;
      employeeCount?: number;
      industry?: string;
      logoUrl?: string;
    },
  ) {
    // TODO: Add admin check
    return this.companyDomainService.addCompanyDomain(data);
  }
}
