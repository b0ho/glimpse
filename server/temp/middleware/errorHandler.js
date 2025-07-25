"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.errorHandler = void 0;
var errorHandler = function (error, req, res, next) {
    var _a = error.statusCode, statusCode = _a === void 0 ? 500 : _a, message = error.message;
    // Development error response
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', error);
        return res.status(statusCode).json({
            error: {
                message: message,
                stack: error.stack,
                statusCode: error.statusCode,
                isOperational: error.isOperational
            }
        });
    }
    // Production error response
    if (error.isOperational) {
        return res.status(statusCode).json({
            error: {
                message: message
            }
        });
    }
    // Log error for debugging
    console.error('Unexpected error:', error);
    // Don't leak error details in production
    return res.status(500).json({
        error: {
            message: 'Something went wrong!'
        }
    });
};
exports.errorHandler = errorHandler;
var createError = function (statusCode, message) {
    var error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
