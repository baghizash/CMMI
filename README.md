# Here are your Instructions
untuk aktifkan sistem di lokal komputer

Buka terminal pertama untuk MongoDB</h1>

<h1>Kalau MongoDB sudah terinstall sebagai service, jalankan:
<!-- sudo systemctl start mongod -->

Kalau belum aktif, cek status
<!-- sudo systemctl status mongod -->

<h1>Buka terminal kedua untuk backend</h1>

Masuk ke folder backend:
<!-- cd /home/baghizash/CMMI/CMMI-main/backend-> dikasus saya filenya ada disini -->

Buat virtual environment (kalau belum ada):
<!-- python3 -m venv venv -->
<!-- source venv/bin/activate -->

Install dependency:
<!-- pip install -r requirements.txt -->

Jalankan backend:!!!!!!!
<!-- uvicorn server:app --reload --host 0.0.0.0 --port 8000 -->

<h1>Buka terminal ketiga untuk frontend</h1>

Masuk ke folder frontend:
<!-- cd /home/baghizash/CMMI/CMMI-main/frontend -->

Install dependency kalau belum:
<!-- npm install -->

Jalankan Frontend
<!-- npm start -->

Kalau ingin cek backend sudah jalan Buka browser atau curl:
<!-- http://localhost:8000 -->

Kalau ingin cek frontend Biasanya buka:
<!-- http://localhost:3000 -->

<!-- Catatan penting: -->

<!-- Backend dan frontend harus dijalankan di terminal berbeda. -->
<!-- MongoDB juga harus hidup sebelum backend mulai, karena backend butuh koneksi ke database. -->

