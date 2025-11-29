# **SvelteKit + Formio Project + Camunda BPMN**

## **Deskripsi Proyek**
Proyek ini menggunakan **SvelteKit** untuk membangun aplikasi web yang cepat dan dinamis, **TailwindCSS** untuk styling yang fleksibel, **Formio** untuk pembuatan formulir dinamis, **Axios** untuk melakukan permintaan HTTP, dan **Camunda** untuk otomatisasi proses bisnis dan alur kerja

Proyek ini dirancang untuk memungkinkan pengguna membuat dan mengelola formulir dinamis dengan antarmuka yang responsif dan modern.

---

## **Fitur Utama**
- **SvelteKit**: Framework modern untuk pengembangan aplikasi web yang cepat.  
- **TailwindCSS**: Framework CSS untuk styling yang efisien dan responsif.  
- **Formio**: Integrasi dengan Form.io untuk formulir dinamis.
- **Camunda**: Platform modern untuk otomatisasi proses bisnis dan alur kerja
- **Axios**: Library HTTP untuk menangani komunikasi API  
- **Responsive Design**: Aplikasi sepenuhnya responsif di semua perangkat.  

---

## **Struktur Proyek**

```plaintext
.
├── src/
│   ├── lib/               # Komponen umum
│   │   └── components     # Folder untuk komponen UI
│   │       ├── AppShell.svelte   # Komponen shell utama aplikasi
│   │       ├── Mobilebar.svelte  # Komponen navbar untuk tampilan mobile
│   │       ├── Navbar.svelte     # Komponen navbar untuk desktop
│   │       └── Sidebar.svelte    # Komponen sidebar untuk navigasi
│   ├── routes/            # Halaman dan routing SvelteKit
│   │   ├── form/          # Folder untuk halaman terkait form
│   │   │   ├── layout.js  # Layout khusus untuk form
│   │   │   ├── page.server.js    # Script server untuk form
│   │   │   └── page.svelte       # Halaman untuk form
│   │   ├── home/          # Folder untuk halaman beranda
│   │   │   └── page.svelte       # Halaman utama beranda
│   │   ├── report/        # Folder untuk halaman laporan
│   │   │   └── page.svelte       # Halaman laporan
│   │   └── task/          # Folder untuk halaman task
│   │       └── page.svelte       # Halaman untuk task
│   ├── styles/            # Styling kustom menggunakan TailwindCSS
│   ├── app.html           # Template HTML utama
├── static/                # Aset statis seperti gambar atau favicon
├── svelte.config.js       # Konfigurasi SvelteKit
├── tailwind.config.js     # Konfigurasi TailwindCSS
├── package.json           # Dependencies dan script npm
└── README.md              # Dokumentasi proyek
```

---

## **Instalasi**

### **Persyaratan Sistem**
- **Node.js** >= 16.x  
- **npm** atau **pnpm**

### **Langkah Instalasi**

1. Clone repositori ini:  
   ```bash
   git clone https://github.com/username/nama-proyek.git
   cd nama-proyek
   ```

2. Install dependencies:  
   ```bash
   npm install
   ```

3. Jalankan server pengembangan:  
   ```bash
   npm run dev
   ```

4. Buka aplikasi di browser pada `http://localhost:5173`.
5. (Optional) Jika Install depedencies gagal / nodejs beda:
   ```bash
   npm install --force
   ```
---
## **Configurasi Endpoint**

### **Buat file (.env) di dalam proyek root anda**
Tambahkan `VITE_API_URL` ke dalam proyek Anda:  
```javascript
VITE_API_URL="http://localhost:5000 (untuk default Backend anda)"
```
Tambahkan `VITE_CAMUNDA_URL` ke dalam proyek Anda:  
```javascript
VITE_CAMUNDA_URL="http://localhost:8080/engine-rest/ (untuk default Camunda anda)"
```
---

## **Konfigurasi TailwindCSS**
Konfigurasi `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./src/**/*.{html,svelte,js,ts}", // Pastikan ini sesuai dengan struktur proyek Anda
  ],
  theme: {
    extend: {
      colors: {
        myPrimary: "#002962", // Warna utama
        secondary: "#EFEFEF", // Warna sekunder
        third: "#FFFFFF", // Warna ketiga
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"], // Font default
        heading: ["Roboto", "sans-serif"], // Font untuk heading
      },
    },
  },
  plugins: [],
};

```
---

## **Menggunakan Formio**

### **Instalasi Formio**
Tambahkan `formiojs` ke dalam proyek Anda:  
```bash
npm install formiojs --save
```
---

## **Script NPM**

| Script            | Deskripsi                                |
|--------------------|------------------------------------------|
| `npm run dev`     | Menjalankan server pengembangan          |
| `npm run build`   | Build aplikasi untuk produksi            |
| `npm run preview` | Menjalankan aplikasi produksi secara lokal |

---

## **Kontribusi**
1. Fork repositori ini.  
2. Buat branch fitur baru:  
   ```bash
   git checkout -b nama-fitur
   ```
3. Commit perubahan Anda:  
   ```bash
   git commit -m "Menambahkan fitur baru"
   ```
4. Push branch Anda:  
   ```bash
   git push origin nama-fitur
   ```
5. Buat Pull Request.  

---

## **Lisensi**
Proyek ini dilisensikan di bawah [MIT License](LICENSE).

---

## **Kontak**
Jika Anda memiliki pertanyaan atau saran, silakan hubungi:  
- **Email**: realmadrid300504@gmail.com  
- **GitHub**: [username](https://github.com/RealMadridHaikalPutra)

