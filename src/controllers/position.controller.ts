import { Request, Response, NextFunction } from 'express';
import positionService from '../services/position.service.js';
import { getAllMarketPrices, updateMarketPrice } from '../utils/market.util.js';

export async function getPortfolio(req: Request, res: Response, next: NextFunction) {
  try {
    const positions = positionService.getPositions();
    return res.status(200).json({
      message: 'Fetched positions successfully',
      data: positions
    });
  } catch (error) {
    next(error);
  }
}

export async function getPnLSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const pnlSummary = await positionService.getPnLSummary();
    return res.status(200).json({
      message: 'Fetched PnL summary successfully',
      data: pnlSummary
    });
  } catch (error) {
    next(error);
  }
}
