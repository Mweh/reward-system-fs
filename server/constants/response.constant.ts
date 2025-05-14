export const RESPONSES = {
  SUCCESS: {
    code: '00000',
    message: 'Success',
  },
  SERVER_ERROR: {
    code: '50000',
    message: 'Internal server error',
  },
  BAD_REQUEST: {
    code: '40000',
    message: 'Bad request',
  },
  VALIDATION_ERROR: {
    code: '40001',
    message: 'Validation error',
  },
  NOT_FOUND: {
    code: '40400',
    message: 'Resource not found',
  },
  UNAUTHORIZED: {
    code: '40100',
    message: 'Unauthorized access',
  },
  FORBIDDEN: {
    code: '40300',
    message: 'Forbidden access',
  },
};
