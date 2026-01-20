// Firebase Configuration - Storage Only
// Replace with your Firebase project credentials

const firebaseConfig = {
  apiKey: "AIzaSyBbiyyIMbD97CdTyR0XTBGqRPZ8CI15T8o",
  authDomain: "bitex-global.firebaseapp.com",
  projectId: "bitex-global",
  storageBucket: "bitex-global.firebasestorage.app",
  messagingSenderId: "714329529526",
  appId: "1:714329529526:web:38fb55a13ad82212ef9a17"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.warn('The current browser does not support offline persistence');
        }
    });

// Collections
const Collections = {
    SWAPS: 'swaps',
    SETTINGS: 'settings'
};

// EmailJS Configuration
// Sign up at https://www.emailjs.com/ and get your credentials
const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_vuowf8o',
    TEMPLATE_ID_CREATED: 'template_88a445y',
    TEMPLATE_ID_COMPLETED: 'template_tquyn67',
    PUBLIC_KEY: 'siHD9D5u_-iRkmDNP'
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

// Constant Deposit Address (Your exchange wallet)
const DEPOSIT_ADDRESS = {
    BTC: 'bc1q0wa4efcyfcpwsl8jfqww5emhdzgv4d64lgceem',
    ETH: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab',
    BNB: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab',
    USDT: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab',
    USDC: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab',
    XRP: 'rf2Pc9UnS5FPuoLxTVjhN31zG3qGbtPq5w',
    ADA: 'addr1q9g36n3095gpdwvpanxjd28ggf6jue043u37u559dngqzpnsascmashhgzu3fafwct5xpup6rchs2dg889h7f7s23cxsnfp6ht',
    SOL: 'BbrihjgxeNhTHDH5Xzp5Dp7oKfcFwsQBbbb184Y9CsF2',
    DOGE: 'DKtkymsNFxDPryJvTUStC9SzczNbcA58cq',
    DOT: '14q3y4dqqcESDkgg9KakcEPJkToijkrveivd3r1znyFRwPNe',
    MATIC: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab',
    LTC: 'ltc1q0jp0m2cs2lt3wz6z8z5k2fe0267gx9qpj8wunt',
    SHIB: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab',
    TRX: 'TXC1MnuVbnr2yFETFxdEm1VmUUYhCA5xiQ',
    AVAX: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab',
    UNI: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab',
    LINK: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab',
    XLM: 'GBNH5JBY3XXRPE4U3YDOTVSQ3P4GDQZ6JIRI7QMGQ4EB6YNTIN6BASCB',
    ATOM: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab',
    BCH: 'qzvqe9hkw0g07qxf8p5y9knkpl9qjdrnvy63ylvuf3',
    PI: 'GAZBNWNM27EDQE67WWY2EJH4YLBOQR4V6657AGK7NUZG6T5VGNA4GZG5',
    default: '0xa7550Db929E8501f8c85e02cB70692652c1675Ab'
};

// CoinGecko API Configuration
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Minimum swap amount in USD
const MIN_SWAP_USD = 50;

// Export for global access
window.FirebaseDB = { db, Collections };
window.EMAIL_CONFIG = EMAILJS_CONFIG;
window.DEPOSIT_ADDRESS = DEPOSIT_ADDRESS;
window.COINGECKO_API = COINGECKO_API;
window.MIN_SWAP_USD = MIN_SWAP_USD;