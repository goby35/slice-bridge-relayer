import { HTTPException } from 'hono/http-exception'
import { ContentfulStatusCode } from 'hono/utils/http-status'
import { ErrorCode } from '@/lib/constants';

export class AppError extends HTTPException {
    public code: ErrorCode;
    constructor(status: ContentfulStatusCode, code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR, message: string) {
        super(status, { message })
        this.code = code;
    }
}

export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(400, ErrorCode.BAD_REQUEST, message)
    }
}

export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(404, ErrorCode.NOT_FOUND, message)
    }
}

export class InternalServerError extends AppError {
    constructor(message = 'Internal server error') {
        super(500, ErrorCode.INTERNAL_SERVER_ERROR, message)
    }
}