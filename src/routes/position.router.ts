import { Router } from 'express';
import {
  getPortfolio,
  getPnLSummary
} from '../controllers/position.controller.js';

const positionRouter = Router();

// GET positions - List all current positions
positionRouter.get('/v1/positions/portfolio', getPortfolio);

// GET positions/pnl - Get comprehensive PnL summary with unrealized PnL
positionRouter.get('/v1/positions/pnl', getPnLSummary);

export default positionRouter;
