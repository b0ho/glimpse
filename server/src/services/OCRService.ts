import axios from 'axios';
import { createError } from '../middleware/errorHandler';
import sharp from 'sharp';

interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: BoundingBox[];
}

interface BoundingBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface CompanyInfo {
  companyName?: string;
  domain?: string;
  confidence: number;
}

interface IDCardInfo {
  name?: string;
  idNumber?: string;
  issueDate?: string;
  confidence: number;
}

export class OCRService {
  private readonly naverApiUrl = 'https://naveropenapi.apigw.ntruss.com/vision/v1/ocr';
  private readonly naverClientId = process.env.NAVER_OCR_CLIENT_ID || '';
  private readonly naverClientSecret = process.env.NAVER_OCR_CLIENT_SECRET || '';
  private readonly googleApiKey = process.env.GOOGLE_VISION_API_KEY || '';

  async extractTextFromImage(imageBuffer: Buffer, ocrProvider: 'naver' | 'google' = 'naver'): Promise<OCRResult> {
    try {
      // Preprocess image for better OCR results
      const processedImage = await this.preprocessImage(imageBuffer);

      switch (ocrProvider) {
        case 'naver':
          return await this.extractWithNaverOCR(processedImage);
        case 'google':
          return await this.extractWithGoogleVision(processedImage);
        default:
          throw new Error('Unsupported OCR provider');
      }
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw createError(500, 'OCR 텍스트 추출에 실패했습니다.');
    }
  }

  async verifyCompanyCard(imageBuffer: Buffer): Promise<CompanyInfo> {
    try {
      const ocrResult = await this.extractTextFromImage(imageBuffer);
      
      // Extract company information using patterns
      const companyInfo = this.extractCompanyInfo(ocrResult.text);
      
      return {
        ...companyInfo,
        confidence: Math.min(ocrResult.confidence, companyInfo.confidence)
      };
    } catch (error) {
      console.error('Company card verification failed:', error);
      throw createError(500, '회사 카드 인증에 실패했습니다.');
    }
  }

  async verifyIDCard(imageBuffer: Buffer): Promise<IDCardInfo> {
    try {
      const ocrResult = await this.extractTextFromImage(imageBuffer);
      
      // Extract ID card information using patterns
      const idInfo = this.extractIDCardInfo(ocrResult.text);
      
      return {
        ...idInfo,
        confidence: Math.min(ocrResult.confidence, idInfo.confidence)
      };
    } catch (error) {
      console.error('ID card verification failed:', error);
      throw createError(500, '신분증 인증에 실패했습니다.');
    }
  }

  async verifyStudentCard(imageBuffer: Buffer): Promise<{ university?: string; studentId?: string; name?: string; confidence: number }> {
    try {
      const ocrResult = await this.extractTextFromImage(imageBuffer);
      
      // Extract student card information
      const studentInfo = this.extractStudentCardInfo(ocrResult.text);
      
      return {
        ...studentInfo,
        confidence: Math.min(ocrResult.confidence, studentInfo.confidence)
      };
    } catch (error) {
      console.error('Student card verification failed:', error);
      throw createError(500, '학생증 인증에 실패했습니다.');
    }
  }

  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Enhance image for better OCR results
      const processedImage = await sharp(imageBuffer)
        .resize({ width: 1500, withoutEnlargement: true }) // Resize if too large
        .grayscale() // Convert to grayscale
        .normalize() // Normalize contrast
        .sharpen({ sigma: 1, m1: 0.5, m2: 0.5 }) // Sharpen text
        .jpeg({ quality: 95 }) // High quality JPEG
        .toBuffer();

