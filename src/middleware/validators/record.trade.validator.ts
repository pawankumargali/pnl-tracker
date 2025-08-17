import { Request, Response, NextFunction } from 'express';
import { APIError } from '../error.middleware.js';

export enum OrderSideEnum {
    BUY = 'BUY',
    SELL = 'SELL'
}

import { z } from 'zod';

export const recordTradeInputSchema = z.object({
  id: z.int().positive(),
  symbol: z.string().trim().min(3),
  side: z.enum(['BUY', 'SELL']),
  price: z.number().positive(),
  quantity: z.number().positive(),
  fee: z.number().optional(),
  timestamp: z.string().pipe(z.coerce.date())
});

export type RecordTradeParams = z.infer<typeof recordTradeInputSchema>;



export function validateRecordTradeInput(req: Request, _: Response, next: NextFunction) {
    try {
        const validatedBody = recordTradeInputSchema.parse(req.body);
        req.body = validatedBody;
        next();
    } catch (error) {
        next(error);
    }
}
