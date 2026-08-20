// ================================================================
// API PROXY - Vercel Serverless Function
// Diễn đàn Nhân dân tham gia góp ý xây dựng lực lượng CAND phường
//
// Chức năng: Chuyển tiếp request đến Google Apps Script Web App
// - Bảo vệ WEBAPP_URL không bị lộ ở client
// - Xử lý CORS cho phép các domain khác nhau
// - Thêm timeout và xử lý lỗi
// ================================================================

// Lấy WebApp URL từ biến môi trường Vercel
// Tạo tại: Vercel Dashboard → Project → Settings → Environment Variables
// Tên biến: GOOGLE_SHEET_WEBAPP_URL
// Giá trị: https://script.google.com/macros/s/xxx/exec
const GOOGLE_SHEET_WEBAPP_URL = process.env.GOOGLE_SHEET_WEBAPP_URL;

// Lấy hash mật khẩu từ biến môi trường (dùng cho dieukhien.html)
// Tên biến: ADMIN_PASSWORD_HASH
// Giá trị: <SHA-256 của mật khẩu điều khiển>
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';

// Cấu hình timeout (milliseconds)
const TIMEOUT_MS = 30000;

// ================================================================
// HÀM XỬ LÝ CHÍNH
// ================================================================
export default async function handler(req, res) {
    // --- 1. Kiểm tra biến môi trường ---
    if (!GOOGLE_SHEET_WEBAPP_URL) {
        console.error('❌ GOOGLE_SHEET_WEBAPP_URL chưa được cấu hình!');
        return res.status(500).json({
            success: false,
            error: 'Server chưa được cấu hình đúng. Vui lòng liên hệ quản trị viên.',
            details: 'Missing GOOGLE_SHEET_WEBAPP_URL environment variable'
        });
    }

    // --- 2. Xử lý CORS ---
    // Cho phép tất cả origin trong môi trường phát triển
    // Trong production, nên giới hạn lại
    const allowedOrigins = [
        // Thêm các domain của bạn vào đây
        'http://localhost:3000',
        'http://localhost:3001',
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
        'https://quanlydien-dan-cand.vercel.app',  // Thay bằng domain thật của bạn
    ].filter(Boolean);

    const origin = req.headers.origin || '';
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        // Vẫn cho phép nhưng log để kiểm tra
        console.warn('⚠️ Origin không được cấu hình:', origin);
        res.setHeader('Access-Control-Allow-Origin', '*'); // Tạm thời cho phép
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // --- 3. Xử lý preflight OPTIONS ---
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // --- 4. Xử lý GET request ---
    if (req.method === 'GET') {
        try {
            const { action, t } = req.query;
            
            // Xây dựng URL với query parameters
            let url = GOOGLE_SHEET_WEBAPP_URL;
            const params = new URLSearchParams();
            if (action) params.append('action', action);
            if (t) params.append('t', t);
            
            const queryString = params.toString();
            if (queryString) {
                url += '?' + queryString;
            }

            console.log(`📤 GET → ${url}`);

            // Gọi đến Google Apps Script
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                signal: AbortSignal.timeout(TIMEOUT_MS)
            });

            if (!response.ok) {
                console.error(`❌ GET error: ${response.status} - ${response.statusText}`);
                return res.status(response.status).json({
                    success: false,
                    error: `Lỗi từ máy chủ: ${response.status}`,
                    details: response.statusText
                });
            }

            const data = await response.json();
            console.log(`✅ GET thành công (${(data?.data?.length || 0)} items)`);
            return res.status(200).json(data);

        } catch (error) {
            console.error('❌ GET proxy error:', error.message);
            
            if (error.name === 'TimeoutError') {
                return res.status(504).json({
                    success: false,
                    error: 'Máy chủ Google Apps Script không phản hồi. Vui lòng thử lại sau.',
                    details: 'Timeout'
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Lỗi khi kết nối đến máy chủ',
                details: error.message
            });
        }
    }

    // --- 5. Xử lý POST request ---
    if (req.method === 'POST') {
        try {
            // Đọc body
            let body;
            const contentType = req.headers['content-type'] || '';
            
            if (contentType.includes('application/json')) {
                body = req.body;
            } else if (contentType.includes('text/plain')) {
                // Một số client gửi plain text
                body = JSON.parse(req.body);
            } else {
                // Thử parse body
                body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            }

            // Kiểm tra action và xử lý đặc biệt
            const action = body?.action || '';
            
            // Nếu là admin_login, dùng ADMIN_PASSWORD_HASH từ biến môi trường
            if (action === 'admin_login') {
                // Chuyển tiếp thêm biến môi trường vào body
                body._adminHash = ADMIN_PASSWORD_HASH;
            }

            console.log(`📤 POST → ${GOOGLE_SHEET_WEBAPP_URL} (action: ${action})`);

            // Gọi đến Google Apps Script
            const response = await fetch(GOOGLE_SHEET_WEBAPP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(TIMEOUT_MS)
            });

            if (!response.ok) {
                console.error(`❌ POST error: ${response.status} - ${response.statusText}`);
                return res.status(response.status).json({
                    success: false,
                    error: `Lỗi từ máy chủ: ${response.status}`,
                    details: response.statusText
                });
            }

            const data = await response.json();
            console.log(`✅ POST thành công (${action})`);
            return res.status(200).json(data);

        } catch (error) {
            console.error('❌ POST proxy error:', error.message);
            
            if (error.name === 'TimeoutError') {
                return res.status(504).json({
                    success: false,
                    error: 'Máy chủ Google Apps Script không phản hồi. Vui lòng thử lại sau.',
                    details: 'Timeout'
                });
            }

            return res.status(500).json({
                success: false,
                error: 'Lỗi khi kết nối đến máy chủ',
                details: error.message
            });
        }
    }

    // --- 6. Method không được hỗ trợ ---
    return res.status(405).json({
        success: false,
        error: `Method ${req.method} không được hỗ trợ`
    });
}

// ================================================================
// CẤU HÌNH CHO VERCEL
// ================================================================
export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
        responseLimit: '10mb',
    },
};