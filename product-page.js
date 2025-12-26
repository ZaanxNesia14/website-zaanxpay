document.addEventListener('DOMContentLoaded', function() {
    // Fungsi ini akan dipanggil oleh setiap halaman produk
    window.initializeProductPage = function(config) {
        // --- PENGATURAN ---
        const {
            namaGame,
            nomorWhatsApp,
            paymentTimeLimit,
            discountPercentage,
            validPromoCodes,
            expiredPromoCodes,
            userInputFields
        } = config;

        // --- Selektor DOM ---
        const priceOptionsContainer = document.getElementById('priceOptions');
        const totalPriceDisplay = document.getElementById('totalPrice');
        const selectedPriceInput = document.getElementById('selectedPrice');
        const selectedProductInput = document.getElementById('selectedProduct');
        const whatsappLink = document.getElementById('whatsappLink');
        const summarySection = document.getElementById('summarySection');
        const summaryPriceDisplay = document.getElementById('summaryPrice');
        const proceedBtn = document.getElementById('proceedBtn');
        const promoCodeInput = document.getElementById('promoCode');
        const applyPromoBtn = document.getElementById('applyPromoBtn');
        const timerDisplay = document.getElementById('timer');
        const qrisLimitWarning = document.getElementById('qrisLimitWarning');

        // --- Variabel State ---
        let discountApplied = false;
        let selectedPaymentMethod = null;
        let timerInterval;

        // --- Script untuk Modal ---
        const infoModal = document.getElementById("infoModal");
        const openInfoBtn = document.getElementById("openModalBtn");
        const qrisModal = document.getElementById("qrisModal");
        const confirmationModal = document.getElementById("confirmationModal");
        const notificationModal = document.getElementById("notificationModal");
        const successConfirmationModal = document.getElementById("successConfirmationModal");

        const allModals = [infoModal, qrisModal, confirmationModal, notificationModal, successConfirmationModal];

        // Menutup modal saat tombol close (x) diklik
        allModals.forEach(modal => {
            if (!modal) return;
            const closeBtn = modal.querySelector(".close-button");
            if (closeBtn) {
                closeBtn.onclick = () => modal.style.display = "none";
            }
        });

        // Menutup modal saat tombol OK atau Batal diklik
        const cancelOrderBtn = confirmationModal?.querySelector(".cancel-btn");
        if (cancelOrderBtn) cancelOrderBtn.onclick = () => confirmationModal.style.display = "none";

        const notificationOkBtn = notificationModal?.querySelector(".notification-ok-btn");
        if (notificationOkBtn) notificationOkBtn.onclick = () => notificationModal.style.display = "none";

        const successOkBtn = successConfirmationModal?.querySelector(".notification-ok-btn");
        if (successOkBtn) successOkBtn.onclick = () => successConfirmationModal.style.display = "none";

        // Menutup modal saat mengklik di luar konten modal
        window.onclick = function(event) {
            allModals.forEach(modal => {
                if (event.target == modal) {
                    modal.style.display = "none";
                    if (modal === qrisModal) {
                        clearInterval(timerInterval); // Hentikan timer jika modal QRIS ditutup
                    }
                }
            });
        }

        // --- Script untuk Tombol Kategori Produk (jika ada) ---
        const categoryButtons = document.querySelectorAll('.category-btn');
        if (categoryButtons.length > 0) {
            const allPriceOptions = document.querySelectorAll('.price-option');
            categoryButtons.forEach(button => {
                button.addEventListener('click', function() {
                    categoryButtons.forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    const category = this.dataset.category;

                    allPriceOptions.forEach(option => {
                        option.style.display = option.dataset.category === category ? 'block' : 'none';
                        if (option.dataset.category !== category) {
                            option.classList.remove('selected');
                        }
                    });
                    // Reset pilihan saat ganti kategori
                    selectedPriceInput.value = '';
                    selectedProductInput.value = '';
                    summarySection.style.display = 'none';
                    discountApplied = false;
                    promoCodeInput.value = '';
                });
            });
        }

        // Fungsi untuk menghitung dan memperbarui total di ringkasan
        function updateSummaryPrice() {
            if (!selectedPriceInput.value) {
                summarySection.style.display = 'none';
                return;
            }

            let price = parseInt(selectedPriceInput.value);
            let finalPrice = price;

            // Terapkan diskon jika ada
            if (discountApplied) {
                finalPrice = price - (price * discountPercentage);
            }

            // Terapkan biaya layanan (pajak) jika metode pembayaran dipilih
            let serviceFee = 0;
            if (selectedPaymentMethod === 'qris') {
                // Biaya layanan untuk QRIS (contoh: 0.7% atau biaya tetap)
                serviceFee = finalPrice > 500000 ? 1274 : 274;
            }
            const finalPriceWithFee = finalPrice + serviceFee;

            summaryPriceDisplay.textContent = `Rp ${finalPriceWithFee.toLocaleString('id-ID')}`;
        }

        // --- Logika Utama ---

        // Event listener untuk memilih harga
        priceOptionsContainer.addEventListener('click', function(e) {
            const selectedOption = e.target.closest('.price-option');
            if (!selectedOption) return;

            // Jika produk dinonaktifkan, tampilkan notifikasi dan hentikan proses
            if (selectedOption.classList.contains('disabled')) {
                showNotification('Mohon maaf, stok produk ini sedang kosong!', 'error');
                return;
            }

            document.querySelectorAll('.price-option').forEach(opt => opt.classList.remove('selected'));
            selectedOption.classList.add('selected');

            const price = selectedOption.dataset.price;
            const product = selectedOption.dataset.product;

            selectedPriceInput.value = price;
            selectedProductInput.value = product;

            // Logika untuk menonaktifkan QRIS jika harga > 500k
            const qrisOption = document.querySelector('.payment-method-option[data-payment="qris"]');
            if (qrisOption) {
                if (parseInt(price) > 500000) {
                    if (qrisLimitWarning) qrisLimitWarning.style.display = 'block';
                    qrisOption.classList.add('disabled');
                    qrisOption.title = 'QRIS tidak tersedia untuk nominal di atas Rp 500.000';
                    // Jika QRIS sedang dipilih, batalkan pilihan
                    if (selectedPaymentMethod === 'qris') {
                        qrisOption.classList.remove('selected');
                        selectedPaymentMethod = null;
                    }
                } else {
                    if (qrisLimitWarning) qrisLimitWarning.style.display = 'none';
                    qrisOption.classList.remove('disabled');
                    qrisOption.title = '';
                }
            }

            // Perbarui ringkasan, tampilkan, dan reset promo
            updateSummaryPrice();
            summarySection.style.display = 'block';
            qrisModal.style.display = 'none';
        });

        // Event listener untuk memilih metode pembayaran
        const paymentOptionsContainer = document.getElementById('paymentOptionsContainer');
        if (paymentOptionsContainer) { // Check if element exists
            paymentOptionsContainer.addEventListener('click', function(e) {
                const selectedOption = e.target.closest('.payment-method-option');
                if (!selectedOption || selectedOption.classList.contains('disabled')) return;

                document.querySelectorAll('.payment-method-option').forEach(opt => opt.classList.remove('selected'));
                selectedOption.classList.add('selected');

                selectedPaymentMethod = selectedOption.dataset.payment;

                // Perbarui total pembayaran di ringkasan saat metode pembayaran berubah
                updateSummaryPrice();
            });
        }

        // Fungsi untuk menampilkan notifikasi
        function showNotification(message, type) {
            const notificationMessage = document.getElementById("notificationMessage");
            const notificationIcon = document.getElementById("notificationIcon");
            notificationMessage.textContent = message;
            if (type === 'success') {
                notificationIcon.className = 'fas fa-check-circle notification-icon-success';
                notificationModal.className = 'modal success';
            } else {
                notificationIcon.className = 'fas fa-exclamation-triangle notification-icon-error';
                notificationModal.className = 'modal error';
            }
            notificationModal.style.display = 'block';
        }

        // Event listener untuk tombol terapkan promo
        applyPromoBtn.addEventListener('click', function() {
            const promoCode = promoCodeInput.value.toUpperCase();
            const selectedPrice = parseInt(selectedPriceInput.value);

            if (!selectedPrice) {
                showNotification('Pilih nominal terlebih dahulu!', 'error');
                return;
            }

            if (validPromoCodes.includes(promoCode)) {
                discountApplied = true;
                const discountAmount = selectedPrice * discountPercentage;
                updateSummaryPrice(); // Hitung ulang total dengan diskon
                showNotification('Kode promo berhasil diterapkan!', 'success');
            } else if (expiredPromoCodes.includes(promoCode)) {
                discountApplied = false;
                updateSummaryPrice(); // Hitung ulang total tanpa diskon
                showNotification('Kode promo sudah tidak berlaku!', 'error');
            } else {
                discountApplied = false;
                updateSummaryPrice(); // Hitung ulang total tanpa diskon
                showNotification('Kode promo tidak valid!', 'error');
            }
        });

        // Event listener untuk tombol "Lanjutkan ke Pembayaran"
        proceedBtn.addEventListener('click', function() {
            let userInputs = {};
            let isInputValid = true;
            let confirmationDetailsHTML = `<li>Game: <strong>${namaGame}</strong></li>`;

            if (!selectedPriceInput.value) {
                showNotification('Pilih nominal terlebih dahulu!', 'error');
                return;
            }
            userInputFields.forEach(field => {
                const element = document.getElementById(field.id);
                userInputs[field.id] = element.value;
                // Membuat kolom 'contactInfo' menjadi opsional
                if (field.id !== 'contactInfo' && !element.value) {
                    isInputValid = false;
                }
                // Membuat detail konfirmasi dinamis
                // Hanya tampilkan di konfirmasi jika diisi
                if (element.value) {
                    confirmationDetailsHTML += `<li>${field.label}: <strong>${element.value}</strong></li>`;
                }
            });

            if (!isInputValid) {
                showNotification('Harap isi semua data akun terlebih dahulu!', 'error');
                return;
            }

            if (!selectedPaymentMethod) {
                showNotification('Harap pilih metode pembayaran terlebih dahulu!', 'error');
                return;
            }

            if (selectedPaymentMethod === 'qris' && parseInt(selectedPriceInput.value) > 500000) {
                showNotification('QRIS tidak tersedia untuk nominal di atas Rp 500.000. Silakan pilih metode lain.', 'error');
                return;
            }

            const product = selectedProductInput.value;
            let price = parseInt(selectedPriceInput.value);
            let finalPrice = price;

            const confDiscountRow = document.getElementById('confDiscountRow');
            const confDiscount = document.getElementById('confDiscount');

            if (discountApplied) {
                const discountAmount = price * discountPercentage;
                finalPrice = price - discountAmount;
            } else {
            }

            // Tentukan biaya layanan hanya untuk QRIS
            let serviceFee = 0;
            if (selectedPaymentMethod === 'qris') {
                serviceFee = finalPrice > 500000 ? 1274 : 274;
            }
            const finalPriceWithFee = finalPrice + serviceFee;

            // Mengisi detail ke modal konfirmasi
            document.querySelector('#confirmationModal .confirmation-details').innerHTML = confirmationDetailsHTML +
                `<li>Produk: <strong>${product}</strong></li>` +
                `<li>Metode Pembayaran: <strong>${selectedPaymentMethod.toUpperCase()}</strong></li>` +
                `<li id="confDiscountRow" style="display: ${discountApplied ? 'list-item' : 'none'};">Diskon (${discountPercentage * 100}%): <strong id="confDiscount">- Rp ${(price * discountPercentage).toLocaleString('id-ID')}</strong></li>` +
                (serviceFee > 0 ? `<li>Biaya Layanan: <strong>Rp ${serviceFee.toLocaleString('id-ID')}</strong></li>` : '') +
                `<li>Total Bayar: <strong>Rp ${finalPriceWithFee.toLocaleString('id-ID')}</strong></li>`;

            confirmationModal.style.display = 'block';
        });

        // Event listener untuk tombol konfirmasi final
        const confirmOrderBtn = document.getElementById("confirmOrderBtn");
        confirmOrderBtn.addEventListener('click', function() {
            // --- PENGATURAN NOMOR PEMBAYARAN ---
            // GANTI NOMOR DI BAWAH INI DENGAN NOMOR ANDA
            const paymentNumbers = {
                dana: '085117502007',
                gopay: '082194559519',
                shopeepay: '085117502007'
            };
            confirmationModal.style.display = 'none';

            let price = parseInt(selectedPriceInput.value);
            let finalPrice = price;

            // Recalculate final price with discount if applied
            if (discountApplied) {
                finalPrice = price - (price * discountPercentage);
            }

            let serviceFee = 0;
            if (selectedPaymentMethod === 'qris') {
                serviceFee = finalPrice > 500000 ? 1274 : 274;
            }
            const finalPriceWithFee = finalPrice + serviceFee;

            const paymentModal = document.getElementById('paymentModal');
            const paymentMethodTitle = document.getElementById('paymentMethodTitle'); // Judul
            const totalPriceDisplay = document.getElementById('totalPrice'); // Total harga
            const timerDisplay = document.getElementById('timer'); // Timer

            // Reset tampilan modal
            document.getElementById('qrPayment').style.display = 'none';
            document.getElementById('manualPayment').style.display = 'none';
            document.getElementById('paymentRedirecting').style.display = 'none';

            paymentMethodTitle.textContent = `Pembayaran via ${selectedPaymentMethod.toUpperCase()}`;
            totalPriceDisplay.textContent = `Rp ${finalPriceWithFee.toLocaleString('id-ID')}`;

            if (selectedPaymentMethod === 'qris') {
                // Tampilkan pembayaran QRIS
                document.getElementById('qrPayment').style.display = 'block';
                document.getElementById('paymentQrImg').src = 'images/qris.png'; // Menggunakan gambar QRIS pembayaran
            } else {
                // Tampilkan pembayaran E-Wallet (DANA, GoPay, ShopeePay)
                const manualPaymentSection = document.getElementById('manualPayment');
                const paymentRedirectingSection = document.getElementById('paymentRedirecting');
                manualPaymentSection.style.display = 'none'; // Sembunyikan detail manual dulu
                paymentRedirectingSection.style.display = 'block'; // Tampilkan loading
                
                const targetNumber = paymentNumbers[selectedPaymentMethod];

                // Membuat link untuk membuka aplikasi
                let appUrl = '#';
                if (selectedPaymentMethod === 'dana') {
                    appUrl = `https://link.dana.id/qr/send?phone=${targetNumber}&amount=${finalPriceWithFee}`;
                } else if (selectedPaymentMethod === 'gopay') {
                    appUrl = `gojek://gopay/transfer?phone=${targetNumber}&amount=${finalPriceWithFee}`;
                } else if (selectedPaymentMethod === 'shopeepay') {
                    appUrl = `shopee://shopeepay/transfer/form?phone=${targetNumber}`;
                }

                // Coba buka aplikasi setelah jeda singkat
                setTimeout(() => {
                    if (appUrl !== '#') {
                        window.location.href = appUrl;
                    }
                }, 1000);

                // Fallback: Jika setelah 2.5 detik aplikasi tidak terbuka, tampilkan metode manual
                setTimeout(() => {
                    paymentRedirectingSection.style.display = 'none';
                    manualPaymentSection.style.display = 'block';

                    const paymentNumberEl = document.getElementById('paymentNumber');
                    const copyBtn = document.getElementById('copyNumberBtn');

                    paymentNumberEl.textContent = targetNumber;

                    // Fungsi untuk menyalin nomor
                    copyBtn.onclick = () => {
                        navigator.clipboard.writeText(targetNumber).then(() => {
                            showNotification('Nomor berhasil disalin!', 'success');
                        }, () => {
                            showNotification('Gagal menyalin nomor.', 'error');
                        });
                    };

                }, 2500);

            }

            paymentModal.style.display = 'block';
            startTimer(paymentTimeLimit, timerDisplay);
        });

        // Fungsi untuk memulai timer
        function startTimer(duration, display) {
            clearInterval(timerInterval);
            let timer = duration;
            timerInterval = setInterval(function() {
                let minutes = parseInt(timer / 60, 10);
                let seconds = parseInt(timer % 60, 10);

                minutes = minutes < 10 ? "0" + minutes : minutes;
                seconds = seconds < 10 ? "0" + seconds : seconds;

                display.textContent = minutes + ":" + seconds;

                if (--timer < 0) {
                    clearInterval(timerInterval);
                    display.textContent = "Waktu Habis!";
                    qrisModal.style.display = 'none';
                    showNotification('Waktu pembayaran Anda telah habis. Silakan ulangi pesanan.', 'error');
                }
            }, 1000);
        }

        // Event listener untuk membuat link WhatsApp
        whatsappLink.addEventListener('click', function(e) {
            e.preventDefault(); // Selalu cegah aksi default untuk menampilkan modal dulu

            const product = selectedProductInput.value;
            const price = parseInt(selectedPriceInput.value);
            let finalPrice = price;
            if (discountApplied) {
                finalPrice = price - (price * discountPercentage);
            }
            let serviceFee = 0;
            if (selectedPaymentMethod === 'qris') {
                serviceFee = finalPrice > 500000 ? 1274 : 274;
            }
            const finalPriceWithFee = finalPrice + serviceFee;

            let messageDetails = '';
            userInputFields.forEach(field => {
                const element = document.getElementById(field.id);
                messageDetails += `${field.label}: *${element.value}*\n`;
            });

            const message = `Halo, saya mau konfirmasi pesanan:\n\n` +
                `Game: *${namaGame}*\n` +
                messageDetails +
                `Metode Pembayaran: *${selectedPaymentMethod.toUpperCase()}*\n` +
                `Produk: *${product}*\n` +
                `Total Bayar: *Rp ${finalPriceWithFee.toLocaleString('id-ID')}*\n\n` +
                `Saya sudah melakukan pembayaran. Mohon segera diproses. (Saya akan kirim bukti transfer di chat ini)`;

            const url = `https://api.whatsapp.com/send?phone=${nomorWhatsApp}&text=${encodeURIComponent(message)}`;
            
            // Tampilkan modal sukses
            const paymentModal = document.getElementById('paymentModal');
            if (paymentModal) paymentModal.style.display = 'none'; // Tutup modal pembayaran
            if (successConfirmationModal) successConfirmationModal.style.display = 'block';

            // Arahkan ke WhatsApp setelah modal ditutup atau setelah beberapa detik
            const openWhatsApp = () => window.open(url, '_blank');
            
            if (successOkBtn) {
                successOkBtn.onclick = () => { successConfirmationModal.style.display = 'none'; openWhatsApp(); };
            }
        });

        // --- Preloader Script ---
        window.addEventListener('load', function() {
            const preloader = document.querySelector('.preloader');
            if (preloader) {
                preloader.classList.add('hidden');
            }
        });

        // Return exposed functions for external use
        return {
            updateSummaryPrice: updateSummaryPrice
        };
    };
});