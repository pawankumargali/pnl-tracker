import appCache from './cache.service.js';
import { TradeHistory } from '../../index.d.js';
import { APIError } from '../middleware/error.middleware.js';
import config from '../../config.js';
class MarketService {

    private readonly TRADE_HISTORY_CACHE_KEY = 'trade_history';
    private readonly MARKET_PRICES: Record<string, string> = {
        BTC: '118000.00',
        ETH: '4500.00',
        BNB: '1000.00',
        SOL: '200.00',
        XRP: '3.00',
        ADA: '1.00',
        POL: '0.25',
        BASE: '0.05'
    };

    async fetchPrices(symbols: string[]): Promise<Record<string, string>> {
        try {
            if (symbols.length === 0) {
                throw new APIError(400, 'No symbols provided');
            }

            for(const symbol of symbols) {
                if(!config.SUPPORTED_SYMBOLS.includes(symbol)) {
                    throw new APIError(404, `Unable to fetch price for symbol - ${symbol}`);
                }
            }

            const markPrices: Record<string, string> = {};
            for(const symbol in this.MARKET_PRICES) {
               const markPrice = this.MARKET_PRICES[symbol.toUpperCase()];
               markPrices[symbol.toUpperCase()] = markPrice;
            }

            return markPrices;


        } catch(e) {
            throw e;
        }
    }

    listTrades(): TradeHistory[] {
        return appCache.get<TradeHistory[]>(this.TRADE_HISTORY_CACHE_KEY) ?? [];
    }

}

export default new MarketService();
