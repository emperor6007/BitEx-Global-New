// BitEx Global - Main Application
const App = {
    currentStep: 1,
    selectedSendCurrency: null,
    selectedReceiveCurrency: null,
    sendAmount: 0,
    receiveAmount: 0,
    recipientAddress: '',
    userEmail: '',
    currentSwap: null,
    priceCache: {},
    priceUpdateInterval: null,
    currencySelectionType: null,

    // Initialize app
    init() {
        this.initializeCurrencies();
        this.setupEventListeners();
        this.startPriceUpdates();
        console.log('BitEx Global initialized');
    },

    // Initialize default currencies
    initializeCurrencies() {
        this.selectedSendCurrency = CONFIG.CRYPTOCURRENCIES[0]; // BTC
        this.selectedReceiveCurrency = CONFIG.CRYPTOCURRENCIES[1]; // ETH
        this.updateCurrencyDisplay('send');
        this.updateCurrencyDisplay('receive');
    },

    // Setup all event listeners
    setupEventListeners() {
        // ===== HAMBURGER MENU =====
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const mobileNav = document.getElementById('mobileNav');
        
        if (hamburgerBtn && mobileNav) {
            // Toggle menu on hamburger click
            hamburgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                hamburgerBtn.classList.toggle('active');
                mobileNav.classList.toggle('active');
            });

            // Close menu when clicking on a nav item
            document.querySelectorAll('.mobile-nav-item').forEach(item => {
                item.addEventListener('click', () => {
                    hamburgerBtn.classList.remove('active');
                    mobileNav.classList.remove('active');
                });
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!hamburgerBtn.contains(e.target) && !mobileNav.contains(e.target)) {
                    hamburgerBtn.classList.remove('active');
                    mobileNav.classList.remove('active');
                }
            });
        }

        // ===== CURRENCY SELECTION =====
        // Step 1: Currency selection and amount
        document.getElementById('sendAmount').addEventListener('input', (e) => {
            this.handleAmountChange(e.target.value);
        });

        document.getElementById('sendCurrencyBtn').addEventListener('click', () => {
            this.openCurrencyModal('send');
        });

        document.getElementById('receiveCurrencyBtn').addEventListener('click', () => {
            this.openCurrencyModal('receive');
        });

        document.getElementById('swapDirectionBtn').addEventListener('click', () => {
            this.swapCurrencies();
        });

        document.getElementById('continueToStep2').addEventListener('click', () => {
            this.goToStep(2);
        });

        // Step 2: Details and confirmation
        document.getElementById('recipientAddress').addEventListener('input', () => {
            this.validateStep2();
        });

        document.getElementById('termsAgree').addEventListener('change', () => {
            this.validateStep2();
        });

        document.getElementById('backToStep1').addEventListener('click', () => {
            this.goToStep(1);
        });

        document.getElementById('continueToStep3').addEventListener('click', () => {
            this.createSwap();
        });

        // Currency modal
        document.getElementById('closeCurrencyModal').addEventListener('click', () => {
            this.closeCurrencyModal();
        });

        document.getElementById('currencySearch').addEventListener('input', (e) => {
            this.filterCurrencies(e.target.value);
        });

        // Track swap
        document.getElementById('trackBtn').addEventListener('click', () => {
            this.trackSwap();
        });
    },

    // Start automatic price updates
    startPriceUpdates() {
        this.updatePrices();
        this.priceUpdateInterval = setInterval(() => {
            this.updatePrices();
        }, CONFIG.PRICE_UPDATE_INTERVAL);
    },

    // Fetch prices from CoinGecko
    async updatePrices() {
        try {
            // Get all unique currency IDs
            const ids = CONFIG.CRYPTOCURRENCIES.map(c => c.coinGeckoId).join(',');
            
            const response = await fetch(
                `${window.COINGECKO_API}/simple/price?ids=${ids}&vs_currencies=usd`
            );
            
            const data = await response.json();
            
            // Update price cache with adjustments
            CONFIG.CRYPTOCURRENCIES.forEach(currency => {
                if (data[currency.coinGeckoId]) {
                    let price = data[currency.coinGeckoId].usd;
                    
                    // Apply price adjustment if specified
                    if (currency.priceAdjustment) {
                        const adjustment = currency.priceAdjustment / 100;
                        price = price * (1 + adjustment);
                    }
                    
                    this.priceCache[currency.symbol] = price;
                }
            });

            // Update display if amount is entered
            if (this.sendAmount > 0) {
                this.calculateReceiveAmount();
            }
        } catch (error) {
            console.error('Failed to fetch prices:', error);
        }
    },

    // Handle amount input change
    async handleAmountChange(value) {
        this.sendAmount = parseFloat(value) || 0;
        
        if (this.sendAmount <= 0) {
            document.getElementById('receiveAmount').value = '';
            document.getElementById('sendUsdValue').textContent = '≈ $0.00';
            document.getElementById('receiveUsdValue').textContent = '≈ $0.00';
            document.getElementById('continueToStep2').disabled = true;
            document.getElementById('minAmountWarning').style.display = 'none';
            return;
        }

        await this.calculateReceiveAmount();
        this.validateStep1();
    },

    // Calculate receive amount
    async calculateReceiveAmount() {
        const sendPrice = this.priceCache[this.selectedSendCurrency.symbol] || 0;
        const receivePrice = this.priceCache[this.selectedReceiveCurrency.symbol] || 0;

        if (sendPrice === 0 || receivePrice === 0) {
            return;
        }

        // Calculate USD values
        const sendUsdValue = this.sendAmount * sendPrice;
        
        // Apply 2% network fee
        const feePercent = CONFIG.NETWORK_FEE_PERCENT / 100;
        const amountAfterFee = sendUsdValue * (1 - feePercent);
        
        // Calculate receive amount
        this.receiveAmount = amountAfterFee / receivePrice;

        // Update display
        document.getElementById('receiveAmount').value = this.receiveAmount.toFixed(8);
        document.getElementById('sendUsdValue').textContent = `≈ $${sendUsdValue.toFixed(2)}`;
        document.getElementById('receiveUsdValue').textContent = `≈ $${amountAfterFee.toFixed(2)}`;
        
        // Update exchange info
        const rate = (this.receiveAmount / this.sendAmount).toFixed(8);
        document.getElementById('exchangeRate').textContent = 
            `1 ${this.selectedSendCurrency.symbol} = ${rate} ${this.selectedReceiveCurrency.symbol}`;
        document.getElementById('networkFee').textContent = 
            `${this.sendAmount * feePercent} ${this.selectedSendCurrency.symbol} ($${(sendUsdValue * feePercent).toFixed(2)})`;
    },

    // Validate step 1
    validateStep1() {
        const sendPrice = this.priceCache[this.selectedSendCurrency.symbol] || 0;
        const sendUsdValue = this.sendAmount * sendPrice;

        if (sendUsdValue < window.MIN_SWAP_USD) {
            document.getElementById('minAmountWarning').style.display = 'flex';
            document.getElementById('continueToStep2').disabled = true;
        } else {
            document.getElementById('minAmountWarning').style.display = 'none';
            document.getElementById('continueToStep2').disabled = false;
        }
    },

    // Validate step 2
    validateStep2() {
        const address = document.getElementById('recipientAddress').value.trim();
        const termsChecked = document.getElementById('termsAgree').checked;

        document.getElementById('continueToStep3').disabled = !(address.length >= 26 && termsChecked);
    },

    // Go to specific step
    goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.swap-step').forEach(s => s.style.display = 'none');
        
        // Update progress
        document.querySelectorAll('.step').forEach((s, index) => {
            if (index + 1 < step) {
                s.classList.add('completed');
                s.classList.remove('active');
            } else if (index + 1 === step) {
                s.classList.add('active');
                s.classList.remove('completed');
            } else {
                s.classList.remove('active', 'completed');
            }
        });

        // Show current step
        document.getElementById(`step${step}`).style.display = 'block';
        this.currentStep = step;

        // Update step 2 summary
        if (step === 2) {
            document.getElementById('summaryYouSend').textContent = 
                `${this.sendAmount} ${this.selectedSendCurrency.symbol}`;
            document.getElementById('summaryYouReceive').textContent = 
                `${this.receiveAmount.toFixed(8)} ${this.selectedReceiveCurrency.symbol}`;
            document.getElementById('receiveCurrencyHint').textContent = this.selectedReceiveCurrency.symbol;
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Create swap
    async createSwap() {
        this.recipientAddress = document.getElementById('recipientAddress').value.trim();
        this.userEmail = document.getElementById('userEmail').value.trim();

        try {
            // Generate swap ID
            const swapId = this.generateSwapId();
            
            // Get deposit address
            const depositAddress = window.DEPOSIT_ADDRESS[this.selectedSendCurrency.symbol] || 
                                  window.DEPOSIT_ADDRESS.default;

            // Create swap object
            const swap = {
                id: swapId,
                fromCurrency: this.selectedSendCurrency.symbol,
                toCurrency: this.selectedReceiveCurrency.symbol,
                sendAmount: this.sendAmount,
                receiveAmount: this.receiveAmount,
                recipientAddress: this.recipientAddress,
                depositAddress: depositAddress,
                email: this.userEmail,
                status: CONFIG.SWAP_STATUS.PENDING,
                createdAt: firebase.firestore.Timestamp.now(),
                updatedAt: firebase.firestore.Timestamp.now()
            };

            // Save to Firestore
            await FirebaseDB.db.collection(FirebaseDB.Collections.SWAPS).doc(swapId).set(swap);

            this.currentSwap = swap;

            // Send confirmation email
            if (this.userEmail) {
                this.sendSwapCreatedEmail(swap);
            }

            // Update step 2 summary
            document.getElementById('summaryRecipient').textContent = 
                this.recipientAddress.substring(0, 20) + '...';

            // Go to step 3
            this.showDepositDetails();
            this.goToStep(3);

            this.showToast('Exchange created successfully!', 'success');
        } catch (error) {
            console.error('Error creating swap:', error);
            this.showToast('Failed to create exchange. Please try again.', 'error');
        }
    },

    // Show deposit details
    showDepositDetails() {
        document.getElementById('swapId').textContent = this.currentSwap.id;
        document.getElementById('depositAddress').textContent = this.currentSwap.depositAddress;
        document.getElementById('amountToSend').textContent = 
            `${this.currentSwap.sendAmount} ${this.currentSwap.fromCurrency}`;
        document.getElementById('willReceive').textContent = 
            `${this.currentSwap.receiveAmount.toFixed(8)} ${this.currentSwap.toCurrency}`;
    },

    // Send swap created email
    async sendSwapCreatedEmail(swap) {
        try {
            const templateParams = {
                to_email: swap.email,
                swap_id: swap.id,
                from_currency: swap.fromCurrency,
                to_currency: swap.toCurrency,
                send_amount: swap.sendAmount,
                receive_amount: swap.receiveAmount.toFixed(8),
                deposit_address: swap.depositAddress,
                recipient_address: swap.recipientAddress
            };

            await emailjs.send(
                window.EMAIL_CONFIG.SERVICE_ID,
                window.EMAIL_CONFIG.TEMPLATE_ID_CREATED,
                templateParams
            );

            console.log('Confirmation email sent');
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    },

    // Send swap completed email
    async sendSwapCompletedEmail(swap) {
        try {
            const templateParams = {
                to_email: swap.email,
                swap_id: swap.id,
                from_currency: swap.fromCurrency,
                to_currency: swap.toCurrency,
                receive_amount: swap.receiveAmount.toFixed(8),
                recipient_address: swap.recipientAddress
            };

            await emailjs.send(
                window.EMAIL_CONFIG.SERVICE_ID,
                window.EMAIL_CONFIG.TEMPLATE_ID_COMPLETED,
                templateParams
            );

            console.log('Completion email sent');
        } catch (error) {
            console.error('Failed to send email:', error);
        }
    },

    // Track swap
    async trackSwap() {
        const swapId = document.getElementById('trackSwapId').value.trim();

        if (!swapId) {
            this.showToast('Please enter an exchange ID', 'error');
            return;
        }

        try {
            const doc = await FirebaseDB.db.collection(FirebaseDB.Collections.SWAPS).doc(swapId).get();

            if (!doc.exists) {
                document.getElementById('trackResult').innerHTML = `
                    <div class="alert-info" style="margin-top: 1.5rem; background: rgba(252, 129, 129, 0.1); border-color: var(--danger);">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="var(--danger)">
                            <path d="M10 0C4.48 0 0 4.48 0 10s4.48 10 10 10 10-4.48 10-10S15.52 0 10 0zm1 15H9v-2h2v2zm0-4H9V5h2v6z"/>
                        </svg>
                        <div><strong>Exchange not found</strong><p>Please check your exchange ID and try again.</p></div>
                    </div>
                `;
                return;
            }

            const swap = doc.data();
            const statusColors = {
                pending: 'var(--warning)',
                deposited: 'var(--primary)',
                processing: 'var(--primary)',
                completed: 'var(--success)',
                failed: 'var(--danger)'
            };

            document.getElementById('trackResult').innerHTML = `
                <div class="swap-summary" style="margin-top: 1.5rem;">
                    <h4>Exchange Status</h4>
                    <div class="summary-row">
                        <span>Exchange ID</span>
                        <strong>${swap.id}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Status</span>
                        <strong style="color: ${statusColors[swap.status]}">${swap.status.toUpperCase()}</strong>
                    </div>
                    <div class="summary-row">
                        <span>From → To</span>
                        <strong>${swap.fromCurrency} → ${swap.toCurrency}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Send Amount</span>
                        <strong>${swap.sendAmount} ${swap.fromCurrency}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Receive Amount</span>
                        <strong>${swap.receiveAmount.toFixed(8)} ${swap.toCurrency}</strong>
                    </div>
                    <div class="summary-row">
                        <span>Created</span>
                        <strong>${new Date(swap.createdAt.seconds * 1000).toLocaleString()}</strong>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error tracking swap:', error);
            this.showToast('Failed to track exchange', 'error');
        }
    },

    // Currency selection
    openCurrencyModal(type) {
        this.currencySelectionType = type;
        this.renderCurrencyList();
        const modal = document.getElementById('currencyModal');
        const overlay = document.getElementById('modalOverlay');
        
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('currencySearch').value = '';
            document.getElementById('currencySearch').focus();
            
            // Close modal when clicking overlay
            if (overlay) {
                overlay.onclick = () => this.closeCurrencyModal();
            }
        }
    },

    closeCurrencyModal() {
        const modal = document.getElementById('currencyModal');
        const overlay = document.getElementById('modalOverlay');
        if (modal) {
            modal.style.display = 'none';
        }
    },

    renderCurrencyList(filter = '') {
        const currencies = CONFIG.CRYPTOCURRENCIES.filter(c =>
            c.name.toLowerCase().includes(filter.toLowerCase()) ||
            c.symbol.toLowerCase().includes(filter.toLowerCase())
        );

        const html = currencies.map(currency => `
            <div class="currency-item" onclick="App.selectCurrency('${currency.symbol}')">
                <img src="https://cryptologos.cc/logos/${currency.name.toLowerCase().replace(/\s+/g, '-')}-${currency.symbol.toLowerCase()}-logo.png" 
                     alt="${currency.symbol}"
                     onerror="this.src='https://via.placeholder.com/36/667eea/ffffff?text=${currency.symbol}'">
                <div class="currency-info">
                    <h4>${currency.symbol}</h4>
                    <p>${currency.name}</p>
                </div>
            </div>
        `).join('');

        document.getElementById('currencyList').innerHTML = html;
    },

    filterCurrencies(filter) {
        this.renderCurrencyList(filter);
    },

    selectCurrency(symbol) {
        const currency = CONFIG.CRYPTOCURRENCIES.find(c => c.symbol === symbol);

        if (this.currencySelectionType === 'send') {
            this.selectedSendCurrency = currency;
            this.updateCurrencyDisplay('send');
        } else {
            this.selectedReceiveCurrency = currency;
            this.updateCurrencyDisplay('receive');
        }

        this.closeCurrencyModal();

        // Recalculate if amount is entered
        if (this.sendAmount > 0) {
            this.calculateReceiveAmount();
            this.validateStep1();
        }
    },

    updateCurrencyDisplay(type) {
        const currency = type === 'send' ? this.selectedSendCurrency : this.selectedReceiveCurrency;
        const prefix = type === 'send' ? 'send' : 'receive';

        document.getElementById(`${prefix}CurrencyName`).textContent = currency.symbol;
        document.getElementById(`${prefix}CurrencyIcon`).src = 
            `https://cryptologos.cc/logos/${currency.name.toLowerCase().replace(/\s+/g, '-')}-${currency.symbol.toLowerCase()}-logo.png`;
        document.getElementById(`${prefix}CurrencyIcon`).onerror = function() {
            this.src = `https://via.placeholder.com/32/667eea/ffffff?text=${currency.symbol}`;
        };
    },

    swapCurrencies() {
        const temp = this.selectedSendCurrency;
        this.selectedSendCurrency = this.selectedReceiveCurrency;
        this.selectedReceiveCurrency = temp;

        this.updateCurrencyDisplay('send');
        this.updateCurrencyDisplay('receive');

        if (this.sendAmount > 0) {
            this.calculateReceiveAmount();
            this.validateStep1();
        }
    },

    // Utility functions
    generateSwapId() {
        return 'BEX' + Date.now() + Math.random().toString(36).substring(2, 9).toUpperCase();
    },

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="flex: 1;">${message}</div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.5rem;">
                    ×
                </button>
            </div>
        `;

        document.getElementById('toastContainer').appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
};

// Copy to clipboard helper
function copyToClipboard(elementId) {
    const text = document.getElementById(elementId).textContent;
    navigator.clipboard.writeText(text).then(() => {
        App.showToast('Copied to clipboard!', 'success');
    });
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});