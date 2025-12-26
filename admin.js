// --- PENGATURAN ---
const ADMIN_PASSWORD = "adminzaanxpay"; // Ganti dengan password rahasia Anda

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;

    if (path.includes('admin_login.html')) {
        handleLoginPage();
    } else if (path.includes('admin_panel.html')) {
        checkAuth();
        handleAdminPanelPage();
    }
});

function showNotification(message) {
    const modal = document.getElementById("notificationModal");
    const msgElement = document.getElementById("notificationMessage");
    const iconElement = document.getElementById("notificationIcon");
    const okBtn = modal.querySelector(".notification-ok-btn");

    msgElement.textContent = message;
    iconElement.className = 'fas fa-exclamation-triangle notification-icon-error';
    modal.style.display = 'block';

    okBtn.onclick = () => modal.style.display = "none";
    window.onclick = (event) => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
}

function handleLoginPage() {
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', function() {
        const password = document.getElementById('password').value;
        if (password === ADMIN_PASSWORD) {
            sessionStorage.setItem('isAdminAuthenticated', 'true');
            window.location.href = 'admin_panel.html';
        } else {
            showNotification('Password salah!');
        }
    });
}

function checkAuth() {
    if (sessionStorage.getItem('isAdminAuthenticated') !== 'true') {
        window.location.replace('admin_login.html');
    }
}

