// BitEx Global - Admin Dashboard
const AdminApp = {
    currentView: 'dashboard',
    exchanges: [],
    filteredExchanges: [],
    refreshInterval: null,
    currentEditSwap: null,

    // Initialize admin app
    init() {
        this.setupLoginForm();
    },

    // Setup login form
    setupLoginForm() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });
    },

    // Login
    login() {
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        if (username === CONFIG.ADMIN.USERNAME && password === CONFIG.ADMIN.PASSWORD) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('adminDashboard').style.display = 'block';
            this.setupDashboard();
            this.showToast('Login successful', 'success');
        } else {
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = 'Invalid username or password';
            errorDiv.style.display = 'block';
        }
    },

    // Setup dashboard after login
    setupDashboard() {
        this.setupEventListeners();
        this.loadExchanges();
        this.startAutoRefresh();
    },

    // Setup event listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Refresh
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadExchanges();
        });

        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.filterExchanges({ status: e.target.value });
        });

        // Search
        document.getElementById('searchExchange').addEventListener('input', (e) => {
            this.filterExchanges({ search: e.target.value });
        });

        // Close edit modal
        document.getElementById('closeEditModal').addEventListener('click', () => {
            document.getElementById('editModal').style.display = 'none';
        });
    },

    // Switch views
    switchView(view) {
        this.currentView = view;

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Update views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.toggle('active', v.id === `${view}View`);
        });

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            exchanges: 'All Exchanges'
        };
        document.getElementById('pageTitle').textContent = titles[view] || view;

        // Load view data
        this.loadViewData(view);
    },

    // Load view data
    loadViewData(view) {
        if (view === 'exchanges') {
            this.renderAllExchanges();
        }
    },

    // Load exchanges from Firestore
    async loadExchanges() {
        try {
            const snapshot = await FirebaseDB.db
                .collection(FirebaseDB.Collections.SWAPS)
                .orderBy('createdAt', 'desc')
                .get();

            this.exchanges = [];
            snapshot.forEach(doc => {
                this.exchanges.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.filteredExchanges = [...this.exchanges];
            this.updateDashboard();
            this.renderRecentExchanges();
            this.updateLastUpdated();
        } catch (error) {
            console.error('Error loading exchanges:', error);
            this.showToast('Failed to load exchanges', 'error');
        }
    },

    // Update dashboard statistics
    updateDashboard() {
        const total = this.exchanges.length;
        const pending = this.exchanges.filter(e => 
            e.status === CONFIG.SWAP_STATUS.PENDING || 
            e.status === CONFIG.SWAP_STATUS.DEPOSITED || 
            e.status === CONFIG.SWAP_STATUS.PROCESSING
        ).length;
        const completed = this.exchanges.filter(e => 
            e.status === CONFIG.SWAP_STATUS.COMPLETED
        ).length;

        document.getElementById('totalExchanges').textContent = total;
        document.getElementById('pendingExchanges').textContent = pending;
        document.getElementById('completedExchanges').textContent = completed;
    },

    // Render recent exchanges
    renderRecentExchanges() {
        const recent = this.exchanges.slice(0, 10);

        if (recent.length === 0) {
            document.getElementById('recentExchangesTable').innerHTML = `
                <div class="empty-state">No exchanges yet</div>
            `;
            return;
        }

        const html = `
            <table class="exchange-table">
                <thead>
                    <tr>
                        <th>Exchange ID</th>
                        <th>From → To</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${recent.map(exchange => this.renderExchangeRow(exchange)).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('recentExchangesTable').innerHTML = html;
    },

    // Render all exchanges
    renderAllExchanges() {
        if (this.filteredExchanges.length === 0) {
            document.getElementById('allExchangesTable').innerHTML = `
                <div class="empty-state">No exchanges found</div>
            `;
            return;
        }

        const html = `
            <table class="exchange-table">
                <thead>
                    <tr>
                        <th>Exchange ID</th>
                        <th>From → To</th>
                        <th>Send Amount</th>
                        <th>Receive Amount</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.filteredExchanges.map(exchange => this.renderExchangeRow(exchange, true)).join('')}
                </tbody>
            </table>
        `;

        document.getElementById('allExchangesTable').innerHTML = html;
    },

    // Render exchange row
    renderExchangeRow(exchange, detailed = false) {
        return `
            <tr>
                <td><span class="exchange-id">${exchange.id}</span></td>
                <td>${exchange.fromCurrency} → ${exchange.toCurrency}</td>
                <td>${exchange.sendAmount} ${exchange.fromCurrency}</td>
                ${detailed ? `<td>${exchange.receiveAmount.toFixed(8)} ${exchange.toCurrency}</td>` : ''}
                <td><span class="status-badge ${exchange.status}">${exchange.status.toUpperCase()}</span></td>
                <td>${this.formatDate(exchange.createdAt)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-action" onclick="AdminApp.editExchange('${exchange.id}')">Edit</button>
                    </div>
                </td>
            </tr>
        `;
    },

    // Filter exchanges
    filterExchanges(filters = {}) {
        let filtered = [...this.exchanges];

        // Status filter
        if (filters.status) {
            filtered = filtered.filter(e => e.status === filters.status);
        }

        // Search filter
        if (filters.search) {
            const search = filters.search.toLowerCase();
            filtered = filtered.filter(e =>
                e.id.toLowerCase().includes(search) ||
                e.fromCurrency.toLowerCase().includes(search) ||
                e.toCurrency.toLowerCase().includes(search)
            );
        }

        this.filteredExchanges = filtered;
        this.renderAllExchanges();
    },

    // Edit exchange
    async editExchange(exchangeId) {
        try {
            const doc = await FirebaseDB.db
                .collection(FirebaseDB.Collections.SWAPS)
                .doc(exchangeId)
                .get();

            if (!doc.exists) {
                this.showToast('Exchange not found', 'error');
                return;
            }

            const exchange = { id: doc.id, ...doc.data() };
            this.currentEditSwap = exchange;

            const html = `
                <div class="exchange-details">
                    <div class="detail-group">
                        <label>Exchange ID</label>
                        <div class="detail-value">${exchange.id}</div>
                    </div>
                    <div class="detail-group">
                        <label>Created</label>
                        <div class="detail-value">${this.formatDateTime(exchange.createdAt)}</div>
                    </div>
                    <div class="detail-group">
                        <label>From Currency</label>
                        <div class="detail-value">${exchange.fromCurrency}</div>
                    </div>
                    <div class="detail-group">
                        <label>To Currency</label>
                        <div class="detail-value">${exchange.toCurrency}</div>
                    </div>
                    <div class="detail-group">
                        <label>Send Amount</label>
                        <div class="detail-value">${exchange.sendAmount} ${exchange.fromCurrency}</div>
                    </div>
                    <div class="detail-group">
                        <label>Receive Amount</label>
                        <div class="detail-value">${exchange.receiveAmount.toFixed(8)} ${exchange.toCurrency}</div>
                    </div>
                    <div class="detail-group">
                        <label>Deposit Address</label>
                        <div class="detail-value address">${exchange.depositAddress}</div>
                    </div>
                    <div class="detail-group">
                        <label>Recipient Address</label>
                        <div class="detail-value address">${exchange.recipientAddress}</div>
                    </div>
                    ${exchange.email ? `
                    <div class="detail-group">
                        <label>Email</label>
                        <div class="detail-value">${exchange.email}</div>
                    </div>
                    ` : ''}
                </div>

                <div class="input-group">
                    <label>Update Status</label>
                    <select id="statusSelect" class="status-selector">
                        <option value="pending" ${exchange.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="deposited" ${exchange.status === 'deposited' ? 'selected' : ''}>Deposited</option>
                        <option value="processing" ${exchange.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="completed" ${exchange.status === 'completed' ? 'selected' : ''}>Completed</option>
                        <option value="failed" ${exchange.status === 'failed' ? 'selected' : ''}>Failed</option>
                    </select>
                </div>

                <button class="btn-primary" onclick="AdminApp.updateExchangeStatus()">Update Status</button>
            `;

            document.getElementById('editExchangeContent').innerHTML = html;
            document.getElementById('editModal').style.display = 'flex';
        } catch (error) {
            console.error('Error loading exchange:', error);
            this.showToast('Failed to load exchange details', 'error');
        }
    },

    // Update exchange status
    async updateExchangeStatus() {
        const newStatus = document.getElementById('statusSelect').value;
        const oldStatus = this.currentEditSwap.status;

        if (newStatus === oldStatus) {
            this.showToast('No changes made', 'info');
            return;
        }

        try {
            // Update in Firestore
            await FirebaseDB.db
                .collection(FirebaseDB.Collections.SWAPS)
                .doc(this.currentEditSwap.id)
                .update({
                    status: newStatus,
                    updatedAt: firebase.firestore.Timestamp.now()
                });

            // Send completion email if status changed to completed
            if (newStatus === CONFIG.SWAP_STATUS.COMPLETED && this.currentEditSwap.email) {
                this.sendCompletionEmail(this.currentEditSwap);
            }

            // Close modal
            document.getElementById('editModal').style.display = 'none';

            // Reload exchanges
            await this.loadExchanges();

            this.showToast('Exchange status updated successfully', 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            this.showToast('Failed to update status', 'error');
        }
    },

    // Send completion email
    async sendCompletionEmail(swap) {
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

            console.log('Completion email sent to:', swap.email);
        } catch (error) {
            console.error('Failed to send completion email:', error);
        }
    },

    // Auto-refresh
    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.loadExchanges();
        }, 30000); // Refresh every 30 seconds
    },

    // Update last updated timestamp
    updateLastUpdated() {
        const now = new Date();
        document.getElementById('lastUpdated').textContent = now.toLocaleTimeString();
    },

    // Logout
    logout() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminDashboard').style.display = 'none';
        document.getElementById('adminUsername').value = '';
        document.getElementById('adminPassword').value = '';
        document.getElementById('loginError').style.display = 'none';
        this.showToast('Logged out successfully', 'info');
    },

    // Utility functions
    formatDate(timestamp) {
        if (!timestamp) return '--';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    },

    formatDateTime(timestamp) {
        if (!timestamp) return '--';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
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

// Initialize admin app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init();
});