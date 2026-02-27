const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSj8NYqYUwvbamfxPRXKopjolsnfbhGLfP41SLRnE9LRTX1PT5fB4LVjaKaMvzqIZ231IzYXRE4af7y/pub?output=csv";

const loginForm = document.getElementById('loginForm');
const messageDiv = document.getElementById('message');
const loginBtn = document.getElementById('loginBtn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nisInput = document.getElementById('nis').value.trim();
    
    loginBtn.innerText = "Mengecek...";
    loginBtn.disabled = true;
    messageDiv.innerText = "";

    try {
        const response = await fetch(CSV_URL + "&cache_bust=" + Date.now()); // Anti-cache
        const data = await response.text();
        
        const rows = data.split(/\r?\n/).filter(row => row.trim() !== "").map(row => row.split(','));
        const headers = rows[0].map(h => h.trim().toLowerCase()); // Ubah header jadi kecil semua & tanpa spasi
        
        const users = rows.slice(1).map(row => {
            let obj = {};
            row.forEach((cell, i) => {
                if (headers[i]) {
                    obj[headers[i]] = cell ? cell.trim() : "";
                }
            });
            return obj;
        });

        console.log("Header yang terdeteksi:", headers);
        console.log("Data user pertama:", users[0]);

        // Mencari user dengan mengecek kolom yang mengandung kata 'nis'
        const user = users.find(u => {
            // Kita cari key/kolom yang namanya mengandung 'nis'
            const nisKey = Object.keys(u).find(k => k.includes('nis'));
            return String(u[nisKey]) === String(nisInput);
        });

        if (user) {
            // Mencari nama dan role dengan cara yang sama (fleksibel)
            const namaKey = Object.keys(user).find(k => k.includes('nama')) || 'nama';
            const roleKey = Object.keys(user).find(k => k.includes('role')) || 'role';

            messageDiv.className = "message success";
            messageDiv.innerText = `Halo, ${user[namaKey]}! Mengalihkan...`;
            
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('userRole', user[roleKey] || 'responden');
            localStorage.setItem('userName', user[namaKey]);
            localStorage.setItem('userNIS', nisInput);

            setTimeout(() => {
                if (String(user[roleKey]).toLowerCase() === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'beranda.html';
                }
            }, 1500);
            
        } else {
            messageDiv.className = "message error";
            messageDiv.innerText = "NIS tidak terdaftar!";
            loginBtn.innerText = "Masuk";
            loginBtn.disabled = false;
        }

    } catch (error) {
        console.error("Detail Error:", error);
        messageDiv.className = "message error";
        messageDiv.innerText = "Gagal memuat data. Pastikan Sheets sudah di-publish.";
        loginBtn.innerText = "Masuk";
        loginBtn.disabled = false;
    }
});