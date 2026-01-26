// BitEx Global Configuration
const CONFIG = {
    // Exchange Name
    EXCHANGE_NAME: 'BitEx Global',
    
    // Supported Cryptocurrencies with CoinGecko IDs
    CRYPTOCURRENCIES: [
        { symbol: 'BTC', name: 'Bitcoin', coinGeckoId: 'bitcoin', decimals: 8 },
        { symbol: 'ETH', name: 'Ethereum', coinGeckoId: 'ethereum', decimals: 18 },
        { symbol: 'BNB', name: 'BNB', coinGeckoId: 'binancecoin', decimals: 18 },
        { symbol: 'USDT', name: 'Tether', coinGeckoId: 'tether', decimals: 6 },
        { symbol: 'USDC', name: 'USD Coin', coinGeckoId: 'usd-coin', decimals: 6 },
        { symbol: 'XRP', name: 'Ripple', coinGeckoId: 'ripple', decimals: 6 },
        { symbol: 'ADA', name: 'Cardano', coinGeckoId: 'cardano', decimals: 6 },
        { symbol: 'SOL', name: 'Solana', coinGeckoId: 'solana', decimals: 9, priceAdjustment: -20 }, // 20% cheaper
        { symbol: 'DOGE', name: 'Dogecoin', coinGeckoId: 'dogecoin', decimals: 8 },
        { symbol: 'DOT', name: 'Polkadot', coinGeckoId: 'polkadot', decimals: 10 },
        { symbol: 'MATIC', name: 'Polygon', coinGeckoId: 'matic-network', decimals: 18 },
        { symbol: 'LTC', name: 'Litecoin', coinGeckoId: 'litecoin', decimals: 8 },
        { symbol: 'SHIB', name: 'Shiba Inu', coinGeckoId: 'shiba-inu', decimals: 18 },
        { symbol: 'TRX', name: 'TRON', coinGeckoId: 'tron', decimals: 6 },
        { symbol: 'AVAX', name: 'Avalanche', coinGeckoId: 'avalanche-2', decimals: 18 },
        { symbol: 'UNI', name: 'Uniswap', coinGeckoId: 'uniswap', decimals: 18 },
        { symbol: 'LINK', name: 'Chainlink', coinGeckoId: 'chainlink', decimals: 18 },
        { symbol: 'XLM', name: 'Stellar', coinGeckoId: 'stellar', decimals: 7 },
        { symbol: 'ATOM', name: 'Cosmos', coinGeckoId: 'cosmos', decimals: 6 },
        { symbol: 'BCH', name: 'Bitcoin Cash', coinGeckoId: 'bitcoin-cash', decimals: 8 },
        { symbol: 'PI', name: 'Pi Network', coinGeckoId: 'pi-network', decimals: 7, priceAdjustment: 50 } // 50% higher
    ],
    
    // Swap Status
    SWAP_STATUS: {
        PENDING: 'pending',
        DEPOSITED: 'deposited',
        PROCESSING: 'processing',
        COMPLETED: 'completed',
        FAILED: 'failed'
    },
    
    // Admin Credentials (In production, use proper authentication)
    ADMIN: {
        USERNAME: 'admin',
        PASSWORD: 'admin123'
    },
    
    // Price update interval (30 seconds)
    PRICE_UPDATE_INTERVAL: 30000,
    
    // Network fee (0.5% of transaction)
    NETWORK_FEE_PERCENT: 0.5

};
