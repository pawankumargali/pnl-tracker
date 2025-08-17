// Hardcoded market prices for testing and simplicity
// In a real application, this would come from a live API
const MARKET_PRICES: Record<string, string> = {
    'BTC': '40000.00000000',
    'ETH': '2000.00000000',
    'ADA': '0.50000000',
    'SOL': '100.00000000',
    'DOT': '15.00000000',
    'LINK': '25.00000000'
};

export async function fetchMarketPrice(symbol: string): Promise<string> {
    const price = MARKET_PRICES[symbol.toUpperCase()];

    if (!price) {
        console.warn(`No market price found for symbol: ${symbol.toUpperCase()}, defaulting to 0`);
        return '0.00000000';
    }

    return price;
}

export async function fetchMultipleMarketPrices(symbols: string[]): Promise<Map<string, string>> {
    const priceMap = new Map<string, string>();

    for (const symbol of symbols) {
        const price = await fetchMarketPrice(symbol);
        priceMap.set(symbol.toUpperCase(), price);
    }

    return priceMap;
}

// Utility function to update market prices for testing
export function updateMarketPrice(symbol: string, price: string): void {
    MARKET_PRICES[symbol.toUpperCase()] = price;
}

// Get all available market prices
export function getAllMarketPrices(): Record<string, string> {
    return { ...MARKET_PRICES };
}
