# 🚀 Team Management Project

Ứng dụng quản lý team và dự án với tính năng theo dõi thời gian tự động.

## ✨ Features

### 👥 User Management
- Đăng nhập/Đăng ký với JWT authentication
- Profile management với avatar upload
- User roles và permissions

### 📋 Project Management  
- Tạo và quản lý dự án
- Thêm thành viên vào dự án với roles khác nhau
- Project dashboard với thống kê

### ✅ Task Management
- Tạo, chỉnh sửa, xóa tasks
- Task status: To do, In Progress, Pending, Done
- Task priority: High, Medium, Low
- Task progress tracking
- Deadline và estimated hours

### ⏰ Automatic Time Tracking
- **Passive Time Tracking**: Tự động tính thời gian dựa trên timestamp
- Tự động bắt đầu tracking khi task chuyển sang "In Progress"
- Tự động sync thời gian lên server định kỳ
- Persistent tracking qua page reload
- Real-time time display

### 📊 Dashboard & Analytics
- Personal tasks dashboard
- Project progress overview
- Time tracking statistics
- Filter và search tasks

### 🔔 Notifications
- Task status change notifications
- Deadline reminders
- Member invitation requests

## 🛠️ Tech Stack

### Frontend
- **React 18** với TypeScript
- **Ant Design** cho UI components
- **Redux Toolkit** cho state management
- **React Router** cho navigation
- **Axios** cho API calls
- **Dayjs** cho date handling
- **Vite** làm build tool

### Backend
- **JSON Server** làm mock API
- **REST API** architecture

### Storage
- **LocalStorage** cho client-side persistence
- **JSON Database** cho server data

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16
- npm hoặc yarn

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd React_Team Management_Project
```

2. **Install dependencies**
```bash
# Client
cd client
npm install

# Server  
cd ../server
npm install
```

3. **Start development servers**
```bash
# Terminal 1 - Start JSON Server (Port 3001)
cd server
npm start

# Terminal 2 - Start React App (Port 5173)
cd client  
npm run dev
```

4. **Access application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📁 Project Structure

```
React_Team Management_Project/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   ├── store/             # Redux store
│   │   ├── types/             # TypeScript types
│   │   └── router/            # Route configuration
│   ├── public/
│   └── package.json
├── server/                     # JSON Server backend
│   ├── db.json               # Database file
│   └── package.json
└── README.md
```

## 🎯 Key Features Deep Dive

### Passive Time Tracking System
- **Automatic**: Tự động bắt đầu khi task "In Progress"
- **Accurate**: Dựa trên timestamp calculation thay vì timer
- **Persistent**: Lưu trữ trong localStorage
- **Real-time**: Hiển thị thời gian real-time
- **Auto-sync**: Đồng bộ lên server mỗi 2 phút

### User Authentication
- JWT-based authentication
- Protected routes
- Role-based access control
- Persistent login state

### Project Collaboration
- Multi-user projects
- Role assignments (Owner, Manager, Developer, etc.)
- Member invitation system
- Project-based task organization

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Users
- `GET /users` - Get all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user

### Projects
- `GET /projects` - Get all projects
- `POST /projects` - Create project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Tasks
- `GET /tasks` - Get all tasks
- `GET /tasks?assigneeId=:userId` - Get user tasks
- `POST /tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Members
- `GET /members` - Get project members
- `POST /members` - Add member to project

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Theme**: Theme switching support
- **Vietnamese Localization**: Full Vietnamese UI
- **Advanced Filtering**: Multi-criteria task filtering
- **Real-time Updates**: Live time tracking display
- **Intuitive Navigation**: Easy-to-use interface

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy dist/ folder
```

### Backend (Heroku/Railway)
```bash
cd server
# Configure for production deployment
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📋 Todo / Roadmap

- [ ] Real-time notifications với WebSocket
- [ ] Advanced reporting và analytics
- [ ] File attachment cho tasks
- [ ] Gantt chart view
- [ ] Mobile app với React Native
- [ ] Integration với third-party tools (Slack, Discord)
- [ ] Advanced permission system
- [ ] Team chat functionality

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Developer

**Your Name**
- GitHub: [@username](https://github.com/username)
- Email: your.email@example.com

---

## 🔍 Debug Information

### Environment Variables
- `VITE_API_URL`: Backend API URL (default: http://localhost:3001)
- `VITE_CLOUDINARY_URL`: Cloudinary upload URL

### Common Issues
1. **CORS Issues**: Ensure JSON Server allows CORS
2. **Port Conflicts**: Check if ports 3001/5173 are available  
3. **Time Tracking**: Check browser localStorage for tracking data
4. **API Errors**: Verify JSON Server is running

### Performance Tips
- Time tracking uses passive calculation (no continuous timers)
- Component memoization để reduce re-renders
- Efficient state management với Redux Toolkit
- Image optimization với Cloudinary

**Happy Coding! 🚀**