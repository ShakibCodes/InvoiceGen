// Invoice Generator Application
class InvoiceGenerator {
    constructor() {
        this.invoices = JSON.parse(localStorage.getItem('invoices')) || [];
        this.currentInvoice = null;
        this.editingIndex = -1;
        
        this.initializeApp();
        this.bindEvents();
        this.updateDashboard();
    }

    initializeApp() {
        // Set initial theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
        
        // Set initial invoice number
        this.setInitialInvoiceNumber();
        
        // Set today's date
        document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
        
        // Calculate initial totals
        this.calculateTotals();
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        
        // Navigation
        document.getElementById('newInvoiceBtn').addEventListener('click', () => this.showInvoiceForm());
        
        // Form events
        document.getElementById('invoiceForm').addEventListener('submit', (e) => this.saveInvoice(e));
        
        // Item calculation events
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('item-quantity') || 
                e.target.classList.contains('item-rate') ||
                e.target.id === 'taxRate' ||
                e.target.id === 'discount') {
                this.calculateTotals();
            }
        });
        
        // Auto-generate invoice number when company name changes
        document.getElementById('companyName').addEventListener('input', () => {
            if (!this.currentInvoice) {
                this.setInitialInvoiceNumber();
            }
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    setInitialInvoiceNumber() {
        const companyName = document.getElementById('companyName').value;
        const prefix = companyName ? companyName.substring(0, 3).toUpperCase() : 'INV';
        const number = String(this.invoices.length + 1).padStart(4, '0');
        const invoiceNumber = `${prefix}-${number}`;
        document.getElementById('invoiceNumber').value = invoiceNumber;
    }

    showDashboard() {
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('invoiceFormContainer').style.display = 'none';
        document.getElementById('invoicePreviewContainer').style.display = 'none';
        this.updateDashboard();
    }

    showInvoiceForm(invoice = null, index = -1) {
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('invoiceFormContainer').style.display = 'block';
        document.getElementById('invoicePreviewContainer').style.display = 'none';
        
        this.currentInvoice = invoice;
        this.editingIndex = index;
        
        if (invoice) {
            document.getElementById('formTitle').textContent = 'Edit Invoice';
            this.populateForm(invoice);
        } else {
            document.getElementById('formTitle').textContent = 'Create New Invoice';
            this.resetForm();
        }
        
        this.calculateTotals();
    }

    resetForm() {
        document.getElementById('invoiceForm').reset();
        this.setInitialInvoiceNumber();
        document.getElementById('invoiceDate').value = new Date().toISOString().split('T')[0];
        
        // Reset items to single row
        const itemsContainer = document.getElementById('itemsContainer');
        itemsContainer.innerHTML = `
            <div class="item-row">
                <div class="form-group">
                    <label>Description *</label>
                    <input type="text" class="item-description" required>
                </div>
                <div class="form-group">
                    <label>Quantity *</label>
                    <input type="number" class="item-quantity" min="1" value="1" required>
                </div>
                <div class="form-group">
                    <label>Rate *</label>
                    <input type="number" class="item-rate" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="text" class="item-amount" readonly>
                </div>
                <button type="button" class="btn-remove" onclick="removeItem(this)" style="display: none;">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
    }

    populateForm(invoice) {
        // Company information
        document.getElementById('companyName').value = invoice.company.name || '';
        document.getElementById('companyEmail').value = invoice.company.email || '';
        document.getElementById('companyPhone').value = invoice.company.phone || '';
        document.getElementById('companyAddress').value = invoice.company.address || '';
        
        // Client information
        document.getElementById('clientName').value = invoice.client.name || '';
        document.getElementById('clientEmail').value = invoice.client.email || '';
        document.getElementById('clientPhone').value = invoice.client.phone || '';
        document.getElementById('clientAddress').value = invoice.client.address || '';
        
        // Invoice details
        document.getElementById('invoiceNumber').value = invoice.invoiceNumber || '';
        document.getElementById('invoiceDate').value = invoice.invoiceDate || '';
        document.getElementById('dueDate').value = invoice.dueDate || '';
        
        // Tax and discount
        document.getElementById('taxRate').value = invoice.taxRate || 0;
        document.getElementById('discount').value = invoice.discount || 0;
        
        // Notes
        document.getElementById('notes').value = invoice.notes || '';
        
        // Items
        this.populateItems(invoice.items || []);
    }

    populateItems(items) {
        const itemsContainer = document.getElementById('itemsContainer');
        itemsContainer.innerHTML = '';
        
        items.forEach((item, index) => {
            const itemRow = this.createItemRow();
            itemRow.querySelector('.item-description').value = item.description || '';
            itemRow.querySelector('.item-quantity').value = item.quantity || 1;
            itemRow.querySelector('.item-rate').value = item.rate || 0;
            itemRow.querySelector('.item-amount').value = this.formatCurrency(item.amount || 0);
            
            if (index > 0) {
                itemRow.querySelector('.btn-remove').style.display = 'flex';
            }
            
            itemsContainer.appendChild(itemRow);
        });
        
        if (items.length === 0) {
            itemsContainer.appendChild(this.createItemRow());
        }
    }

    createItemRow() {
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        itemRow.innerHTML = `
            <div class="form-group">
                <label>Description *</label>
                <input type="text" class="item-description" required>
            </div>
            <div class="form-group">
                <label>Quantity *</label>
                <input type="number" class="item-quantity" min="1" value="1" required>
            </div>
            <div class="form-group">
                <label>Rate *</label>
                <input type="number" class="item-rate" min="0" step="0.01" required>
            </div>
            <div class="form-group">
                <label>Amount</label>
                <input type="text" class="item-amount" readonly>
            </div>
            <button type="button" class="btn-remove" onclick="removeItem(this)" style="display: none;">
                <i class="fas fa-trash"></i>
            </button>
        `;
        return itemRow;
    }

    addItem() {
        const itemsContainer = document.getElementById('itemsContainer');
        const itemRow = this.createItemRow();
        
        // Show remove button for all items except the first one
        const itemRows = itemsContainer.querySelectorAll('.item-row');
        if (itemRows.length > 0) {
            itemRow.querySelector('.btn-remove').style.display = 'flex';
            // Also show remove button for existing items
            itemRows.forEach(row => {
                row.querySelector('.btn-remove').style.display = 'flex';
            });
        }
        
        itemsContainer.appendChild(itemRow);
        
        // Focus on the new item's description field
        itemRow.querySelector('.item-description').focus();
    }

    removeItem(button) {
        const itemRow = button.closest('.item-row');
        const itemsContainer = document.getElementById('itemsContainer');
        
        itemRow.remove();
        
        // Hide remove button if only one item remains
        const remainingItems = itemsContainer.querySelectorAll('.item-row');
        if (remainingItems.length === 1) {
            remainingItems[0].querySelector('.btn-remove').style.display = 'none';
        }
        
        this.calculateTotals();
    }

    calculateTotals() {
        const itemRows = document.querySelectorAll('.item-row');
        let subtotal = 0;
        
        itemRows.forEach(row => {
            const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
            const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
            const amount = quantity * rate;
            
            row.querySelector('.item-amount').value = this.formatCurrency(amount);
            subtotal += amount;
        });
        
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        const discount = parseFloat(document.getElementById('discount').value) || 0;
        
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount - discount;
        
        document.getElementById('subtotal').textContent = this.formatCurrency(subtotal);
        document.getElementById('taxAmount').textContent = this.formatCurrency(taxAmount);
        document.getElementById('discountAmount').textContent = this.formatCurrency(discount);
        document.getElementById('finalTotal').textContent = this.formatCurrency(total);
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    saveInvoice(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }
        
        const invoiceData = this.collectFormData();
        
        if (this.editingIndex >= 0) {
            this.invoices[this.editingIndex] = invoiceData;
            this.showToast('Invoice updated successfully!', 'success');
        } else {
            this.invoices.push(invoiceData);
            this.showToast('Invoice saved successfully!', 'success');
        }
        
        localStorage.setItem('invoices', JSON.stringify(this.invoices));
        this.showDashboard();
    }

    validateForm() {
        const requiredFields = [
            'companyName', 'companyEmail', 'clientName', 
            'invoiceNumber', 'invoiceDate'
        ];
        
        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                field.focus();
                this.showToast(`Please fill in the ${field.previousElementSibling.textContent}`, 'error');
                return false;
            }
        }
        
        // Validate items
        const itemRows = document.querySelectorAll('.item-row');
        for (const row of itemRows) {
            const description = row.querySelector('.item-description').value.trim();
            const quantity = row.querySelector('.item-quantity').value;
            const rate = row.querySelector('.item-rate').value;
            
            if (!description || !quantity || !rate) {
                row.querySelector('.item-description').focus();
                this.showToast('Please fill in all item details', 'error');
                return false;
            }
        }
        
        return true;
    }

    collectFormData() {
        const itemRows = document.querySelectorAll('.item-row');
        const items = Array.from(itemRows).map(row => ({
            description: row.querySelector('.item-description').value.trim(),
            quantity: parseFloat(row.querySelector('.item-quantity').value),
            rate: parseFloat(row.querySelector('.item-rate').value),
            amount: parseFloat(row.querySelector('.item-quantity').value) * parseFloat(row.querySelector('.item-rate').value)
        }));
        
        const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
        const taxRate = parseFloat(document.getElementById('taxRate').value) || 0;
        const discount = parseFloat(document.getElementById('discount').value) || 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount - discount;
        
        return {
            id: this.currentInvoice?.id || Date.now().toString(),
            company: {
                name: document.getElementById('companyName').value.trim(),
                email: document.getElementById('companyEmail').value.trim(),
                phone: document.getElementById('companyPhone').value.trim(),
                address: document.getElementById('companyAddress').value.trim()
            },
            client: {
                name: document.getElementById('clientName').value.trim(),
                email: document.getElementById('clientEmail').value.trim(),
                phone: document.getElementById('clientPhone').value.trim(),
                address: document.getElementById('clientAddress').value.trim()
            },
            invoiceNumber: document.getElementById('invoiceNumber').value.trim(),
            invoiceDate: document.getElementById('invoiceDate').value,
            dueDate: document.getElementById('dueDate').value,
            items: items,
            subtotal: subtotal,
            taxRate: taxRate,
            taxAmount: taxAmount,
            discount: discount,
            total: total,
            notes: document.getElementById('notes').value.trim(),
            createdAt: this.currentInvoice?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    previewInvoice() {
        if (!this.validateForm()) {
            return;
        }
        
        const invoiceData = this.collectFormData();
        this.generatePreview(invoiceData);
        
        document.getElementById('invoiceFormContainer').style.display = 'none';
        document.getElementById('invoicePreviewContainer').style.display = 'block';
    }

    generatePreview(invoice) {
        const previewContainer = document.getElementById('invoicePreview');
        
        const itemsHtml = invoice.items.map(item => `
            <tr>
                <td>${item.description}</td>
                <td>${item.quantity}</td>
                <td>${this.formatCurrency(item.rate)}</td>
                <td>${this.formatCurrency(item.amount)}</td>
            </tr>
        `).join('');
        
        previewContainer.innerHTML = `
            <div class="invoice-header">
                <div>
                    <h1 class="invoice-title">INVOICE</h1>
                </div>
                <div class="invoice-details">
                    <div><strong>Invoice #:</strong> ${invoice.invoiceNumber}</div>
                    <div><strong>Date:</strong> ${this.formatDate(invoice.invoiceDate)}</div>
                    ${invoice.dueDate ? `<div><strong>Due Date:</strong> ${this.formatDate(invoice.dueDate)}</div>` : ''}
                </div>
            </div>
            
            <div class="invoice-parties">
                <div class="party-info">
                    <h4>From:</h4>
                    <p><strong>${invoice.company.name}</strong></p>
                    ${invoice.company.email ? `<p>${invoice.company.email}</p>` : ''}
                    ${invoice.company.phone ? `<p>${invoice.company.phone}</p>` : ''}
                    ${invoice.company.address ? `<p>${invoice.company.address.replace(/\n/g, '<br>')}</p>` : ''}
                </div>
                <div class="party-info">
                    <h4>To:</h4>
                    <p><strong>${invoice.client.name}</strong></p>
                    ${invoice.client.email ? `<p>${invoice.client.email}</p>` : ''}
                    ${invoice.client.phone ? `<p>${invoice.client.phone}</p>` : ''}
                    ${invoice.client.address ? `<p>${invoice.client.address.replace(/\n/g, '<br>')}</p>` : ''}
                </div>
            </div>
            
            <div class="invoice-items">
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Qty</th>
                            <th>Rate</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>
            
            <div class="invoice-totals">
                <table class="totals-table">
                    <tr>
                        <td>Subtotal:</td>
                        <td>${this.formatCurrency(invoice.subtotal)}</td>
                    </tr>
                    ${invoice.taxRate > 0 ? `
                        <tr>
                            <td>Tax (${invoice.taxRate}%):</td>
                            <td>${this.formatCurrency(invoice.taxAmount)}</td>
                        </tr>
                    ` : ''}
                    ${invoice.discount > 0 ? `
                        <tr>
                            <td>Discount:</td>
                            <td>-${this.formatCurrency(invoice.discount)}</td>
                        </tr>
                    ` : ''}
                    <tr>
                        <td><strong>Total:</strong></td>
                        <td><strong>${this.formatCurrency(invoice.total)}</strong></td>
                    </tr>
                </table>
            </div>
            
            ${invoice.notes ? `
                <div class="invoice-notes">
                    <h4>Notes:</h4>
                    <p>${invoice.notes.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}
        `;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    closePreview() {
        document.getElementById('invoicePreviewContainer').style.display = 'none';
        document.getElementById('invoiceFormContainer').style.display = 'block';
    }

    saveFromPreview() {
        document.getElementById('invoiceForm').dispatchEvent(new Event('submit'));
    }

    downloadPDF() {
        this.showLoading();
        
        // Simulate PDF generation delay
        setTimeout(() => {
            const invoiceData = this.collectFormData();
            this.generatePDFContent(invoiceData);
            this.hideLoading();
            this.showToast('PDF downloaded successfully!', 'success');
        }, 1500);
    }

    generatePDFContent(invoice) {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        const previewContent = document.getElementById('invoicePreview').innerHTML;
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoice.invoiceNumber}</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #000;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .invoice-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 2rem;
                        padding-bottom: 1rem;
                        border-bottom: 2px solid #e5e7eb;
                    }
                    .invoice-title {
                        font-size: 2.5rem;
                        font-weight: 700;
                        color: #3b82f6;
                        margin: 0;
                    }
                    .invoice-details div {
                        margin-bottom: 0.25rem;
                    }
                    .invoice-parties {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 2rem;
                        margin-bottom: 2rem;
                    }
                    .party-info h4 {
                        font-weight: 700;
                        margin-bottom: 0.5rem;
                        color: #374151;
                    }
                    .party-info p {
                        margin-bottom: 0.25rem;
                        color: #6b7280;
                    }
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 1rem;
                    }
                    .items-table th,
                    .items-table td {
                        padding: 0.75rem;
                        text-align: left;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    .items-table th {
                        background-color: #f9fafb;
                        font-weight: 600;
                        color: #374151;
                    }
                    .items-table td:last-child,
                    .items-table th:last-child {
                        text-align: right;
                    }
                    .invoice-totals {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 2rem;
                    }
                    .totals-table {
                        min-width: 300px;
                    }
                    .totals-table tr:last-child {
                        font-weight: 700;
                        font-size: 1.125rem;
                        border-top: 2px solid #e5e7eb;
                    }
                    .totals-table td {
                        padding: 0.5rem 0;
                    }
                    .totals-table td:last-child {
                        text-align: right;
                    }
                    .invoice-notes {
                        margin-top: 2rem;
                        padding-top: 1rem;
                        border-top: 1px solid #e5e7eb;
                    }
                    .invoice-notes h4 {
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                        color: #374151;
                    }
                    .invoice-notes p {
                        color: #6b7280;
                        line-height: 1.6;
                    }
                    @media print {
                        body { margin: 0; padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${previewContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Trigger print dialog
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    }

    updateDashboard() {
        const totalInvoices = this.invoices.length;
        const totalAmount = this.invoices.reduce((sum, invoice) => sum + invoice.total, 0);
        
        document.getElementById('totalInvoices').textContent = totalInvoices;
        document.getElementById('totalAmount').textContent = this.formatCurrency(totalAmount);
        
        this.renderInvoicesGrid();
    }

    renderInvoicesGrid() {
        const grid = document.getElementById('invoicesGrid');
        
        if (this.invoices.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-invoice"></i>
                    <h3>No invoices yet</h3>
                    <p>Create your first invoice to get started</p>
                    <button class="btn btn-primary" onclick="app.showInvoiceForm()">
                        <i class="fas fa-plus"></i>
                        Create Invoice
                    </button>
                </div>
            `;
            return;
        }
        
        const invoicesHtml = this.invoices.map((invoice, index) => `
            <div class="invoice-card" onclick="app.viewInvoice(${index})">
                <div class="invoice-card-header">
                    <div class="invoice-number">${invoice.invoiceNumber}</div>
                    <div class="invoice-date">${this.formatDate(invoice.invoiceDate)}</div>
                </div>
                <div class="invoice-client">${invoice.client.name}</div>
                <div class="invoice-amount">${this.formatCurrency(invoice.total)}</div>
                <div class="invoice-actions" onclick="event.stopPropagation()">
                    <button class="btn btn-outline" onclick="app.editInvoice(${index})">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-outline" onclick="app.duplicateInvoice(${index})">
                        <i class="fas fa-copy"></i>
                        Duplicate
                    </button>
                    <button class="btn btn-outline" onclick="app.deleteInvoice(${index})">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
        
        grid.innerHTML = invoicesHtml;
    }

    viewInvoice(index) {
        const invoice = this.invoices[index];
        this.generatePreview(invoice);
        
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('invoicePreviewContainer').style.display = 'block';
        
        // Update preview actions for view mode
        const previewActions = document.querySelector('.preview-actions');
        previewActions.innerHTML = `
            <button class="btn btn-secondary" onclick="app.showDashboard()">
                <i class="fas fa-arrow-left"></i>
                Back to Dashboard
            </button>
            <button class="btn btn-outline" onclick="app.downloadPDF()">
                <i class="fas fa-download"></i>
                Download PDF
            </button>
            <button class="btn btn-primary" onclick="app.editInvoice(${index})">
                <i class="fas fa-edit"></i>
                Edit Invoice
            </button>
        `;
    }

    editInvoice(index) {
        const invoice = this.invoices[index];
        this.showInvoiceForm(invoice, index);
    }

    duplicateInvoice(index) {
        const invoice = { ...this.invoices[index] };
        invoice.id = Date.now().toString();
        invoice.invoiceNumber = this.generateNewInvoiceNumber(invoice.company.name);
        invoice.invoiceDate = new Date().toISOString().split('T')[0];
        invoice.dueDate = '';
        invoice.createdAt = new Date().toISOString();
        invoice.updatedAt = new Date().toISOString();
        
        this.invoices.push(invoice);
        localStorage.setItem('invoices', JSON.stringify(this.invoices));
        this.updateDashboard();
        this.showToast('Invoice duplicated successfully!', 'success');
    }

    generateNewInvoiceNumber(companyName) {
        const prefix = companyName ? companyName.substring(0, 3).toUpperCase() : 'INV';
        const number = String(this.invoices.length + 1).padStart(4, '0');
        return `${prefix}-${number}`;
    }

    deleteInvoice(index) {
        if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            this.invoices.splice(index, 1);
            localStorage.setItem('invoices', JSON.stringify(this.invoices));
            this.updateDashboard();
            this.showToast('Invoice deleted successfully!', 'success');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                    type === 'error' ? 'fa-exclamation-circle' : 
                    'fa-exclamation-triangle';
        
        toast.innerHTML = `
            <i class="fas ${icon} toast-icon"></i>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.getElementById('toastContainer').appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    showLoading() {
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Global functions for HTML onclick handlers
function showDashboard() {
    app.showDashboard();
}

function showInvoiceForm() {
    app.showInvoiceForm();
}

function addItem() {
    app.addItem();
}

function removeItem(button) {
    app.removeItem(button);
}

function previewInvoice() {
    app.previewInvoice();
}

function closePreview() {
    app.closePreview();
}

function saveFromPreview() {
    app.saveFromPreview();
}

function downloadPDF() {
    app.downloadPDF();
}

// Initialize the application
const app = new InvoiceGenerator();

// Service Worker for offline functionality (optional enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}