function handleAdminPanelPage() {
    const receiptForm = document.getElementById('receiptForm');
    const receiptContainer = document.getElementById('receipt-container');
    const downloadBtn = document.getElementById('downloadBtn');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');

    // --- Sidebar Navigation Logic ---
    const navLinks = document.querySelectorAll('.nav-link');
    const viewSections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Remove active class from all links and views
            navLinks.forEach(l => l.classList.remove('active'));
            viewSections.forEach(v => v.classList.remove('active'));

            // Add active class to clicked link and target view
            this.classList.add('active');
            const targetId = this.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // Load saved store info from localStorage
    const storeAddressInput = document.getElementById('storeAddress');
    const storeContactInput = document.getElementById('storeContact');
    const headerColorInput = document.getElementById('headerColor');
    const statusColorInput = document.getElementById('statusColor');

    const paymentMethodSelect = document.getElementById('paymentMethod');
    const priceInput = document.getElementById('price');

    if (localStorage.getItem('storeAddress')) {
        storeAddressInput.value = localStorage.getItem('storeAddress');
    }
    if (localStorage.getItem('storeContact')) {
        storeContactInput.value = localStorage.getItem('storeContact');
    }
    if (localStorage.getItem('headerColor')) {
        headerColorInput.value = localStorage.getItem('headerColor');
    }
    if (localStorage.getItem('statusColor')) {
        statusColorInput.value = localStorage.getItem('statusColor');
    }

    // Save store info to localStorage on input change
    storeAddressInput.addEventListener('input', () => localStorage.setItem('storeAddress', storeAddressInput.value));
    storeContactInput.addEventListener('input', () => localStorage.setItem('storeContact', storeContactInput.value));
    headerColorInput.addEventListener('input', () => localStorage.setItem('headerColor', headerColorInput.value));
    statusColorInput.addEventListener('input', () => localStorage.setItem('statusColor', statusColorInput.value));

    let invoiceNumber = '';

    function generateReceiptHTML(data) {
        const { headerColor, storeAddress, storeContact, invoiceNumber, transactionDate, customerName, customerId, productName, productItem, voucherCode, paymentMethod, price, statusColor } = data;

        const voucherRow = voucherCode 
            ? `<tr><td class="label">Kode Voucher</td><td class="colon">:</td><td class="value">${voucherCode}</td></tr>` 
            : '';

        return `
            <div id="receipt-preview" class="receipt-preview-wrapper">
                <div class="receipt-header">
                    <h2 style="color: ${headerColor};">Struk Pembayaran</h2>
                    <p style="font-size: 0.85em; margin: 5px 0; color: #333;">${storeAddress}</p>
                    <p style="font-size: 0.85em; margin: 0; color: #333;">${storeContact}</p>
                </div>
                <div class="receipt-body">
                    <table>
                        <tr><td class="label">No. Invoice</td><td class="colon">:</td><td class="value">${invoiceNumber}</td></tr>
                        <tr><td class="label">Tanggal</td><td class="colon">:</td><td class="value">${transactionDate}</td></tr>
                        <tr><td class="label">Pelanggan</td><td class="colon">:</td><td class="value">${customerName}</td></tr>
                        <tr><td class="label">ID/Tujuan</td><td class="colon">:</td><td class="value">${customerId}</td></tr>
                        <tr><td class="label">Produk</td><td class="colon">:</td><td class="value">${productName}</td></tr>
                        <tr><td class="label">Item</td><td class="colon">:</td><td class="value">${productItem}</td></tr>
                        ${voucherRow}
                        <tr><td class="label">Pembayaran</td><td class="colon">:</td><td class="value">${paymentMethod}</td></tr>
                        <tr class="total-row">
                            <td class="label">Total</td><td class="colon">:</td><td class="value">Rp ${parseInt(price).toLocaleString('id-ID')}</td>
                        </tr>
                    </table>
                </div>
                <div class="receipt-status" style="color: ${statusColor}; border-color: ${statusColor};">BERHASIL</div>
                <div class="receipt-footer">
                    <p>Terima kasih telah melakukan top up di zaanxpay.<br>Struk ini adalah bukti pembayaran yang sah.</p>
                </div>
            </div>
        `;
    }

    let trafficChartInstance = null;

    function renderTrafficChart() {
        const ctx = document.getElementById('trafficChart');
        if (!ctx) return;

        // Generate data dummy untuk efek "saham" (naik turun)
        const labels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
        const dataPoints = [];
        let currentValue = 20; // Base value

        for (let i = 0; i < labels.length; i++) {
            // Random fluctuation between -15 and +25
            let change = Math.floor(Math.random() * 41) - 15;
            currentValue += change;
            if (currentValue < 5) currentValue = 5; // Minimum floor
            dataPoints.push(currentValue);
        }

        if (trafficChartInstance) {
            trafficChartInstance.destroy();
        }

        trafficChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Traffic',
                    data: dataPoints,
                    borderColor: '#ed8936', // Orange color
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
                        gradient.addColorStop(0, 'rgba(237, 137, 54, 0.5)');
                        gradient.addColorStop(1, 'rgba(237, 137, 54, 0)');
                        return gradient;
                    },
                    borderWidth: 2,
                    tension: 0.4, // Smooth curve
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false, color: '#2d3748' }, ticks: { color: '#a0aec0' } },
                    y: { grid: { color: '#2d3748' }, ticks: { color: '#a0aec0' }, beginAtZero: true }
                },
                interaction: { intersect: false, mode: 'index' }
            }
        });
    }

    function updateDashboard() {
        const history = JSON.parse(localStorage.getItem('receiptHistory') || '[]');
        const now = new Date();
        const todayString = now.toLocaleString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric'
        });

        let todayCount = 0;
        let todayRevenue = 0;
        let todayTraffic = localStorage.getItem('siteTraffic') || '0';

        history.forEach(item => {
            if (item.transactionDate === todayString) {
                todayCount++;
                todayRevenue += parseInt(item.price) || 0;
            }
        });

        const todayCountEl = document.getElementById('todayCount');
        const todayRevenueEl = document.getElementById('todayRevenue');
        const todayTrafficEl = document.getElementById('todayTraffic');

        if (todayCountEl) todayCountEl.textContent = todayCount;
        if (todayRevenueEl) todayRevenueEl.textContent = `Rp ${todayRevenue.toLocaleString('id-ID')}`;
        if (todayTrafficEl) todayTrafficEl.textContent = todayTraffic;

        // Render chart
        renderTrafficChart();
    }

    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('receiptHistory') || '[]');
        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #aaa;">Belum ada riwayat.</p>';
            return;
        }

        historyList.innerHTML = '';
        history.forEach((item) => {
            const div = document.createElement('div');
            div.style.cssText = 'padding: 10px; border-bottom: 1px solid #4a5568; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;';
            div.innerHTML = `
                <div>
                    <div style="font-weight: bold; color: #e2e8f0;">${item.invoiceNumber}</div>
                    <div style="font-size: 0.85em; color: #a0aec0;">${item.customerName} - ${item.productName} (${item.productItem})</div>
                </div>
                <div style="font-size: 0.85em; color: #a0aec0;">${item.transactionDate}</div>
            `;
            div.onmouseover = () => div.style.background = '#2d3748';
            div.onmouseout = () => div.style.background = 'transparent';
            div.addEventListener('click', () => {
                invoiceNumber = item.invoiceNumber;
                receiptContainer.innerHTML = generateReceiptHTML(item);
                downloadBtn.style.display = 'block';
                receiptContainer.scrollIntoView({ behavior: 'smooth' });
            });
            historyList.appendChild(div);
        });
    }

    if (historyList) {
        renderHistory();
        updateDashboard(); // Update dashboard saat load
    }
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => { 
        if(confirm('Hapus semua riwayat?')) { 
            localStorage.removeItem('receiptHistory'); 
            renderHistory(); 
            updateDashboard(); // Update dashboard saat hapus
        } 
    });

    receiptForm.addEventListener('submit', function() {
        const storeAddress = document.getElementById('storeAddress').value;
        const storeContact = document.getElementById('storeContact').value;
        const headerColor = document.getElementById('headerColor').value;
        const statusColor = document.getElementById('statusColor').value;
        const customerName = document.getElementById('customerName').value;
        const customerId = document.getElementById('customerId').value;
        const productName = document.getElementById('productName').value;
        const productItem = document.getElementById('productItem').value;
        const voucherCode = document.getElementById('voucherCode').value; // Ambil kode voucher
        const paymentMethod = document.getElementById('paymentMethod').value;
        const price = document.getElementById('price').value;

        if (!customerName || !customerId || !productName || !productItem || !paymentMethod || !price) {
            alert('Harap isi semua kolom!');
            return;
        }

        // Generate Invoice Number and Date
        const now = new Date();
        invoiceNumber = `ZXP-${now.getTime()}`;
        const transactionDate = now.toLocaleString('id-ID', { // Menghapus informasi waktu
            day: '2-digit', month: 'long', year: 'numeric'
        });

        const receiptData = {
            storeAddress, storeContact, headerColor, statusColor,
            customerName, customerId, productName, productItem, voucherCode, paymentMethod, price,
            invoiceNumber, transactionDate
        };

        const history = JSON.parse(localStorage.getItem('receiptHistory') || '[]');
        history.unshift(receiptData);
        if (history.length > 20) history.pop();
        localStorage.setItem('receiptHistory', JSON.stringify(history));

        receiptContainer.innerHTML = generateReceiptHTML(receiptData);
        downloadBtn.style.display = 'block';
        renderHistory();
        updateDashboard(); // Update dashboard saat struk baru dibuat
    });

    downloadBtn.addEventListener('click', function() {
        const receiptElement = document.getElementById('receipt-preview');

        if (!receiptElement) {
            alert('Buat struk terlebih dahulu!');
            return;
        }

        html2canvas(receiptElement, { scale: 2, backgroundColor: '#ffffff' }).then(canvas => { // Menambahkan background putih
            const imgData = canvas.toDataURL('image/png');
            
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `struk-${invoiceNumber}.png`; // Mengunduh sebagai PNG
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    });
}