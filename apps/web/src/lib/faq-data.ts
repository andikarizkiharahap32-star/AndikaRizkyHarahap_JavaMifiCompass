export interface FaqItem {
  id: string;
  category: 'shipping' | 'esim' | 'refund' | 'dining' | 'currency' | 'payment' | string;
  question: string;
  answer: string;
}

export const FALLBACK_FAQS = [
  // 1. SHIPPING & AIRPORT PICKUP (WS10)
  {
    id: 'faq-shipping-airport',
    category: 'shipping',
    questionId:
      'Bagaimana cara mengambil dan mengembalikan modem Pocket WiFi di bandara?',
    questionEn:
      'How do I pick up and return the Pocket WiFi router at the airport?',
    answerId:
      'Modem dapat diambil di booth JavaMifi Bandara Soekarno-Hatta (Terminal 3 Internasional), Bandara Ngurah Rai Bali (DPS), atau Bandara Juanda Surabaya (SUB) 2 jam sebelum jadwal terbang. Untuk pengembalian, Anda cukup memasukkan unit ke Dropbox 24 jam kami di bandara kedatangan tanpa antre.',
    answerEn:
      'You can collect your router at JavaMifi airport booths located at Soekarno-Hatta Terminal 3 International, Bali Ngurah Rai (DPS), or Surabaya Juanda (SUB) 2 hours before flight departure. For returns, simply drop the device into our 24/7 airport dropboxes upon arrival without waiting in line.',
  },
  {
    id: 'faq-shipping-courier',
    category: 'shipping',
    questionId:
      'Apakah modem Pocket WiFi dapat dikirimkan ke alamat rumah atau hotel?',
    questionEn:
      'Can the Pocket WiFi router be delivered to my home or hotel address?',
    answerId:
      'Ya. Kami melayani pengiriman kurir reguler maupun instan (JNE, SiCepat, Gosend) ke seluruh Indonesia. Perangkat dikirim 2 hari sebelum tanggal keberangkatan Anda sehingga tiba tepat waktu sebelum Anda menuju bandara.',
    answerEn:
      'Yes. We support courier delivery across Indonesia with standard and on-demand dispatch (JNE, SiCepat, Gosend). Devices are dispatched 2 days prior to your travel departure date to ensure guaranteed arrival.',
  },
  {
    id: 'faq-shipping-china-vpn',
    category: 'shipping',
    questionId:
      'Apakah modem Pocket WiFi JavaMifi dapat membuka WhatsApp dan Google di China?',
    questionEn:
      'Can JavaMifi Pocket WiFi access Google, WhatsApp, and Instagram in mainland China?',
    answerId:
      'Ya. Seluruh perangkat JavaMifi tujuan China telah dilengkapi modul VPN aktif otomatis tingkat jaringan (network-level bypass). Anda dapat langsung membuka Google Maps, WhatsApp, Instagram, dan email perusahaan tanpa konfigurasi VPN tambahan.',
    answerEn:
      'Yes. All JavaMifi units configured for China include an automated network-level VPN bypass. You can seamlessly access Google Maps, WhatsApp, Instagram, and corporate email without installing third-party VPN applications.',
  },
  {
    id: 'faq-shipping-capacity',
    category: 'shipping',
    questionId:
      'Berapa banyak perangkat yang dapat terhubung ke 1 modem WiFi, dan berapa lama daya tahan baterainya?',
    questionEn:
      'How many devices can connect to one Pocket WiFi router, and what is its battery life?',
    answerId:
      'Satu modem JavaMifi dapat menghubungkan hingga 5 perangkat sekaligus (smartphone, tablet, laptop) dengan daya tahan baterai 12-15 jam pemakaian aktif. Setiap paket sewa sudah termasuk kabel pengisi daya Type-C dan adaptor travel.',
    answerEn:
      'One JavaMifi router supports up to 5 simultaneous devices (smartphones, tablets, laptops) with 12 to 15 hours of active battery life. Each rental kit includes a Type-C fast-charging cable and international travel adapter.',
  },

  // 2. ESIM DIGITAL (WS11)
  {
    id: 'faq-esim-timing',
    category: 'esim',
    questionId:
      'Kapan waktu terbaik untuk memindai (scan) kode QR eSIM JavaMifi?',
    questionEn:
      'When is the best time to scan and install the JavaMifi eSIM QR code?',
    answerId:
      'Kami menyarankan Anda memindai kode QR 1 hari sebelum terbang atau saat menunggu di ruang tunggu bandara dengan koneksi WiFi yang stabil. Setibanya di bandara negara tujuan, cukup aktifkan opsi Data Roaming pada profil eSIM tersebut.',
    answerEn:
      'We recommend scanning the QR code 1 day prior to departure or while waiting at the departure gate with stable WiFi. Upon landing at your destination, simply toggle Data Roaming ON for the designated eSIM profile.',
  },
  {
    id: 'faq-esim-compatibility',
    category: 'esim',
    questionId:
      'Perangkat smartphone apa saja yang kompatibel dengan eSIM JavaMifi?',
    questionEn:
      'Which smartphone models are compatible with JavaMifi eSIM?',
    answerId:
      'eSIM didukung oleh iPhone XS, XR, seri 11 hingga 16, Samsung Galaxy S20 ke atas, Z Flip/Fold, serta Google Pixel 3 ke atas. Pastikan smartphone Anda dalam kondisi carrier-unlocked (tidak terkunci operator tertentu). Anda dapat memeriksa kompatibilitas langsung di fitur eSIM Checker kami.',
    answerEn:
      'eSIM is supported on iPhone XS, XR, iPhone 11 through 16 series, Samsung Galaxy S20 and newer, Z Flip/Fold, and Google Pixel 3 and newer. Ensure your device is carrier-unlocked. You can verify device readiness directly via our built-in eSIM Checker.',
  },
  {
    id: 'faq-esim-reinstall',
    category: 'esim',
    questionId:
      'Bisakah kode QR eSIM dipindai ulang jika saya berganti smartphone atau terhapus?',
    questionEn:
      'Can an eSIM QR code be scanned multiple times or transferred to another device?',
    answerId:
      'Sesuai standar keamanan GSMA, satu kode QR eSIM bersifat sekali pakai (single-use) dan hanya dapat terpasang pada satu perangkat aktif. Jika profil terhapus secara tidak sengaja sebelum keberangkatan, segera hubungi Helpdesk 24/7 kami untuk verifikasi dan penerbitan ulang.',
    answerEn:
      'Under GSMA carrier security standards, each eSIM QR code is single-use and binds to one active smartphone. If your eSIM profile is accidentally deleted prior to travel, contact our 24/7 Helpdesk for identity verification and re-issuance.',
  },
  {
    id: 'faq-esim-voice-call',
    category: 'esim',
    questionId:
      'Apakah paket eSIM menyediakan nomor telepon lokal untuk panggilan suara konvensional?',
    questionEn:
      'Does the eSIM plan include a local phone number for standard cellular voice calls?',
    answerId:
      'Paket eSIM JavaMifi adalah paket data seluler roaming internasional berkecepatan tinggi. Anda tetap dapat menggunakan nomor WhatsApp reguler Anda dan melakukan panggilan suara/video internet melalui WhatsApp, Facetime, Zoom, atau Telegram tanpa gangguan.',
    answerEn:
      'JavaMifi eSIM plans provide high-speed mobile roaming data. You retain your existing WhatsApp phone number and can make voice and video calls seamlessly via WhatsApp, FaceTime, Zoom, or Telegram without interruption.',
  },

  // 3. REFUND & ESCROW (WS12)
  {
    id: 'faq-refund-sla',
    category: 'refund',
    questionId:
      'Berapa lama proses pengembalian deposit jaminan modem Pocket WiFi (Rp 500.000)?',
    questionEn:
      'How long does the Pocket WiFi security deposit refund (Rp 500,000) take?',
    answerId:
      'Deposit jaminan sebesar Rp 500.000 akan otomatis dikembalikan ke rekening bank atau limit kartu kredit Anda dalam 1-3 hari kerja setelah perangkat kami terima dan lolos inspeksi fisik kelengkapan.',
    answerEn:
      'The Rp 500,000 security deposit is automatically refunded to your bank account or credit card balance within 1 to 3 business days once the physical unit is received and cleared by our inspection pipeline.',
  },
  {
    id: 'faq-refund-cancellation',
    category: 'refund',
    questionId:
      'Bagaimana kebijakan pembatalan sewa jika rencana perjalanan saya berubah atau dibatalkan?',
    questionEn:
      'What is the cancellation policy if my travel plans are delayed or cancelled?',
    answerId:
      'Pembatalan yang diajukan minimal 24 jam sebelum tanggal aktivasi atau jadwal pengiriman berhak mendapatkan pengembalian dana 100% penuh tanpa potongan penalti, baik melalui metode pembayaran asal maupun voucher kredit perjalanan.',
    answerEn:
      'Cancellations submitted at least 24 hours prior to the scheduled delivery or activation date qualify for a 100% full refund with zero cancellation penalties, processed to your original payment method or travel credit.',
  },
  {
    id: 'faq-refund-damage',
    category: 'refund',
    questionId:
      'Apa yang terjadi jika perangkat modem mengalami kerusakan fisik atau hilang selama perjalanan?',
    questionEn:
      'What happens if a rental router is damaged or lost during my trip?',
    answerId:
      'Jika Anda memilih opsi Garansi Perlindungan Perangkat saat checkout, Anda sepenuhnya dibebaskan dari biaya penggantian unit. Tanpa garansi, biaya penggantian akan diperhitungkan secara transparan dari deposit escrow tanpa denda tersembunyi.',
    answerEn:
      'If Device Protection Warranty was added during checkout, device replacement fees are 100% covered. Without warranty coverage, verified replacement costs are deducted transparently from the escrow deposit with no hidden surcharges.',
  },

  // 4. DINING & HALAL TRUST (WS13)
  {
    id: 'faq-dining-verification',
    category: 'dining',
    questionId:
      'Bagaimana Compass menentukan sertifikasi halal tempat makan di luar negeri?',
    questionEn:
      'How does Compass verify halal certification for overseas restaurants?',
    answerId:
      'Sistem Compass menggunakan mesin evaluasi bukti 5-tier fail-closed: sertifikat resmi terdaftar (JAKIM, MUIS, JHA), klaim tertulis pemilik, atau opsi halal. Jika bukti tidak cukup kuat, sistem secara aman menandainya sebagai Unverified.',
    answerEn:
      'Compass uses a 5-tier fail-closed halal evaluation engine referencing recognized certifiers (JAKIM, MUIS, JHA, etc.) and owner declarations. Unverified entries fail-closed to protect observant travelers.',
  },
  {
    id: 'faq-dining-tiers',
    category: 'dining',
    questionId:
      'Apa arti 5 tier klasifikasi status halal pada Compass Rasa?',
    questionEn:
      'What do the 5 halal classification tiers mean in Compass Rasa?',
    answerId:
      'Tier 1: Tersertifikasi Halal Resmi oleh badan akreditasi; Tier 2: Dimiliki Muslim (Muslim-Owned); Tier 3: Menyajikan daging halal dan bebas alkohol; Tier 4: Menu bebas babi (Pork-Free / Omission); Tier 5: Belum terverifikasi (Unverified / Fail-Closed).',
    answerEn:
      'Tier 1: Certified Halal by accredited bodies; Tier 2: Muslim-Owned establishment; Tier 3: Serves halal meat in an alcohol-free premise; Tier 4: Pork-free kitchen and ingredients (Omission); Tier 5: Unverified evidence (Fail-Closed default).',
  },
  {
    id: 'faq-dining-ai-safety',
    category: 'dining',
    questionId:
      'Apakah sistem Compass menggunakan prediksi AI atau halusinasi untuk menentukan status halal?',
    questionEn:
      'Does Compass use synthetic AI predictions or unverified data for halal status?',
    answerId:
      'Sama sekali tidak. Prinsip AI Safety kami melarang keras klaim sintetis tanpa audit. Seluruh informasi kuliner wajib memiliki rujukan sertifikat nyata, nomor registrasi, atau laporan inspeksi fisik yang dapat ditinjau langsung di Evidence Drawer.',
    answerEn:
      'Strictly no. Our AI text safety rules forbid generative hallucination on dietary status. All dining venues require concrete certificate numbers, accredited issuer links, or manual photo inspection in the Evidence Drawer.',
  },

  // 5. CURRENCIES & PRICING (WS14)
  {
    id: 'faq-currency-conversion',
    category: 'currency',
    questionId:
      'Bagaimana kurs mata uang dan perkiraan harga kuliner luar negeri dihitung?',
    questionEn:
      'How are currency conversions and foreign dining price estimates calculated?',
    answerId:
      'Sistem menyajikan harga ganda (Dual-Price Display) yang mengonversi mata uang lokal ke Rupiah (IDR) berdasarkan kurs referensi harian European Central Bank (ECB) ditambah estimasi spread kartu bank yang transparan.',
    answerEn:
      'Our Dual-Price Display translates local restaurant prices into Indonesian Rupiah (IDR) using daily midpoint reference rates from the European Central Bank (ECB) alongside transparent indicative card spread margins.',
  },
  {
    id: 'faq-currency-idr-zero-decimal',
    category: 'currency',
    questionId:
      'Mengapa nominal Rupiah (IDR) ditampilkan tanpa nilai desimal (koma)?',
    questionEn:
      'Why are Indonesian Rupiah (IDR) figures displayed without decimal places?',
    answerId:
      'Sesuai standar moneter Bank Indonesia dan ISO 4217, Rupiah adalah mata uang tanpa satuan minor desimal (0-decimal currency). Semua nilai IDR dibulatkan secara deterministik demi kemudahan membaca.',
    answerEn:
      'Under Bank Indonesia standards and ISO 4217 specifications, the Indonesian Rupiah is a zero-decimal currency. All IDR sums are rounded deterministically to whole integers for clear, reliable accounting.',
  },
  {
    id: 'faq-currency-three-decimal',
    category: 'currency',
    questionId:
      'Bagaimana Compass menangani mata uang 3 desimal seperti Dinar Kuwait atau Rial Oman?',
    questionEn:
      'How does Compass handle 3-decimal currencies such as Kuwaiti Dinar or Omani Rial?',
    answerId:
      'Mata uang Timur Tengah (KWD, BHD, OMR, JOD) memiliki 3 angka desimal (1.000 fils). Sistem menampilkannya dengan presisi 3 desimal penuh menggunakan angka tabular (tnum) agar perhitungannya tepat.',
    answerEn:
      'Middle Eastern currencies (KWD, BHD, OMR, JOD) utilize 1,000 sub-units (3 decimals). Compass formats them with full 3-decimal mathematical precision and tabular numerals (tnum) to prevent rounding discrepancies.',
  },

  // 6. MOCK PAYMENT & SANDBOX (WS15)
  {
    id: 'faq-payment-mock-sandbox',
    category: 'payment',
    questionId:
      'Apa itu Mock Payment Gateway dan apakah kartu kredit saya akan terdebit?',
    questionEn:
      'What is the Mock Payment Gateway and will my real card be charged?',
    answerId:
      'Mock Payment Gateway adalah lingkungan simulasi sandbox untuk menguji alur pemesanan secara aman. Tidak ada tagihan uang nyata yang dilakukan ke kartu kredit atau rekening bank Anda selama mode sandbox.',
    answerEn:
      'The Mock Payment Gateway is a safe developer sandbox designed to simulate payment settlement and webhook confirmations. Zero real money is charged to your credit card or bank account.',
  },
  {
    id: 'faq-payment-chit-verification',
    category: 'payment',
    questionId:
      'Bagaimana cara memverifikasi bahwa pembayaran simulasi saya berhasil?',
    questionEn:
      'How can I verify that my simulated transaction was completed successfully?',
    answerId:
      'Setelah simulasi selesai, sistem menerbitkan Audit Chit digital di halaman Trip Hub lengkap dengan Nomor Pesanan unik, rincian biaya deterministik, dan kode QR aktivasi siap pakai.',
    answerEn:
      'Upon checkout completion, the system issues an immutable Audit Chit in the Trip Hub, featuring a unique Order Number, deterministic line items, and immediate QR provisioning.',
  },
];
