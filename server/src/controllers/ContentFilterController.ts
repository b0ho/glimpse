import { Request, Response, NextFunction } from 'express';
import { contentFilterService } from '../services/ContentFilterService';
import { createError } from '../middleware/errorHandler';

export class ContentFilterController {
  async reportContent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).auth?.userId;
      const { contentType, contentId, reason } = req.body;

      if (!userId) {
        throw createError(401, '인증이 필요합니다.');
      }

      if (!contentType || !contentId || !reason) {
        throw createError(400, '신고 정보가 필요합니다.');
      }

      const validContentTypes = ['profile', 'chat', 'image', 'group'];
      if (!validContentTypes.includes(contentType)) {
        throw createError(400, '유효하지 않은 콘텐츠 유형입니다.');
      }

      await contentFilterService.reportContent(userId, contentType as any, contentId, reason);

      res.json({
        success: true,
        message: '신고가 접수되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  async testFilter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, context } = req.body;

      if (!text) {
        throw createError(400, '검사할 텍스트가 필요합니다.');
      }

      const result = await contentFilterService.filterText(text, context);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // 관리자 전용 엔드포인트
  async getBannedWords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: 관리자 권한 확인
      const bannedWords = contentFilterService.getBannedWords();

      res.json({
        success: true,
        data: bannedWords
      });
    } catch (error) {
      next(error);
    }
  }

  async addBannedWord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: 관리자 권한 확인
      const { word, category, severity, regex } = req.body;

      if (!word || !category || !severity) {
        throw createError(400, '금지어 정보가 필요합니다.');
      }

      await contentFilterService.addBannedWord(word, category, severity, regex);

      res.json({
        success: true,
        message: '금지어가 추가되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }

  async removeBannedWord(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: 관리자 권한 확인
      const { wordId } = req.params;

      if (!wordId) {
        throw createError(400, '금지어 ID가 필요합니다.');
      }

      await contentFilterService.removeBannedWord(wordId);

      res.json({
        success: true,
        message: '금지어가 삭제되었습니다.'
      });
    } catch (error) {
      next(error);
    }
  }
}

export const contentFilterController = new ContentFilterController();