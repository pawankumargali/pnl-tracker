import { Request, Response, NextFunction } from 'express';
import tradeService from '../services/trade.service.js';
import { RecordTradeParams } from '../middleware/validators/record.trade.validator.js';


export async function recordTrade(req: Request, res: Response, next: NextFunction) {
  try {
    const recordTradeParams = req.body as RecordTradeParams;
    await tradeService.recordTrade(recordTradeParams);
    return res.status(201).json({ message: 'Trade recorded successfully', data: null });
  } catch (error) {
    next(error);
  }
}

export async function listTrades(req: Request, res: Response, next: NextFunction) {
  try {
    const trades = tradeService.listTrades();
    return res.status(200).json({ message: 'Fetched Trades successfully', data: trades });
  } catch (error) {
    next(error);
  }
}
