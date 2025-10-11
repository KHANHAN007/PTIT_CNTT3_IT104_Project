# 📋 Passive Time Tracking System

## 🎯 Overview
Hệ thống theo dõi thời gian ngầm (Passive Time Tracking) cho phép tự động tính toán thời gian làm việc của các task dựa trên thời gian bắt đầu và thời gian hiện tại, thay vì theo dõi liên tục bằng timer.

## 🏗️ Architecture

### Core Components:
1. **PassiveTimeService** - Service chính xử lý logic tracking
2. **usePassiveTimeTracking** - React hook để tích hợp vào components  
3. **TimeTrackingInitializer** - Component tự động khởi tạo tracking
4. **PersonalTasks** - UI hiển thị và điều khiển tracking

## 🚀 How It Works

### 1. Automatic Initialization
- Khi user đăng nhập → Tự động fetch tasks
- Khi tasks loaded → Tự động bắt đầu tracking cho task "In Progress"
- Khi task status thay đổi → Tự động update tracking

### 2. Time Calculation Logic
```typescript
// Lưu timestamp khi bắt đầu
startTime = Date.now()

// Tính thời gian đã làm
timeWorked = (currentTime - startTime) / (1000 * 60) // minutes
totalTime = previousTime + timeWorked
```

### 3. Data Persistence
- **localStorage**: Lưu tracking state để survive page reload
- **Server sync**: Đồng bộ thời gian lên database định kỳ
- **Auto cleanup**: Tự động sync khi page unload hoặc tab bị ẩn

## 📁 File Structure

```
src/
├── services/
│   ├── passiveTimeService.ts      # Core tracking logic
│   └── index.ts                   # Service exports
├── hooks/
│   └── usePassiveTimeTracking.ts  # React hook
├── components/
│   └── TimeTrackingInitializer.tsx # Auto initialization
└── pages/
    └── PersonalTasks.tsx          # UI integration
```

## 🔧 API Reference

### PassiveTimeService

#### Methods:
- `startPassiveTracking(taskId, currentTime?)` - Bắt đầu tracking
- `stopPassiveTracking(taskId)` - Dừng tracking
- `calculateTimeWorked(taskId)` - Tính thời gian session hiện tại
- `getTotalTimeForTask(taskId)` - Tính tổng thời gian (bao gồm thời gian trước đó)
- `syncTaskToServer(taskId)` - Đồng bộ task lên server
- `syncAllToServer()` - Đồng bộ tất cả task
- `initializeFromTasks(tasks)` - Khởi tạo tracking từ danh sách task
- `updateTrackingFromTaskChanges(tasks)` - Cập nhật tracking khi task thay đổi

#### Events:
- Auto-sync mỗi 2 phút (trong TimeTrackingInitializer)
- Sync khi page unload
- Sync khi tab bị ẩn (visibilitychange)

### usePassiveTimeTracking Hook

#### Returns:
```typescript
{
  // State
  activeTaskIds: string[]
  lastUpdate: number
  
  // Methods
  isTracking: (taskId: string) => boolean
  getTaskSummary: (taskId: string) => TaskSummary
  startTracking: (taskId: string, currentTime?: number) => void
  stopTracking: (taskId: string) => number
  syncAllToServer: () => Promise<void>
  syncTaskToServer: (taskId: string) => Promise<boolean>
}
```

## 💡 Usage Examples

### 1. Basic Usage in Component
```typescript
const passiveTracking = usePassiveTimeTracking();

// Check if task is being tracked
const isTracking = passiveTracking.isTracking("task-id");

// Get task time summary
const summary = passiveTracking.getTaskSummary("task-id");
console.log(`Current session: ${summary.currentSessionMinutes} minutes`);
console.log(`Total time: ${summary.totalMinutes} minutes`);

// Manual control
passiveTracking.startTracking("task-id", existingTimeMinutes);
passiveTracking.stopTracking("task-id");
```

### 2. Auto-initialization
```typescript
// Trong TimeTrackingInitializer
useEffect(() => {
  if (tasks.length > 0) {
    passiveTracking.initializeFromTasks(tasks);
  }
}, [tasks]);
```

### 3. Task Status Change Handling
```typescript
useEffect(() => {
  if (tasks.length > 0) {
    passiveTracking.updateTrackingFromTaskChanges(tasks);
  }
}, [tasks]);
```

## 🎨 UI Integration

### PersonalTasks Display:
- ✅ Hiển thị task đang được tracked
- ⏱️ Hiển thị thời gian session hiện tại  
- 🚀 Hiển thị tổng thời gian vs estimated time
- 🔄 Button sync manual
- ▶️/⏸️ Button start/stop tracking manual

### Time Format:
- `formatTime(minutes)` - "1h 30m" hoặc "45m"
- `formatTimeDetailed(minutes)` - "1 giờ 30 phút" hoặc "45 phút"

## 🔍 Debugging

### Console Logs:
- `✅ PassiveTimeService: Started tracking for task X`
- `⏹️ PassiveTimeService: Stopped tracking for task X`  
- `🔄 PassiveTimeService: Synced X minutes for task Y`
- `🚀 TimeTrackingInitializer: User logged in...`
- `📋 TimeTrackingInitializer: Tasks loaded...`

### LocalStorage:
- Key: `passive_task_times`
- Data: `{ records: [taskId, TaskTimeRecord][], lastSave: timestamp }`

## 🚀 Benefits

1. **Performance**: Không có timer liên tục, chỉ tính toán khi cần
2. **Accuracy**: Dựa trên timestamp thực tế
3. **Persistence**: Không mất tracking khi reload page
4. **Auto-sync**: Tự động đồng bộ lên server  
5. **Error-free**: Không có infinite loop hoặc re-render issues
6. **User-friendly**: Hoạt động trong background, không cần user can thiệp

## 🎯 Next Steps

- [ ] Thêm notification khi sync thành công
- [ ] Thêm setting để config auto-sync interval
- [ ] Thêm report thời gian làm việc theo ngày/tuần
- [ ] Thêm export time tracking data
- [ ] Thêm time tracking cho ProjectDetail page