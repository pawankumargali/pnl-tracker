export interface TradeHistory {
    id: number;
    refId: string;
    symbol: string;
    side: OrderSideEnum;
    price: string; // Stored as string to preserve decimal precision
    currency: string;
    quantity: string; // Stored as string (Decimal 38,8)
    fee: string; // Stored as string (Decimal 8,8)
    timestamp: string; // ISO UTC string
    createdAt: string;
    updatedAt: string;
}

export interface Position {
    symbol: string;
    quantity: string; // Current holding quantity (can be negative for short positions)
    averagePrice: string; // Weighted average buy price
    totalCost: string; // Total cost including fees for current holdings
    realizedPnL: string; // Cumulative realized PnL for this symbol
    currency: string;
    createdAt: string;
    updatedAt: string;
}

export interface PnLSummary {
    realizedPnL: string;
    unrealizedPnL: string;
    currency: string;
    positions: PositionWithUnrealizedPnL[];
    updatedAt: string;
}

export interface PositionWithUnrealizedPnL extends Position {
    currentPrice: string;
    unrealizedPnL: string;
    unrealizedPnLPercentage: string;
}

export interface MarketPriceResponse {
    markPrice: string;
}
