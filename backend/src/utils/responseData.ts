import type { Response } from 'express';

export const serverError = (response: Response, message: string): Response => {
  return response.status(500).json({
    message,
    status: 500,
  });
};

export const clientError = (response: Response, message: string): Response => {
  return response.status(400).json({
    message,
    status: 400,
  });
};

export const createSuccessData = (response: Response, data: any): Response => {
  return response.status(201).json({
    status: 201,
    data,
  });
};
export const createData = (response: Response, data: any): Response => {
  return response.status(200).json({
    status: 200,
    data,
  });
};
