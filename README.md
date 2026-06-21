# ⚡ Arch Linux Pro Max - Web Dashboard & Intelligent File Manager

![Arch Linux](https://img.shields.io/badge/Arch_Linux-1793D1?style=for-the-the-badge&logo=arch-linux&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-14.1-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Vercel-Deployable-000000?style=for-the-badge&logo=vercel)

Aplikasi web-based super ringan yang dirancang khusus untuk memonitor, mengontrol, dan mengelola file pada sistem **Arch Linux** lokal Anda secara jarak jauh (remote). Disusun menggunakan prinsip **[UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** (Modern Glassmorphism + Minimalist Swiss Style + OLED Dark Theme).

---

## 🌟 Fitur Utama

### 1. 📊 System Intelligence (Dashboard Bento Box Grid)
* **Real-time Telemetry:** Memantau penggunaan CPU (% dan frekuensi Core), utilisasi RAM (Used/Free/Buffers), dan Kapasitas Partisi Root (`/`).
* **Pacman & AUR OS Info:** Deteksi otomatis jumlah paket terinstal di database Pacman, update yang tersedia (`pacman -Qu`), serta update dari AUR (`yay`/`paru`).
* **One-Click Upgrades:** Menjalankan simulasi / eksekusi `sudo pacman -Syu` langsung dari dashboard dengan live streaming output log.
* **Environment Specs:** Informasi instan tentang Rilis Kernel, Hostname, Uptime, Suhu Hardware, dan Systemd Init.

### 2. 🗂️ Intelligent File Manager (Advanced Edition)
* **Navigasi Path Cepat:** Mendukung breadcrumb dan pengetikan path direktori absolut (misal `/home/arch/.config`).
* **CRUD Operasi Lengkap:** Pembuatan File baru, Folder baru, Ganti Nama (Rename), dan Hapus (Delete).
* **Modifikasi Hak Akses (Chmod):** Modal interaktif untuk mengubah *Octal Permissions* (misal `755`, `644`) secara live (eksekusi `chmod`).
* **Archive & Compression Tool:** Mengompres file atau direktori ke dalam format `.tar.gz` atau `.zip` dalam sekali klik.
* **Dotfiles & Config Editor:** Terintegrasi dengan Code/Text Editor bergaya *Monaco/VSCode Dark* untuk mengedit file konfigurasi dotfiles (`~/.bashrc`, `~/.config/i3/config`, `alacritty.toml`, dsb.) langsung dari browser.

### 3. 🖥️ Systemd Daemon Manager
* Melist seluruh background units/services yang berjalan di Arch Linux Anda.
* Kontrol interaktif untuk **Start**, **Stop**, dan **Restart** service (seperti `docker.service`, `nginx.service`, `sshd.service`).

### 4. ⚡ Process Inspection
* Membaca dan mengurutkan proses berdasarkan konsumsi CPU & RAM tertinggi (`ps -aux`).
* Kemampuan melakukan **Force Kill (SIGKILL -9)** pada proses/PID yang *hang* atau memakan resource berlebih.

---

## 🚀 Arsitektur & Opsi Deployment

Project ini menggunakan **Next.js 14 Fullstack (App Router)** yang sangat fleksibel. Ada 2 cara utama untuk men-deploy dan menggunakan aplikasi ini:

### Opsi A: Remote Deployment (Di Vercel via Secure Tunnel) — *Sangat Direkomendasikan*
Mendeploy UI frontend ke Vercel agar dapat diakses dari manapun via internet tanpa membebani resource komputasi laptop/server Arch Linux Anda.

1. **Deploy ke Vercel:** Hubungkan repositori project ini ke akun Vercel Anda dan klik **Deploy**.
2. **Setup Secure Tunnel di Arch Linux Lokal Anda:** Agar Dashboard di Vercel dapat membaca metrik real-time dan mengontrol Arch Linux di rumah/kantor Anda secara aman tanpa perlu IP Publik, jalankan agen tunnel ringan seperti **Cloudflare Tunnel (`cloudflared`)** atau **Tailscale**:
   ```bash
   # Install Cloudflare Tunnel di Arch Linux Anda
   yay -S cloudflared
   
   # Jalankan tunnel untuk menghubungkan Next.js API ke mesin lokal Anda
   cloudflared tunnel --url http://localhost:3000
   ```
3. Set environment variable `ARCH_REMOTE_AGENT_URL` di Vercel menuju URL tunnel Anda.

### Opsi B: Self-Hosted / Native On-Premise di Arch Linux
Menjalankan aplikasi secara mandiri (self-hosted) di dalam mesin Arch Linux Anda sebagai background *Systemd Service*.

1. **Clone & Build:**
   ```bash
   git clone <repo-url> arch-web-dash
   cd arch-web-dash
   npm install
   npm run build
   ```
2. **Buat Systemd Service (`/etc/systemd/system/arch-dashboard.service`):**
   ```ini
   [Unit]
   Description=Arch Linux Pro Max Web Dashboard
   After=network.target

   [Service]
   Type=simple
   User=arch
   WorkingDirectory=/home/arch/arch-web-dash
   ExecStart=/usr/bin/npm run start
   Restart=on-failure
   Environment=PORT=3000

   [Install]
   WantedBy=multi-user.target
   ```
3. **Aktifkan & Jalankan Daemon:**
   ```bash
   sudo systemctl enable --now arch-dashboard.service
   sudo systemctl status arch-dashboard.service
   ```
4. Buka browser dan akses: `http://localhost:3000` (atau IP Lokal Anda `http://192.168.x.x:3000`).

---

## 🛠️ Pengujian Instant di Lingkungan Non-Arch (Fallback Mode)
Aplikasi ini sudah dilengkapi **Automatic Fallback AI Mock Agent**. Ketika dijalankan di cloud (seperti Vercel atau Container Arena) yang tidak memiliki perintah bawaan `pacman` atau direktori Arch, aplikasi **tidak akan crash**, melainkan secara cerdas beralih ke mode *Simulasi Arch Linux*. Semua interaksi (CRUD, Chmod, Kill PID, Systemd Actions) akan memberikan respons visual yang 100% fungsional dan memukau!

---

## 📜 Lisensi & Atribusi
* Dibuat khusus untuk ekosistem **Arch Linux** dan komunitas *Power Users*.
* Kaidah visual mematuhi ketat standar **[UI/UX Pro Max Skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)** (Swiss Typography, Accessible Aria Target Minimum 44px, Motion Animation 150-300ms, dan Semantic OLED Accents).
