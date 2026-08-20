// =============================================================
//  CONFIG.JS — Cấu hình hiển thị của ứng dụng
//  Diễn đàn Nhân dân tham gia góp ý xây dựng lực lượng CAND phường
//
//  ⚠️ Link Google Apps Script (WEBAPP_URL) và hash mật khẩu điều khiển
//  (ADMIN_PASSWORD_HASH) KHÔNG còn nằm ở đây nữa — vì file này chạy
//  ở trình duyệt nên ai xem "View Page Source" cũng đọc được.
//
//  Hai giá trị đó giờ được cấu hình trong Vercel:
//    Project → Settings → Environment Variables
//      GOOGLE_SHEET_WEBAPP_URL = https://script.google.com/macros/s/xxx/exec
//      ADMIN_PASSWORD_HASH     = <SHA-256 của mật khẩu điều khiển>
//  Tạo hash tại: https://emn178.github.io/online-tools/sha256.html
//  Sau khi thêm/sửa biến môi trường → bấm Redeploy trên Vercel.
//
//  Toàn bộ ứng dụng giờ gọi qua /api/proxy (xem api/proxy.js) thay vì
//  gọi thẳng WEBAPP_URL, nên WEBAPP_URL không bao giờ lộ ra client.
// =============================================================

const APP_CONFIG = {

    // ----------------------------------------------------------
    //  1. ĐƯỜNG DẪN API NỘI BỘ (proxy trên Vercel)
    //     KHÔNG sửa dòng này — đây là API route của chính app,
    //     không phải link Google Script.
    // ----------------------------------------------------------
    WEBAPP_URL: '/api/proxy',

    // ----------------------------------------------------------
    //  2. LIÊN KẾT ĐIỀU HƯỚNG
    // ----------------------------------------------------------
    HOME_URL: 'index.html',          // Trang chủ (Về trang chủ / bottom nav)

    // ----------------------------------------------------------
    //  3. TIÊU ĐỀ & NỘI DUNG HIỂN THỊ
    // ----------------------------------------------------------
    APP_TITLE:    'Điều khiển & Duyệt ý kiến',
    APP_SUBTITLE: 'Diễn đàn Nhân dân góp ý xây dựng lực lượng CAND phường',
    LOGIN_TITLE:  'Ban Tổ chức / Công an phường',
    LOGIN_SUB:    'Đăng nhập để duyệt ý kiến và điều khiển màn hình diễn đàn',

    // ----------------------------------------------------------
    //  4. TẦN SUẤT TỰ ĐỘNG LÀM MỚI DANH SÁCH (mili-giây)
    //     12000 = 12 giây
    // ----------------------------------------------------------
    AUTO_REFRESH_MS: 12000,

};
