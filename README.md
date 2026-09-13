# Web Học Hộ 🎓

Hệ thống quản lý học hộ với tracking thời gian thực, check-in bằng ảnh và thanh toán minh bạch.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Vanilla CSS |
| Backend | Python FastAPI |
| Database | PostgreSQL (local dev / Google Cloud SQL production) |
| Storage | Google Cloud Storage (local fallback có sẵn) |
| Auth | JWT + bcrypt |
| Scheduler | APScheduler |
| Deploy FE | Vercel |
| Deploy BE | Render |

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
