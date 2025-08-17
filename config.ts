import dotenv from 'dotenv';
dotenv.config();

const config = {
  PORT: process.env.PORT ? Number(process.env.PORT) : 8081,
  RATE_LIMIT_RPM: process.env.RATE_LIMIT_RPM ? Number(process.env.RATE_LIMIT_RPM) : 30,
  POSITIONS_CACHE_KEY: 'user_positions', // to store user positions in app cache
  PORTFOLIO_REALIZED_PNL_CACHE_KEY: 'portfolio_realized_pnl', // to store portfolio realized PnL in app cache
  TRADE_HISTORY_CACHE_KEY: 'trade_history', // to store trade history in app cache
}

export default config;
