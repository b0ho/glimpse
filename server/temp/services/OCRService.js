"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OCRService = void 0;
var axios_1 = require("axios");
var errorHandler_1 = require("../middleware/errorHandler");
var sharp_1 = require("sharp");
var form_data_1 = require("form-data");
var OCRService = /** @class */ (function () {
    function OCRService() {
        this.naverApiUrl = 'https://naveropenapi.apigw.ntruss.com/vision/v1/ocr';
        this.naverClientId = process.env.NAVER_OCR_CLIENT_ID || '';
        this.naverClientSecret = process.env.NAVER_OCR_CLIENT_SECRET || '';
        this.googleApiKey = process.env.GOOGLE_VISION_API_KEY || '';
    }
    OCRService.prototype.extractTextFromImage = function (imageBuffer_1) {
        return __awaiter(this, arguments, void 0, function (imageBuffer, ocrProvider) {
            var processedImage, _a, error_1;
            if (ocrProvider === void 0) { ocrProvider = 'naver'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, this.preprocessImage(imageBuffer)];
                    case 1:
                        processedImage = _b.sent();
                        _a = ocrProvider;
                        switch (_a) {
                            case 'naver': return [3 /*break*/, 2];
                            case 'google': return [3 /*break*/, 4];
                        }
                        return [3 /*break*/, 6];
                    case 2: return [4 /*yield*/, this.extractWithNaverOCR(processedImage)];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4: return [4 /*yield*/, this.extractWithGoogleVision(processedImage)];
                    case 5: return [2 /*return*/, _b.sent()];
                    case 6: throw new Error('Unsupported OCR provider');
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        error_1 = _b.sent();
                        console.error('OCR extraction failed:', error_1);
                        throw (0, errorHandler_1.createError)(500, 'OCR 텍스트 추출에 실패했습니다.');
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    OCRService.prototype.verifyCompanyCard = function (imageBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var ocrResult, companyInfo, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.extractTextFromImage(imageBuffer)];
                    case 1:
                        ocrResult = _a.sent();
                        companyInfo = this.extractCompanyInfo(ocrResult.text);
                        return [2 /*return*/, __assign(__assign({}, companyInfo), { confidence: Math.min(ocrResult.confidence, companyInfo.confidence) })];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Company card verification failed:', error_2);
                        throw (0, errorHandler_1.createError)(500, '회사 카드 인증에 실패했습니다.');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OCRService.prototype.verifyIDCard = function (imageBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var ocrResult, idInfo, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.extractTextFromImage(imageBuffer)];
                    case 1:
                        ocrResult = _a.sent();
                        idInfo = this.extractIDCardInfo(ocrResult.text);
                        return [2 /*return*/, __assign(__assign({}, idInfo), { confidence: Math.min(ocrResult.confidence, idInfo.confidence) })];
                    case 2:
                        error_3 = _a.sent();
                        console.error('ID card verification failed:', error_3);
                        throw (0, errorHandler_1.createError)(500, '신분증 인증에 실패했습니다.');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OCRService.prototype.verifyStudentCard = function (imageBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var ocrResult, studentInfo, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.extractTextFromImage(imageBuffer)];
                    case 1:
                        ocrResult = _a.sent();
                        studentInfo = this.extractStudentCardInfo(ocrResult.text);
                        return [2 /*return*/, __assign(__assign({}, studentInfo), { confidence: Math.min(ocrResult.confidence, studentInfo.confidence) })];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Student card verification failed:', error_4);
                        throw (0, errorHandler_1.createError)(500, '학생증 인증에 실패했습니다.');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OCRService.prototype.preprocessImage = function (imageBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var processedImage, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, (0, sharp_1.default)(imageBuffer)
                                .resize({ width: 1500, withoutEnlargement: true }) // Resize if too large
                                .grayscale() // Convert to grayscale
                                .normalize() // Normalize contrast
                                .sharpen({ sigma: 1, m1: 0.5, m2: 0.5 }) // Sharpen text
                                .jpeg({ quality: 95 }) // High quality JPEG
                                .toBuffer()];
                    case 1:
                        processedImage = _a.sent();
                        return [2 /*return*/, processedImage];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Image preprocessing failed:', error_5);
                        return [2 /*return*/, imageBuffer]; // Return original if preprocessing fails
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OCRService.prototype.extractWithNaverOCR = function (imageBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var formData, response, result, fields, extractedText, avgConfidence, boundingBoxes, error_6;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.naverClientId || !this.naverClientSecret) {
                            throw new Error('Naver OCR credentials not configured');
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        formData = new form_data_1.default();
                        formData.append('image', imageBuffer, {
                            filename: 'image.jpg',
                            contentType: 'image/jpeg'
                        });
                        return [4 /*yield*/, axios_1.default.post(this.naverApiUrl, formData, {
                                headers: __assign({ 'X-NCP-APIGW-API-KEY-ID': this.naverClientId, 'X-NCP-APIGW-API-KEY': this.naverClientSecret }, formData.getHeaders())
                            })];
                    case 2:
                        response = _b.sent();
                        result = response.data;
                        if (!result.images || result.images.length === 0) {
                            throw new Error('No text detected in image');
                        }
                        fields = result.images[0].fields || [];
                        extractedText = fields.map(function (field) { return field.inferText || ''; }).join(' ');
                        avgConfidence = fields.length > 0
                            ? fields.reduce(function (sum, field) { return sum + (field.inferConfidence || 0); }, 0) / fields.length
                            : 0;
                        boundingBoxes = fields.map(function (field) {
                            var _a, _b, _c, _d, _e;
                            var vertices = ((_a = field.boundingPoly) === null || _a === void 0 ? void 0 : _a.vertices) || [];
                            var x = ((_b = vertices[0]) === null || _b === void 0 ? void 0 : _b.x) || 0;
                            var y = ((_c = vertices[0]) === null || _c === void 0 ? void 0 : _c.y) || 0;
                            var width = (((_d = vertices[2]) === null || _d === void 0 ? void 0 : _d.x) || 0) - x;
                            var height = (((_e = vertices[2]) === null || _e === void 0 ? void 0 : _e.y) || 0) - y;
                            return {
                                text: field.inferText || '',
                                x: x,
                                y: y,
                                width: width,
                                height: height,
                                confidence: field.inferConfidence || 0
                            };
                        });
                        return [2 /*return*/, {
                                text: extractedText,
                                confidence: avgConfidence,
                                boundingBoxes: boundingBoxes
                            }];
                    case 3:
                        error_6 = _b.sent();
                        console.error('Naver OCR API error:', (_a = error_6.response) === null || _a === void 0 ? void 0 : _a.data);
                        throw new Error('Naver OCR 처리에 실패했습니다.');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OCRService.prototype.extractWithGoogleVision = function (imageBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var base64Image, requestBody, response, result, fullText, confidence, boundingBoxes, error_7;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.googleApiKey) {
                            throw new Error('Google Vision API key not configured');
                        }
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        base64Image = imageBuffer.toString('base64');
                        requestBody = {
                            requests: [{
                                    image: { content: base64Image },
                                    features: [{ type: 'TEXT_DETECTION', maxResults: 50 }]
                                }]
                        };
                        return [4 /*yield*/, axios_1.default.post("https://vision.googleapis.com/v1/images:annotate?key=".concat(this.googleApiKey), requestBody)];
                    case 2:
                        response = _b.sent();
                        result = response.data.responses[0];
                        if (!result.textAnnotations || result.textAnnotations.length === 0) {
                            throw new Error('No text detected in image');
                        }
                        fullText = result.textAnnotations[0].description;
                        confidence = result.textAnnotations[0].confidence || 0.8;
                        boundingBoxes = result.textAnnotations.slice(1).map(function (annotation) {
                            var _a, _b, _c, _d, _e;
                            var vertices = ((_a = annotation.boundingPoly) === null || _a === void 0 ? void 0 : _a.vertices) || [];
                            var x = ((_b = vertices[0]) === null || _b === void 0 ? void 0 : _b.x) || 0;
                            var y = ((_c = vertices[0]) === null || _c === void 0 ? void 0 : _c.y) || 0;
                            var width = (((_d = vertices[2]) === null || _d === void 0 ? void 0 : _d.x) || 0) - x;
                            var height = (((_e = vertices[2]) === null || _e === void 0 ? void 0 : _e.y) || 0) - y;
                            return {
                                text: annotation.description || '',
                                x: x,
                                y: y,
                                width: width,
                                height: height,
                                confidence: annotation.confidence || 0.8
                            };
                        });
                        return [2 /*return*/, {
                                text: fullText,
                                confidence: confidence,
                                boundingBoxes: boundingBoxes
                            }];
                    case 3:
                        error_7 = _b.sent();
                        console.error('Google Vision API error:', (_a = error_7.response) === null || _a === void 0 ? void 0 : _a.data);
                        throw new Error('Google Vision OCR 처리에 실패했습니다.');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    OCRService.prototype.extractCompanyInfo = function (text) {
        var lines = text.split('\n').map(function (line) { return line.trim(); }).filter(function (line) { return line.length > 0; });
        var companyName;
        var domain;
        var confidence = 0.5;
        // Common patterns for company names
        var companyPatterns = [
            /([가-힣\w\s]+)\s*(주식회사|㈜|회사|그룹|코퍼레이션|Corporation|Co\.|Ltd\.|Inc\.)/i,
            /(주식회사|㈜)\s*([가-힣\w\s]+)/i,
            /([가-힣\w\s]+)\s*(Company|Corp|Corporation)/i
        ];
        // Email domain patterns
        var emailPattern = /@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
        // Find company name
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            for (var _a = 0, companyPatterns_1 = companyPatterns; _a < companyPatterns_1.length; _a++) {
                var pattern = companyPatterns_1[_a];
                var match = line.match(pattern);
                if (match) {
                    companyName = match[1] || match[2];
                    companyName = companyName.trim();
                    confidence = Math.max(confidence, 0.8);
                    break;
                }
            }
            if (companyName)
                break;
        }
        // Find email domain
        var emailMatches = text.match(emailPattern);
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
            companyName: companyName,
            domain: domain,
            confidence: Math.min(confidence, 1.0)
        };
    };
    OCRService.prototype.extractIDCardInfo = function (text) {
        var lines = text.split('\n').map(function (line) { return line.trim(); }).filter(function (line) { return line.length > 0; });
        var name;
        var idNumber;
        var issueDate;
        var confidence = 0.5;
        // Korean name pattern (2-4 characters)
        var namePattern = /이름\s*[:：]\s*([가-힣]{2,4})|([가-힣]{2,4})\s*(?=\d{6}-\d{7})/;
        // Korean ID number pattern
        var idNumberPattern = /(\d{6}[-\s]*\d{7})/;
        // Date patterns
        var datePattern = /(\d{4})[-.\s]*(\d{1,2})[-.\s]*(\d{1,2})/;
        var fullText = lines.join(' ');
        // Extract name
        var nameMatch = fullText.match(namePattern);
        if (nameMatch) {
            name = nameMatch[1] || nameMatch[2];
            confidence = Math.max(confidence, 0.8);
        }
        // Extract ID number
        var idMatch = fullText.match(idNumberPattern);
        if (idMatch) {
            idNumber = idMatch[1].replace(/\s/g, ''); // Remove spaces
            confidence = Math.max(confidence, 0.9);
        }
        // Extract issue date
        var dateMatch = fullText.match(datePattern);
        if (dateMatch) {
            var year = dateMatch[1];
            var month = dateMatch[2].padStart(2, '0');
            var day = dateMatch[3].padStart(2, '0');
            issueDate = "".concat(year, "-").concat(month, "-").concat(day);
            confidence = Math.max(confidence, 0.7);
        }
        // Validate ID number format
        if (idNumber && !this.validateKoreanIDNumber(idNumber)) {
            idNumber = undefined;
            confidence = Math.max(confidence - 0.3, 0.1);
        }
        return {
            name: name,
            idNumber: idNumber,
            issueDate: issueDate,
            confidence: Math.min(confidence, 1.0)
        };
    };
    OCRService.prototype.extractStudentCardInfo = function (text) {
        var lines = text.split('\n').map(function (line) { return line.trim(); }).filter(function (line) { return line.length > 0; });
        var university;
        var studentId;
        var name;
        var confidence = 0.5;
        // University name patterns
        var universityPatterns = [
            /([가-힣]+대학교|[가-힣]+대학|[가-힣]+학교)/,
            /(대학교|University|College)/i
        ];
        // Student ID patterns
        var studentIdPattern = /(?:학번|번호|ID)?\s*[:：]?\s*(\d{8,12})/;
        // Name pattern
        var namePattern = /(?:이름|성명)?\s*[:：]?\s*([가-힣]{2,4})/;
        var fullText = lines.join(' ');
        // Find university name
        for (var _i = 0, lines_2 = lines; _i < lines_2.length; _i++) {
            var line = lines_2[_i];
            for (var _a = 0, universityPatterns_1 = universityPatterns; _a < universityPatterns_1.length; _a++) {
                var pattern = universityPatterns_1[_a];
                var match = line.match(pattern);
                if (match) {
                    if (match[1] && match[1].includes('대학')) {
                        university = match[1];
                        confidence = Math.max(confidence, 0.8);
                        break;
                    }
                    else if (line.length < 20) { // Avoid long lines that might not be university names
                        university = line;
                        confidence = Math.max(confidence, 0.6);
                        break;
                    }
                }
            }
            if (university)
                break;
        }
        // Find student ID
        var idMatch = fullText.match(studentIdPattern);
        if (idMatch) {
            studentId = idMatch[1];
            confidence = Math.max(confidence, 0.9);
        }
        // Find name
        var nameMatch = fullText.match(namePattern);
        if (nameMatch) {
            name = nameMatch[1];
            confidence = Math.max(confidence, 0.7);
        }
        return {
            university: university,
            studentId: studentId,
            name: name,
            confidence: Math.min(confidence, 1.0)
        };
    };
    OCRService.prototype.validateKoreanIDNumber = function (idNumber) {
        // Remove any dashes or spaces
        var cleanId = idNumber.replace(/[-\s]/g, '');
        // Must be exactly 13 digits
        if (cleanId.length !== 13 || !/^\d{13}$/.test(cleanId)) {
            return false;
        }
        // Validate check digit using Korean ID number algorithm
        var weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
        var sum = 0;
        for (var i = 0; i < 12; i++) {
            var digit = parseInt(cleanId[i] || '0');
            var weight = weights[i] || 0;
            sum += digit * weight;
        }
        var checkDigit = (11 - (sum % 11)) % 10;
        var lastDigit = parseInt(cleanId[12] || '0');
        return checkDigit === lastDigit;
    };
    OCRService.prototype.detectDocumentType = function (imageBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var ocrResult, text, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.extractTextFromImage(imageBuffer)];
                    case 1:
                        ocrResult = _a.sent();
                        text = ocrResult.text.toLowerCase();
                        // Document type detection patterns
                        if (text.includes('주민등록증') || text.includes('신분증') || /\d{6}-\d{7}/.test(text)) {
                            return [2 /*return*/, 'id_card'];
                        }
                        if (text.includes('사원증') || text.includes('직원증') || text.includes('company') ||
                            text.includes('employee') || /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) {
                            return [2 /*return*/, 'company_card'];
                        }
                        if (text.includes('학생증') || text.includes('대학교') || text.includes('university') ||
                            text.includes('college') || text.includes('학번')) {
                            return [2 /*return*/, 'student_card'];
                        }
                        return [2 /*return*/, 'unknown'];
                    case 2:
                        error_8 = _a.sent();
                        console.error('Document type detection failed:', error_8);
                        return [2 /*return*/, 'unknown'];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OCRService.prototype.validateDocumentQuality = function (imageBuffer) {
        return __awaiter(this, void 0, void 0, function () {
            var issues, metadata, ocrResult, error_9, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        issues = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, (0, sharp_1.default)(imageBuffer).metadata()];
                    case 2:
                        metadata = _a.sent();
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
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.extractTextFromImage(imageBuffer)];
                    case 4:
                        ocrResult = _a.sent();
                        if (ocrResult.confidence < 0.3) {
                            issues.push('텍스트 인식률이 낮습니다. 조명이 좋은 곳에서 다시 촬영해주세요.');
                        }
                        if (ocrResult.text.length < 10) {
                            issues.push('인식된 텍스트가 부족합니다. 문서가 선명하게 보이도록 촬영해주세요.');
                        }
                        return [3 /*break*/, 6];
                    case 5:
                        error_9 = _a.sent();
                        issues.push('문서에서 텍스트를 인식할 수 없습니다. 다른 이미지를 시도해주세요.');
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/, {
                            isValid: issues.length === 0,
                            issues: issues
                        }];
                    case 7:
                        error_10 = _a.sent();
                        console.error('Document quality validation failed:', error_10);
                        return [2 /*return*/, {
                                isValid: false,
                                issues: ['이미지 분석에 실패했습니다. 다른 이미지를 시도해주세요.']
                            }];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    // Method alias for compatibility
    OCRService.prototype.processEmployeeCard = function (imageInput) {
        return __awaiter(this, void 0, void 0, function () {
            var imageBuffer, base64Data, companyInfo, idInfo;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (typeof imageInput === 'string') {
                            // Handle base64 or URL input
                            if (imageInput.startsWith('data:image/')) {
                                base64Data = imageInput.split(',')[1];
                                imageBuffer = Buffer.from(base64Data, 'base64');
                            }
                            else if (imageInput.startsWith('http')) {
                                // Handle URL - would need to fetch the image
                                throw new Error('URL input not supported yet');
                            }
                            else {
                                // Assume base64
                                imageBuffer = Buffer.from(imageInput, 'base64');
                            }
                        }
                        else {
                            imageBuffer = imageInput;
                        }
                        return [4 /*yield*/, this.verifyCompanyCard(imageBuffer)];
                    case 1:
                        companyInfo = _a.sent();
                        return [4 /*yield*/, this.verifyIDCard(imageBuffer)];
                    case 2:
                        idInfo = _a.sent();
                        return [2 /*return*/, {
                                companyName: companyInfo.companyName,
                                employeeName: idInfo.name,
                                confidence: Math.min(companyInfo.confidence, idInfo.confidence || 0.5)
                            }];
                }
            });
        });
    };
    return OCRService;
}());
exports.OCRService = OCRService;