      return processedImage;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return imageBuffer; // Return original if preprocessing fails
    }
  }

  private async extractWithNaverOCR(imageBuffer: Buffer): Promise<OCRResult> {
    if (!this.naverClientId || !this.naverClientSecret) {
      throw new Error('Naver OCR credentials not configured');
    }

    try {
      const formData = new FormData();
      const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
      formData.append('image', blob, 'image.jpg');

      const response = await axios.post(this.naverApiUrl, formData, {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': this.naverClientId,
          'X-NCP-APIGW-API-KEY': this.naverClientSecret,
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;
      
      if (!result.images || result.images.length === 0) {
        throw new Error('No text detected in image');
      }

      const fields = result.images[0].fields || [];
      const extractedText = fields.map((field: any) => field.inferText).join(' ');
      const avgConfidence = fields.reduce((sum: number, field: any) => sum + field.inferConfidence, 0) / fields.length;

      const boundingBoxes: BoundingBox[] = fields.map((field: any) => ({
        text: field.inferText,
        x: field.boundingPoly.vertices[0].x,
        y: field.boundingPoly.vertices[0].y,
        width: field.boundingPoly.vertices[2].x - field.boundingPoly.vertices[0].x,
        height: field.boundingPoly.vertices[2].y - field.boundingPoly.vertices[0].y,
        confidence: field.inferConfidence
      }));

      return {
        text: extractedText,
        confidence: avgConfidence,
        boundingBoxes
      };
    } catch (error: any) {
      console.error('Naver OCR API error:', error.response?.data);
      throw new Error('Naver OCR 처리에 실패했습니다.');
    }
  }

  private async extractWithGoogleVision(imageBuffer: Buffer): Promise<OCRResult> {
    if (!this.googleApiKey) {
      throw new Error('Google Vision API key not configured');
    }

    try {
      const base64Image = imageBuffer.toString('base64');
      
      const requestBody = {
        requests: [{
          image: { content: base64Image },
          features: [{ type: 'TEXT_DETECTION', maxResults: 50 }]
        }]
      };

      const response = await axios.post(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.googleApiKey}`,
        requestBody
      );

      const result = response.data.responses[0];
      
      if (!result.textAnnotations || result.textAnnotations.length === 0) {
        throw new Error('No text detected in image');
      }

      const fullText = result.textAnnotations[0].description;
      const confidence = result.textAnnotations[0].confidence || 0.8; // Default confidence

      const boundingBoxes: BoundingBox[] = result.textAnnotations.slice(1).map((annotation: any) => {
        const vertices = annotation.boundingPoly.vertices;
        return {
          text: annotation.description,
          x: vertices[0].x,
          y: vertices[0].y,
          width: vertices[2].x - vertices[0].x,
          height: vertices[2].y - vertices[0].y,
          confidence: annotation.confidence || 0.8
        };
      });

      return {
        text: fullText,
        confidence,
        boundingBoxes
      };
    } catch (error: any) {
      console.error('Google Vision API error:', error.response?.data);
      throw new Error('Google Vision OCR 처리에 실패했습니다.');
    }
  }

  private extractCompanyInfo(text: string): CompanyInfo {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let companyName: string | undefined;
    let domain: string | undefined;
    let confidence = 0.5;

    // Common patterns for company names
    const companyPatterns = [
      /([가-힣\w\s]+)\s*(주식회사|㈜|회사|그룹|코퍼레이션|Corporation|Co\.|Ltd\.|Inc\.)/i,
      /(주식회사|㈜)\s*([가-힣\w\s]+)/i,
      /([가-힣\w\s]+)\s*(Company|Corp|Corporation)/i
    ];

    // Email domain patterns
    const emailPattern = /@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

    // Find company name
    for (const line of lines) {
      for (const pattern of companyPatterns) {
        const match = line.match(pattern);
        if (match) {
          companyName = match[1] || match[2];
          companyName = companyName.trim();
          confidence = Math.max(confidence, 0.8);
          break;
        }
      }
      if (companyName) break;
    }

    // Find email domain
    const emailMatches = text.match(emailPattern);
    if (emailMatches && emailMatches.length > 0) {
      domain = emailMatches[0].substring(1); // Remove @ symbol
      confidence = Math.max(confidence, 0.7);
    }

    // Validate results
    if (companyName && companyName.length < 2) {
      companyName = undefined;
    }

    if (domain && (!domain.includes('.') || domain.length < 4)) {
      domain = undefined;
    }

    return {
      companyName,
      domain,
      confidence: Math.min(confidence, 1.0)
    };
  }

  private extractIDCardInfo(text: string): IDCardInfo {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let name: string | undefined;
    let idNumber: string | undefined;
    let issueDate: string | undefined;
    let confidence = 0.5;

    // Korean name pattern (2-4 characters)
    const namePattern = /이름\s*[:：]\s*([가-힣]{2,4})|([가-힣]{2,4})\s*(?=\d{6}-\d{7})/;
    
    // Korean ID number pattern
    const idNumberPattern = /(\d{6}[-\s]*\d{7})/;
    
    // Date patterns
    const datePattern = /(\d{4})[-.\s]*(\d{1,2})[-.\s]*(\d{1,2})/;

    const fullText = lines.join(' ');

    // Extract name
    const nameMatch = fullText.match(namePattern);
    if (nameMatch) {
      name = nameMatch[1] || nameMatch[2];
      confidence = Math.max(confidence, 0.8);
    }

    // Extract ID number
    const idMatch = fullText.match(idNumberPattern);
    if (idMatch) {
      idNumber = idMatch[1].replace(/\s/g, ''); // Remove spaces
      confidence = Math.max(confidence, 0.9);
    }

    // Extract issue date
    const dateMatch = fullText.match(datePattern);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      issueDate = `${year}-${month}-${day}`;
      confidence = Math.max(confidence, 0.7);
    }

    // Validate ID number format
    if (idNumber && !this.validateKoreanIDNumber(idNumber)) {
      idNumber = undefined;
      confidence = Math.max(confidence - 0.3, 0.1);
    }

    return {
      name,
      idNumber,
      issueDate,
      confidence: Math.min(confidence, 1.0)
    };
  }

  private extractStudentCardInfo(text: string): { university?: string; studentId?: string; name?: string; confidence: number } {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    let university: string | undefined;
    let studentId: string | undefined;
    let name: string | undefined;
    let confidence = 0.5;

    // University name patterns
    const universityPatterns = [
      /([가-힣]+대학교|[가-힣]+대학|[가-힣]+학교)/,
      /(대학교|University|College)/i
    ];

    // Student ID patterns
    const studentIdPattern = /(?:학번|번호|ID)?\s*[:：]?\s*(\d{8,12})/;

    // Name pattern
    const namePattern = /(?:이름|성명)?\s*[:：]?\s*([가-힣]{2,4})/;

    const fullText = lines.join(' ');

    // Find university name
    for (const line of lines) {
      for (const pattern of universityPatterns) {
        const match = line.match(pattern);
        if (match) {
          if (match[1] && match[1].includes('대학')) {
            university = match[1];
            confidence = Math.max(confidence, 0.8);
            break;
          } else if (line.length < 20) { // Avoid long lines that might not be university names
            university = line;
            confidence = Math.max(confidence, 0.6);
            break;
          }
        }
      }
      if (university) break;
    }

    // Find student ID
    const idMatch = fullText.match(studentIdPattern);
    if (idMatch) {
      studentId = idMatch[1];
      confidence = Math.max(confidence, 0.9);
    }

    // Find name
    const nameMatch = fullText.match(namePattern);
    if (nameMatch) {
      name = nameMatch[1];
      confidence = Math.max(confidence, 0.7);
    }

    return {
      university,
      studentId,
      name,
      confidence: Math.min(confidence, 1.0)
    };
  }

  private validateKoreanIDNumber(idNumber: string): boolean {
    // Remove any dashes or spaces
    const cleanId = idNumber.replace(/[-\s]/g, '');
    
    // Must be exactly 13 digits
    if (cleanId.length !== 13 || !/^\d{13}$/.test(cleanId)) {
      return false;
    }

    // Validate check digit using Korean ID number algorithm
    const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
    let sum = 0;

    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleanId[i]) * weights[i];
    }

    const checkDigit = (11 - (sum % 11)) % 10;
    return checkDigit === parseInt(cleanId[12]);
  }

  async detectDocumentType(imageBuffer: Buffer): Promise<'id_card' | 'company_card' | 'student_card' | 'unknown'> {
    try {
      const ocrResult = await this.extractTextFromImage(imageBuffer);
      const text = ocrResult.text.toLowerCase();

      // Document type detection patterns
      if (text.includes('주민등록증') || text.includes('신분증') || /\d{6}-\d{7}/.test(text)) {
        return 'id_card';
      }

      if (text.includes('사원증') || text.includes('직원증') || text.includes('company') || 
          text.includes('employee') || /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
        return 'company_card';
      }

      if (text.includes('학생증') || text.includes('대학교') || text.includes('university') || 
          text.includes('college') || text.includes('학번')) {
        return 'student_card';
      }

      return 'unknown';
    } catch (error) {
      console.error('Document type detection failed:', error);
      return 'unknown';
    }
  }

  async validateDocumentQuality(imageBuffer: Buffer): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      const metadata = await sharp(imageBuffer).metadata();
      
      // Check image dimensions
      if (metadata.width && metadata.width < 800) {
        issues.push('이미지 해상도가 너무 낮습니다. 더 선명한 사진을 업로드해주세요.');
      }

      if (metadata.height && metadata.height < 600) {
        issues.push('이미지 높이가 부족합니다. 문서 전체가 보이도록 촬영해주세요.');
      }

      // Check file size (too small might indicate poor quality)
      if (imageBuffer.length < 50000) { // 50KB
        issues.push('이미지 파일 크기가 너무 작습니다. 더 선명한 사진을 업로드해주세요.');
      }

      // Try OCR extraction to validate readability
      try {
        const ocrResult = await this.extractTextFromImage(imageBuffer);
        
        if (ocrResult.confidence < 0.3) {
          issues.push('텍스트 인식률이 낮습니다. 조명이 좋은 곳에서 다시 촬영해주세요.');
        }

        if (ocrResult.text.length < 10) {
          issues.push('인식된 텍스트가 부족합니다. 문서가 선명하게 보이도록 촬영해주세요.');
        }
      } catch (error) {
        issues.push('문서에서 텍스트를 인식할 수 없습니다. 다른 이미지를 시도해주세요.');
      }

      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      console.error('Document quality validation failed:', error);
      return {
        isValid: false,
        issues: ['이미지 분석에 실패했습니다. 다른 이미지를 시도해주세요.']
      };
    }
  }
}