# Time Service Integration Guide

## 📊 **TimeService đã được tạo với các tính năng:**

### 🚀 **Core Features:**
- **Real-time tracking**: Tự động đếm thời gian khi task "In Progress"
- **LocalStorage persistence**: Lưu trạng thái tracking khi đóng browser
- **Auto-sync**: Tự động đồng bộ với server mỗi phút
- **Event-driven**: Emit events khi có thay đổi
- **Multiple task support**: Có thể track nhiều task cùng lúc

### 🛠 **APIs Available:**

#### **Core Methods:**
```typescript
timeService.startTracking(taskId: string)
timeService.stopTracking(taskId: string): number
timeService.toggleTracking(taskId: string): boolean
timeService.isTracking(taskId: string): boolean
```

#### **Time Queries:**
```typescript
timeService.getCurrentSessionTime(taskId: string): number
timeService.getTotalTrackedTime(taskId: string): number
timeService.getUnsyncedTime(taskId: string): number
```

#### **Sync Methods:**
```typescript
timeService.syncTimeToServer(taskId: string): Promise<void>
timeService.syncAllToServer(): Promise<void>
```

#### **React Hook:**
```typescript
import { useTimeTracking } from '../hooks/useTimeTracking';

const timeTracking = useTimeTracking();
// hoặc cho specific task:
const taskTime = useTaskTimeTracking(taskId);
```

## 📝 **Example Integration trong PersonalTasks.tsx:**

### 1. **Import hook:**
```typescript
import { useTimeTracking, formatTime } from '../hooks/useTimeTracking';
```

### 2. **Use trong component:**
```typescript
const PersonalTasks: React.FC = () => {
    const timeTracking = useTimeTracking();
    
    // Auto-start tracking for In Progress tasks
    useEffect(() => {
        if (tasks.length > 0) {
            timeTracking.autoStartForInProgressTasks(tasks);
            timeTracking.autoStopForCompletedTasks(tasks);
        }
    }, [tasks, timeTracking]);
```

### 3. **Integrate vào Table render:**
```typescript
// Trong column render
render: (progress: string, record) => {
    const isTracking = timeTracking.isTracking(record.id);
    const currentTime = timeTracking.getCurrentSessionTime(record.id);
    const totalTime = timeTracking.getTotalTrackedTime(record.id);
    const unsyncedTime = timeTracking.getUnsyncedTime(record.id);
    
    return (
        <div>
            <Tag color={getProgressColor(progress as TaskProgressType)}>
                {progress}
            </Tag>
            
            {/* Time display */}
            {totalTime > 0 && (
                <Tag icon={<ClockCircleOutlined />} 
                     color={isTracking ? 'processing' : 'default'}>
                    {formatTime(totalTime)}
                </Tag>
            )}
            
            {/* Control buttons */}
            {record.assigneeId === user?.id && (
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    <Button
                        type="text"
                        size="small"
                        icon={isTracking ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={() => timeTracking.toggleTracking(record.id)}
                        style={{ color: isTracking ? '#faad14' : '#52c41a' }}
                    />
                    
                    {unsyncedTime > 0 && (
                        <Button
                            type="text"
                            size="small"
                            icon={<SyncOutlined />}
                            onClick={() => timeTracking.syncTimeToServer(record.id)}
                            style={{ color: '#1890ff' }}
                            title={`Sync ${unsyncedTime}m`}
                        />
                    )}
                </div>
            )}
        </div>
    );
}
```

## 🔄 **Auto-behaviors:**

### **1. Auto-start tracking:**
- Tasks với status "In Progress" sẽ tự động được track
- Chạy khi component mount hoặc khi tasks update

### **2. Auto-sync:**
- Mỗi phút sẽ tự động sync thời gian lên server
- Chỉ sync khi có >= 1 phút thời gian

### **3. Auto-save:**
- Lưu state vào localStorage mỗi khi có thay đổi
- Restore state khi refresh browser

## 📱 **Events:**
```typescript
timeService.on('onTimeUpdate', (taskId, minutes) => {
    console.log(`Task ${taskId} updated: ${minutes}m`);
});

timeService.on('onSessionStart', (taskId) => {
    console.log(`Started tracking ${taskId}`);
});

timeService.on('onSessionStop', (taskId, duration) => {
    console.log(`Stopped tracking ${taskId}, duration: ${duration}m`);
});
```

## ⚙️ **Configuration:**
- **AUTO_SYNC_INTERVAL**: 60000ms (1 phút)
- **MIN_SYNC_THRESHOLD**: 1 phút
- **Storage key**: 'task_time_sessions'

## 🎯 **Usage trong ProjectDetail.tsx tương tự:**
Chỉ cần import và sử dụng `useTimeTracking()` hook, rồi integrate vào table render như example trên.

---

**TimeService hoàn toàn độc lập và có thể được sử dụng trong bất kỳ component nào!**