const CSV_QUESTIONS_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQCMoZ_nj28RPV4z3Qmd9dNTAEII72LxNddhYwMAJG1fl1_4_Gd-zEpDLvUyq9XF2K-fqQhlzYQObdb/pub?output=csv"; 
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbycjNRlJ2lfgYpC0PllC-drdOyJUtGdp6lG3Yp8M28jgZTYLP6Xbo31xkXgEz3F_V6sMg/exec";

document.addEventListener('DOMContentLoaded', async () => {
    const wrapper = document.getElementById('questionsWrapper');
    const displayKategori = document.getElementById('displayKategori');

    // 1. TAMPILKAN KATEGORI SECEPATNYA (Agar tidak ngestuck di "Memuat Kategori...")
    const kategoriTerpilih = localStorage.getItem('selectedKategori') || 'Aspirasi';
    if (displayKategori) {
        displayKategori.innerText = `Kategori: ${kategoriTerpilih}`;
    }

    // 2. TAMPILKAN LOADING SPINNER PADA WRAPPER PERTANYAAN
    wrapper.innerHTML = `
        <div style="text-align: center; padding: 40px;">
            <div class="spinner"></div>
            <p style="margin-top: 15px; color: #666;">Sedang menyiapkan sistem...</p>
        </div>`;

    try {
        // 3. CEK STATUS WAKTU DAN NIS KE APPS SCRIPT
        const checkTime = await fetch(SCRIPT_URL);
        const timeStatus = await checkTime.json();

        if (!timeStatus.isOpen) {
            wrapper.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clock" style="font-size: 3rem; color: #ff9f43; margin-bottom: 20px;"></i>
                    <p style="font-size: 1.1rem; font-weight: 600;">${timeStatus.pesan}</p>
                </div>`;
            document.getElementById('submitBtn').style.display = 'none';
            return;
        }

        // 4. AMBIL PERTANYAAN DARI GOOGLE SHEETS
        const response = await fetch(CSV_QUESTIONS_URL);
        const csvText = await response.text();
        const rows = csvText.split(/\r?\n/).filter(row => row.trim() !== "").map(row => row.split(','));
        const headers = rows[0].map(h => h.trim().toLowerCase()); 
        
        const questions = rows.slice(1).map(row => {
            let obj = {};
            row.forEach((cell, i) => { if(headers[i]) obj[headers[i]] = cell.trim(); });
            return obj;
        }).filter(q => q.pernyataan); 

        // 5. RENDER PERTANYAAN KE LAYAR
        if (questions.length === 0) {
            wrapper.innerHTML = `<div class="empty-state"><p>Tidak ada pernyataan ditemukan di Spreadsheet.</p></div>`;
            document.getElementById('submitBtn').style.display = 'none';
        } else {
            renderQuestions(questions);
            document.getElementById('submitBtn').style.display = 'block';
        }

    } catch (e) {
        console.error(e);
        wrapper.innerHTML = `<div class="empty-state"><p>Gagal memuat sistem. Periksa koneksi atau Deployment Apps Script.</p></div>`;
    }
});

function renderQuestions(questions) {
    const wrapper = document.getElementById('questionsWrapper');
    wrapper.innerHTML = "";
    questions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.innerHTML = `
            <span class="question-text">${q.pernyataan}</span> 
            <div class="star-rating">
                <input type="radio" id="star5-${index}" name="rating-${index}" value="5" required><label for="star5-${index}"><i class="fas fa-star"></i></label>
                <input type="radio" id="star4-${index}" name="rating-${index}" value="4"><label for="star4-${index}"><i class="fas fa-star"></i></label>
                <input type="radio" id="star3-${index}" name="rating-${index}" value="3"><label for="star3-${index}"><i class="fas fa-star"></i></label>
                <input type="radio" id="star2-${index}" name="rating-${index}" value="2"><label for="star2-${index}"><i class="fas fa-star"></i></label>
                <input type="radio" id="star1-${index}" name="rating-${index}" value="1"><label for="star1-${index}"><i class="fas fa-star"></i></label>
            </div>
            <textarea class="reason-box" name="reason-${index}" rows="3" placeholder="Berikan alasan (Opsional)"></textarea>
            <input type="hidden" name="question-${index}" value="${q.pernyataan}">`;
        wrapper.appendChild(card);
    });
}

// SUBMIT DATA DENGAN SWEETALERT2 & CEK NIS GANDA
document.getElementById('aspirasiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    
    // Animasi loading tombol
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
    btn.disabled = true;

    const formData = new FormData(e.target);
    const results = [];
    
    let i = 0;
    while(formData.has(`question-${i}`)) {
        results.push({
            pertanyaan: formData.get(`question-${i}`),
            rating: formData.get(`rating-${i}`),
            alasan: formData.get(`reason-${i}`)
        });
        i++;
    }

    const payload = {
        nis: localStorage.getItem('userNIS') || "0000",
        nama: localStorage.getItem('userName') || "Guest",
        kategori: localStorage.getItem('selectedKategori') || "Umum",
        timestamp: new Date().toLocaleString('id-ID'),
        data: results
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const resultText = await response.text();

        if (resultText === "ALREADY_SUBMITTED") {
            Swal.fire({
                icon: 'warning',
                title: 'Akses Ditolak',
                text: 'Maaf, NIS Anda sudah tercatat pernah mengisi aspirasi periode ini.',
                confirmButtonColor: '#6c5ce7',
                confirmButtonText: 'Kembali Ke Beranda'
            }).then(() => {
                window.location.href = 'beranda.html';
            });
        } else {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil Terkirim!',
                text: 'Terima kasih, aspirasi Anda sangat berharga bagi kami.',
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true
            }).then(() => {
                window.location.href = 'beranda.html';
            });
        }
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Waduh...',
            text: 'Terjadi kesalahan saat mengirim. Silakan cek koneksi internet Anda.',
            confirmButtonColor: '#d63031'
        });
        btn.disabled = false;
        btn.innerText = "Kirim Semua Aspirasi";
    }
});