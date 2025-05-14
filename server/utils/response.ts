import crypto from 'crypto';

export const createResponse = (
  response: { code: string; message: string },
  data: object | null = null,
  transactionId: string = crypto.randomUUID()
) => {
  return {
    status: response.code,
    message: response.message,
    data,
    transaction_id: transactionId,
  };
};
