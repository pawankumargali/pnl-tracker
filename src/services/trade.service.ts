import appCache from './cache.service.js';
import { Decimal } from 'decimal.js';
import { TradeHistory } from '../../index.d.js';
import { RecordTradeParams } from '../middleware/validators/record.trade.validator.js';
import { generateUniqueCode } from '../utils/string.util.js';
import { ONE_WEEK_IN_SECONDS } from '../utils/constants.util.js';
import positionService from './position.service.js';
import config from '../../config.js';

class TradeService {


    async recordTrade(params: RecordTradeParams): Promise<boolean> {
        try {
            const {
                id,
                symbol,
                side,
                price,
                quantity,
                fee = 0,
                timestamp,
              } = params;

              // Prepare decimals with precision (store as fixed 8‐dp strings)
              const priceDecimal = new Decimal(price).toFixed(8);
              const quantityDecimal = new Decimal(quantity).toFixed(8);
              const feeDecimal = new Decimal(fee).toFixed(8);

              // Fetch existing trade history from cache or init empty array
              const tradeHistory: TradeHistory[] = appCache.get<TradeHistory[]>(
                    config.TRADE_HISTORY_CACHE_KEY
                )   ?? [];

              const refId = generateUniqueCode();
              const now = new Date();

              const trade: TradeHistory = {
                id,
                refId: `TRADE_${refId}`,
                symbol: symbol.toUpperCase(),
                side,
                price: priceDecimal,
                currency: 'USD',
                quantity: quantityDecimal,
                fee: feeDecimal,
                timestamp: new Date(timestamp).toISOString(),
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
              };

              // Persist trade to cache
              tradeHistory.push(trade);
              appCache.set(
                config.TRADE_HISTORY_CACHE_KEY,
                tradeHistory,
                ONE_WEEK_IN_SECONDS
              );

              // Update positions based on this trade
              await positionService.upsertPositionPostTrade(trade);

            return true;
        } catch(e) {
            console.error('Error recording trade:', e);
            throw e;
        }
    }

    listTrades(): TradeHistory[] {
        return appCache.get<TradeHistory[]>(config.TRADE_HISTORY_CACHE_KEY) ?? [];
    }

}

export default new TradeService();
