/**
 * @module CompanyDomainController
 * @description 회사 도메인 인증 컨트롤러 - 이메일 도메인 기반 회사 인증, 도메인 관리
 */
import { Request, Response, NextFunction } from 'express';
import { companyDomainService } from '../services/CompanyDomainService';
import { createError } from '../middleware/errorHandler';

/**
 * 회사 도메인 인증 컨트롤러
 * 이메일 도메인을 통한 회사 인증, 회사 도메인 검색 및 관리 기능을 제공
 * @class CompanyDomainController
 */
export class CompanyDomainController {
  /**
   * 이메일 도메인 인증 메일 전송
   * @param {Request} req - Express request 객체 (body: email)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async sendVerificationEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const userId = (req as any).auth?.userId;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      if (!email) {
        throw createError(400, '이메일이 필요합니다.');
      }

      const verification = await companyDomainService.createEmailVerification(userId, email);

      res.json({
        success: true,
        message: '인증 이메일이 전송되었습니다.',
        data: {
          email: verification.email,
          expiresAt: verification.expiresAt
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 이메일 인증 코드 확인
   * @param {Request} req - Express request 객체 (body: email, code)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async verifyEmailCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code } = req.body;
      const userId = (req as any).auth?.userId;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      if (!email || !code) {
        throw createError(400, '이메일과 인증 코드가 필요합니다.');
      }

      const success = await companyDomainService.verifyEmailCode(userId, email, code);

      res.json({
        success,
        message: '이메일 인증이 완료되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 인증된 도메인 목록 조회
   * @param {Request} req - Express request 객체
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async getVerifiedDomains(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const domains = await companyDomainService.getVerifiedDomains();

      res.json({
        success: true,
        data: domains
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 도메인 검색
   * @param {Request} req - Express request 객체 (query: query)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async searchDomains(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        throw createError(400, '검색어가 필요합니다.');
      }

      const domains = await companyDomainService.searchDomains(query);

      res.json({
        success: true,
        data: domains
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 새로운 회사 도메인 추가
   * @param {Request} req - Express request 객체 (body: domain, companyName, companyNameKr, employeeCount, industry, logoUrl)
   * @param {Response} res - Express response 객체
   * @param {NextFunction} next - Express next 함수
   * @returns {Promise<void>}
   */
  async addCompanyDomain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { domain, companyName, companyNameKr, employeeCount, industry, logoUrl } = req.body;

      if (!domain || !companyName) {
        throw createError(400, '도메인과 회사명이 필요합니다.');
      }

      const newDomain = await companyDomainService.addCompanyDomain({
        domain,
        companyName,
        companyNameKr,
        employeeCount,
        industry,
        logoUrl
      });

      res.status(201).json({
        success: true,
        message: '회사 도메인이 추가되었습니다.',
        data: newDomain
      });
    } catch (error) {
      next(error);
    }
  }
}

export const companyDomainController = new CompanyDomainController();