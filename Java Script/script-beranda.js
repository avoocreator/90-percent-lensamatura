const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw3CNH2_ftKqo6p2wYgcVdfnBWvL1QtBFLM-qApdVShMigCGkYjldQizq-LAscYqM4Lbw/exec"; // PASTIKAN URL INI BENAR

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Validasi Login
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userName = localStorage.getItem('userName');
    if (!isLoggedIn) { window.location.href = 'index.html'; return; }
    document.getElementById('welcomeText').innerText = `Selamat Datang, ${userName}`;

    const statsContainer = document.querySelector('.stats-section');
    
    // 2. Tampilkan Skeleton Loading saat mulai ambil data
    statsContainer.innerHTML = `
        <div class="section-title"><h3>Indeks Kepuasan Siswa</h3><p>Sedang mengambil data terbaru...</p></div>
        <div class="charts-grid">
            <div class="skeleton skeleton-card" style="height: 200px; background: #eee; border-radius: 20px;"></div>
            <div class="skeleton skeleton-card" style="height: 200px; background: #eee; border-radius: 20px;"></div>
        </div>`;

    try {
        // 1. Pastikan URL SCRIPT menggunakan yang paling baru
        const NEW_URL = "https://script.google.com/macros/s/AKfycbyfX812ASHlcu5rd-GKLCh23kkR386wqlAsYiBWLDQXRLPsUK4Oay_RvBvwma6fcPkxuA/exec";

        // 2. Ambil data asli
        const response = await fetch(`${NEW_URL}?type=stats`);
        const result = await response.json();
        
        // PERBAIKAN: Karena data sekarang dibungkus dalam { stats: ..., logs: ... }
        // Kita hanya butuh bagian 'stats' untuk dashboard beranda
        const dataUntukRender = result.stats ? result.stats : result;
        
        // 3. Render tampilan
        renderCompactDashboard(dataUntukRender);

    } catch (err) {
        console.error("Error Beranda:", err);
        statsContainer.innerHTML = `<p style="text-align:center; color:red;">Gagal memuat data statistik.</p>`;
    }

    // 5. Slider & Logout
    if (typeof Swiper !== 'undefined') {
        new Swiper(".mySwiper", { loop: true, autoplay: { delay: 5000 } });
    }
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'index.html';
    });
});

function renderCompactDashboard(allStats) {
    const statsContainer = document.querySelector('.stats-section');
    
    // Header Dasar
    statsContainer.innerHTML = `
        <div class="section-title">
            <h3>Indeks Kepuasan Siswa</h3>
            <p>Data rata-rata rating real-time.</p>
        </div>
        <div class="charts-grid" id="main-grid"></div>`;
    
    const mainGrid = document.getElementById('main-grid');

    // empty space
    if (!allStats || Object.keys(allStats).length === 0) {
        mainGrid.innerHTML = `
            <div class="empty-state-card" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: white; border-radius: 24px; border: 2px dashed #e0e0e0;">
                <div style="font-size: 3.5rem; color: #ccc; margin-bottom: 15px;">
                    <i class="fas fa-chart-bar"></i>
                </div>
                <h4 style="color: #555; margin-bottom: 8px;">Belum Ada Data Aspirasi</h4>
                <p style="color: #aaa; font-size: 0.9rem; max-width: 350px; margin: 0 auto;">
                    Data statistik akan muncul di sini setelah siswa mulai mengisi form aspirasi. Jadilah yang pertama!
                </p>
            </div>`;
        return;
    }

    // render data
    for (const kategori in allStats) {
        const card = document.createElement('div');
        card.className = 'chart-card'; //
        
        let questionsHTML = '';
        const pertanyaanData = allStats[kategori];

        for (const teksPertanyaan in pertanyaanData) {
            const d = pertanyaanData[teksPertanyaan];
            const rataRata = (d.totalSkor / d.jumlahSuara).toFixed(1);
            const progressWidth = (rataRata / 5) * 100;

            questionsHTML += `
                <div class="question-row" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f9f9f9;">
                    <span style="font-size: 0.85rem; color: #555; flex: 1; padding-right: 10px;">${teksPertanyaan}</span>
                    <div style="display: flex; align-items: center; gap: 10px; min-width: 120px; justify-content: flex-end;">
                        <div style="width: 70px; height: 6px; background: #eee; border-radius: 10px; overflow: hidden;">
                            <div style="width: ${progressWidth}%; height: 100%; background: linear-gradient(90deg, #6a5acd, #b19cd9);"></div>
                        </div>
                        <span style="font-weight: 700; color: #6a5acd; font-size: 0.9rem;">${rataRata}</span>
                    </div>
                </div>`;
        }

        card.innerHTML = `
            <h4 style="color: #6a5acd; margin-bottom: 15px; border-left: 4px solid #6a5acd; padding-left: 12px; font-size: 1rem;">📂 ${kategori}</h4>
            <div class="questions-list">${questionsHTML}</div>
            <p style="font-size: 0.7rem; color: #bbb; margin-top: 15px; text-align: right;">Update otomatis dari sistem</p>
        `;
        mainGrid.appendChild(card);
    }
}

// bantu navigasi
function goToAspirasi(kategori) {
    localStorage.setItem('selectedKategori', kategori);
    window.location.href = 'aspirasi-form.html';
}