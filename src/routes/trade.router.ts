import { Router } from 'express';
import { recordTrade, listTrades } from '../controllers/trade.controller.js';
import { validateRecordTradeInput } from '../middleware/validators/record.trade.validator.js';

const router = Router();

// POST trades - Record a new trade
router.post('/v1/trades', validateRecordTradeInput, recordTrade);

// GET trades - List all trades
router.get('/v1/trades', listTrades);


export default router;
