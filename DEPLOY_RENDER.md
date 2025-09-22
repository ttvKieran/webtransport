# WebTransport Chat Application - Render Deployment

## 🚀 Deploy lên Render

### Bước 1: Chuẩn bị Repository
```bash
git init
git add .
git commit -m "Initial commit for Render deployment"
git remote add origin YOUR_GIT_REPOSITORY_URL
git push -u origin main
```

### Bước 2: Tạo Service trên Render
1. Đăng nhập [render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect repository GitHub/GitLab
4. Cấu hình:
   - **Name**: `webtransport-chat`
   - **Runtime**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node 18+`

### Bước 3: Environment Variables
Trong Render Dashboard, thêm:
```
NODE_ENV=production
```

### Bước 4: Deploy
- Render sẽ tự động deploy khi push code
- URL sẽ có dạng: `https://your-service-name.onrender.com`

### Bước 5: Test WebTransport
1. Mở URL của Render service
2. Test chat functionality
3. Kiểm tra browser console cho lỗi

## 🔧 Local Development
```bash
npm install
npm run dev
```

## 📝 Notes
- Render tự động cung cấp SSL certificate
- WebTransport sẽ dùng self-signed cert cho HTTP/3
- Client sẽ tự động adapt với production domain

## 🐛 Troubleshooting
- Kiểm tra Render logs nếu deploy fail
- Đảm bảo Node.js version >= 18
- WebTransport có thể cần thời gian để initialize