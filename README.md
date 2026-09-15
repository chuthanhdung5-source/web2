# Đấu La Đại Khảo Chi Lưới 🔮 (v2.0)

Hệ thống quản lý học hộ & khảo thí tu vi Hồn Sư chuẩn phong cách Đấu La Đại Lục:
- 🔮 **Đấu La Tàng Bảo Các**: Tiêu thụ Kim Cương mở khóa skin thần trang, tiện ích ghi nhớ tâm pháp, gia hạn phiên tu luyện.
- 🎨 **Theme Skins**: Hỗ trợ 3 bộ thần trang giao diện (Lam Ngân Thần Khí, Hoàng Gia Hắc Kim, Hải Thần Quang Diệu).
- ⏳ **Phiên Tu Luyện (Session Timer)**: Giới hạn phiên làm việc tập trung 2 giờ, hỗ trợ gia hạn thời gian bằng 💎.
- 🔐 **Ghi Nhớ Tâm Pháp**: Lưu thông tin đăng nhập tự động, bảo mật và tiện lợi.
- 📱 **Mobile Responsive**: Giao diện đỉnh cao, tối ưu tuyệt đối trên mọi kích thước màn hình điện thoại.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite) + Vanilla CSS Design System |
| Backend | Python FastAPI (SQLAlchemy, Pydantic) |
| Database | PostgreSQL (Local Docker / Cloud SQL) |
| Storage | GCS / Local fallback storage |
| Auth | JWT + bcrypt + Ghi nhớ tâm pháp |
| Gamification | Đấu La Hồn Lực, 12 Cảnh Giới, Mỏ Hồn Thạch, Tàng Bảo Các |

## Chạy nhanh với Docker

```bash
# 1. Clone và setup
cd E:\Group\webhocho

# 2. Copy .env (đã có sẵn, chỉnh nếu cần)
# Mặc định đã có các giá trị local

# 3. Chạy toàn bộ stack
docker-compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

## Chạy thủ công (không Docker)

### Backend
```bash
cd backend
pip install -r requirements.txt

# Tạo database PostgreSQL local
# Sửa DATABASE_URL trong .env

python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tài khoản đầu tiên = Admin

Người đăng ký **đầu tiên** trong hệ thống tự động được đặt làm **Admin**.
Các tài khoản tiếp theo đều là **Thành viên**.

## Lịch học đã được seed sẵn

Hệ thống tự động import lịch học từ ảnh TKB:
- MAT2034 - Giải tích số
- MAT3382 - Lập trình cho KHDL
- MAT3390 - Nhập môn Tin sinh học
- MAT3381 - Thực tập thực tế về KHDL
- MAT3392 - Ứng dụng dữ liệu lớn
- MAT3399 - Xử lý ngôn ngữ tự nhiên và học sâu

## Deploy

### Frontend → Vercel
```bash
cd frontend
npm run build
# Push lên GitHub → kết nối Vercel
```

### Backend → Render
- Tạo Web Service từ `./backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Thêm env vars trong Render dashboard

### Database → Google Cloud SQL
1. Tạo PostgreSQL instance trên Cloud SQL
2. Cập nhật `DATABASE_URL` trong Render env vars
3. Whitelist IP của Render

### Ảnh → Google Cloud Storage
1. Tạo bucket GCS
2. Tạo Service Account, download JSON key
3. Set `GCS_PROJECT_ID`, `GCS_BUCKET_NAME`, upload key file lên Render
