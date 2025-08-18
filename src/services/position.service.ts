import appCache from './cache.service.js';
import { Decimal } from 'decimal.js';
import { Position, TradeHistory, PnLSummary, PositionWithUnrealizedPnL } from '../../index.d.js';
import { OrderSideEnum } from '../middleware/validators/record.trade.validator.js';
import { ONE_WEEK_IN_SECONDS } from '../utils/constants.util.js';
import marketService from './market.service.js';
import { APIError } from '../middleware/error.middleware.js';
import config from '../../config.js';
/**
 * Position Service using AVERAGE COST method for PnL calculations
 *
 * Key Concepts:
 * - Realized PnL: Profit/loss from trades that have been closed (sold)
 * - Unrealized PnL: Profit/loss from current holdings based on latest market prices
 * - Average Cost: When buying multiple times, we calculate weighted average price
 * - SPOT Trading: BUY increases position, SELL decreases position (can't sell without buying)
 */
class PositionService {

    /**
     * Creates or Updates user position based on a trade
     * For SPOT trading: BUY increases position, SELL decreases position
     */
    async upsertPositionPostTrade(trade: TradeHistory): Promise<boolean> {
        try {
            let positions = this.getPositions();
            const symbol = trade.symbol.toUpperCase();
            const existingPosition = positions.find(p => p.symbol === symbol);

            const tradePrice = new Decimal(trade.price);
            const tradeQuantity = new Decimal(trade.quantity);
            const tradeFee = new Decimal(trade.fee || 0);
            const now = new Date().toISOString();

            if (trade.side === OrderSideEnum.BUY) {
                positions = this._handleChangePostBuyTrade(positions, existingPosition, symbol, tradePrice, tradeQuantity, tradeFee, trade.currency, now);
            } else {
                positions = this._handleChangePostSellTrade(positions, existingPosition, symbol, tradePrice, tradeQuantity, tradeFee, trade.currency, now);
            }

            // Save updated positions
            appCache.set(config.POSITIONS_CACHE_KEY, positions, ONE_WEEK_IN_SECONDS);
            return true;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Handle buy trades - adds to position or creates new position
     * Uses AVERAGE COST method: (previous_cost + new_cost) / total_quantity
     */
    private _handleChangePostBuyTrade(
        positions: Position[],
        existingPosition: Position | undefined,
        symbol: string,
        tradePrice: Decimal,
        tradeQuantity: Decimal,
        tradeFee: Decimal,
        currency: string,
        timestamp: string
    ): Position[] {
        try {
            const tradeCost = tradePrice.mul(tradeQuantity).plus(tradeFee);

            if(!existingPosition) {
                // Create new position
                const newPosition: Position = {
                    symbol,
                    quantity: tradeQuantity.toFixed(8),
                    averagePrice: tradeCost.div(tradeQuantity).toFixed(8),
                    totalCost: tradeCost.toFixed(8),
                    realizedPnL: '0.00000000',
                    currency,
                    createdAt: timestamp,
                    updatedAt: timestamp
                };
                positions.push(newPosition);
                return positions;
            }

            //if position already exists, update it
            const currentQuantity = new Decimal(existingPosition.quantity);
            const currentTotalCost = new Decimal(existingPosition.totalCost);

            // Calculate new weighted average price using average cost method
            const newQuantity = currentQuantity.plus(tradeQuantity);
            const newTotalCost = currentTotalCost.plus(tradeCost);
            const newAveragePrice = newTotalCost.div(newQuantity);

            existingPosition.quantity = newQuantity.toFixed(8);
            existingPosition.averagePrice = newAveragePrice.toFixed(8);
            existingPosition.totalCost = newTotalCost.toFixed(8);
            existingPosition.updatedAt = timestamp;

            return positions;
        } catch(error) {
            throw error;
        }
    }

    /**
     * Handle sell trades - reduces position and calculates realized PnL
     * Realized PnL = (sell_price * quantity - fees) - (average_cost * quantity)
     */
    private _handleChangePostSellTrade(
        positions: Position[],
        existingPosition: Position | undefined,
        symbol: string,
        tradePrice: Decimal,
        tradeQuantity: Decimal,
        tradeFee: Decimal,
        currency: string,
        timestamp: string
    ): Position[] {
        try {
            if (!existingPosition) {
                throw new APIError(
                    400,
                    `Cannot sell ${symbol}: No existing position found`
                );
            }

            const currentQuantity = new Decimal(existingPosition.quantity);

            if(new Decimal(currentQuantity).isZero()) {
                throw new APIError(400, `Cannot sell ${symbol}: Position is empty`);
            }

            if(new Decimal(currentQuantity).lt(tradeQuantity)) {
                throw new APIError(
                    400,
                    `Cannot sell ${tradeQuantity.toFixed(8)} ${symbol}: Only ${currentQuantity} available`);
            }

            const averagePrice = new Decimal(existingPosition.averagePrice);
            const currentTotalCost = new Decimal(existingPosition.totalCost);

            // Calculate realized PnL for this sell trade
            const sellValue = tradePrice.mul(tradeQuantity).minus(tradeFee);
            const averageBuyValue = averagePrice.mul(tradeQuantity);
            const realizedPnL = sellValue.minus(averageBuyValue);

            // Update position
            const newQuantity = currentQuantity.minus(tradeQuantity);
            const newTotalCost = currentTotalCost.minus(averageBuyValue);
            const currentRealizedPnL = new Decimal(existingPosition.realizedPnL);

            existingPosition.quantity = newQuantity.toFixed(8);
            existingPosition.totalCost = newTotalCost.toFixed(8);
            existingPosition.realizedPnL = currentRealizedPnL.plus(realizedPnL).toFixed(8);
            existingPosition.updatedAt = timestamp;

            // Update total realized PnL
            this._updatePortfolioRealizedPnL(realizedPnL);

            // Remove position if quantity becomes zero
            if (newQuantity.isZero()) {
                const index = positions.findIndex(p => p.symbol === symbol);
                if (index > -1) {
                    positions.splice(index, 1);
                }
            }

            return positions;
        } catch(error) {
            throw error;
        }
    }

    /**
     * Update total realized PnL across all positions
     */
    private _updatePortfolioRealizedPnL(additionalPnL: Decimal): void {
        const currentTotal = new Decimal(appCache.get<string>(config.PORTFOLIO_REALIZED_PNL_CACHE_KEY) || '0');
        const newTotal = currentTotal.plus(additionalPnL);
        appCache.set(config.PORTFOLIO_REALIZED_PNL_CACHE_KEY, newTotal.toFixed(8), ONE_WEEK_IN_SECONDS);
    }

    /**
     * Get all current positions
     */
    getPositions(): Position[] {
        return appCache.get<Position[]>(config.POSITIONS_CACHE_KEY) || [];
    }

    /**
     * Get total realized PnL for the portfolio
     */
    private _getPortfolioRealizedPnL(): Decimal {
        const realizedPnL = appCache.get<string>(config.PORTFOLIO_REALIZED_PNL_CACHE_KEY) || '0.00000000';
        return new Decimal(realizedPnL);
    }

    /**
     * Calculate unrealized PnL for a position given current market price
     * Unrealized PnL = (current_price * quantity) - total_cost
     */
    private _calculateUnrealizedPnL(position: Position, currentPrice: Decimal): { unrealizedPnL: string; percentage: string } {
        const quantity = new Decimal(position.quantity);

        if (quantity.isZero()) {
            return { unrealizedPnL: '0.00000000', percentage: '0.00' };
        }

        const currentValue = currentPrice.mul(quantity);
        const totalCost = new Decimal(position.totalCost);
        const unrealizedPnL = currentValue.minus(totalCost);

        // Calculate percentage change
        const percentage = totalCost.isZero() ? new Decimal(0) : unrealizedPnL.div(totalCost).mul(100);

        return {
            unrealizedPnL: unrealizedPnL.toFixed(8),
            percentage: percentage.toFixed(2)
        };
    }

    /**
     * Get comprehensive PnL summary with current market prices
     */
    async getPnLSummary(): Promise<PnLSummary> {
        const positions = this.getPositions();
        const overallRealizedPnL = this._getPortfolioRealizedPnL();

        if (positions.length === 0) {
            return {
                realizedPnL: overallRealizedPnL.toFixed(8),
                unrealizedPnL: '0.00000000',
                currency: 'USD',
                positions: [],
                updatedAt: new Date().toISOString()
            };
        }

        // Fetch current market prices for all symbols
        const symbols = positions.map(p => p.symbol.toUpperCase());
        const marketPrices = await marketService.fetchPrices(symbols);

        // Calculate unrealized PnL for each position
        const positionsWithUnrealizedPnL: PositionWithUnrealizedPnL[] = [];
        let overallUnrealizedPnL = new Decimal(0);

        for (const position of positions) {
            const currentPriceStr = marketPrices[position.symbol.toUpperCase()] || '0';
            const currentPrice = new Decimal(currentPriceStr);

            const { unrealizedPnL, percentage } = this._calculateUnrealizedPnL(position, currentPrice);

            positionsWithUnrealizedPnL.push({
                ...position,
                currentPrice: currentPrice.toFixed(8),
                unrealizedPnL,
                unrealizedPnLPercentage: percentage
            });

            overallUnrealizedPnL = overallUnrealizedPnL.plus(unrealizedPnL);
        }

        return {
            realizedPnL: overallRealizedPnL.toFixed(8),
            unrealizedPnL: overallUnrealizedPnL.toFixed(8),
            currency: positions[0]?.currency || 'USD',
            positions: positionsWithUnrealizedPnL,
            updatedAt: new Date().toISOString()
        };
    }
}

export default new PositionService();
