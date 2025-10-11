# 🎯 Advanced Priority Logic - Logic Độ Ưu Tiên Cao Cấp

## Tổng quan
Hệ thống tính toán độ ưu tiên task dựa trên **5 yếu tố chính** với **thuật toán scoring** để đánh giá mức độ quan trọng tự động.

## 📊 Công thức tính toán

```
Priority Score = (
  TimePressure × 0.3 +
  WorkEfficiency × 0.25 + 
  DeadlineRisk × 0.25 +
  BusinessImpact × 0.2
) × StatusMultiplier × EfficiencyMultiplier
```

## 🔍 Chi tiết các yếu tố

### 1. Time Pressure (30% trọng số)
- **Định nghĩa**: Tỷ lệ thời gian đã trôi qua từ ngày bắt đầu đến hiện tại
- **Công thức**: `(Current Time - Start Time) / (Deadline - Start Time)`
- **Giá trị**: 0-1 (0 = vừa bắt đầu, 1 = đến deadline)
- **Ảnh hưởng**: Càng gần deadline, priority càng cao

### 2. Work Efficiency (25% trọng số)
- **Định nghĩa**: Tỷ lệ thời gian thực tế làm việc so với ước tính
- **Công thức**: `Time Spent Hours / Estimated Hours`
- **Giá trị**: 0-2+ (0 = chưa làm, 1 = đúng ước tính, >1 = vượt ước tính)
- **Ảnh hưởng**: 
  - < 1.0: Bình thường
  - 1.0-1.5: Tăng nhẹ priority
  - 1.5-2.0: Tăng mạnh priority (vượt ước tính)
  - > 2.0: Priority cao nhất (vượt quá nhiều ước tính)

### 3. Deadline Risk (25% trọng số)
- **Định nghĩa**: Nguy cơ trễ deadline dựa trên thời gian còn lại
- **Thang đo**:
  - Đã quá hạn: 1.0 (nguy cơ cao nhất)
  - < 1 ngày: 0.9 (rất cao)
  - < 3 ngay: 0.7 (cao)
  - < 7 ngày: 0.5 (trung bình)
  - > 7 ngày: 0.3 - 0.0 (giảm dần theo thời gian)

### 4. Business Impact (20% trọng số)
- **Định nghĩa**: Mức độ ảnh hưởng đến dự án dựa trên progress
- **Thang đo**:
  - **Delayed**: 1.0 (ảnh hưởng nghiêm trọng)
  - **At Risk**: 0.8 (ảnh hưởng cao)
  - **On Track**: 0.4 (ảnh hưởng thấp)
  - **Done**: 0.1 (không ảnh hưởng)

### 5. Status Multiplier
- **TODO**: 0.8 (giảm vì chưa bắt đầu)
- **IN_PROGRESS**: 1.0 (chuẩn)
- **PENDING**: 1.2 (tăng vì đang tạm dừng)
- **DONE**: Return LOW (luôn ưu tiên thấp)

### 6. Efficiency Multiplier
- **> 2.0x ước tính**: 1.3 (penalty cao)
- **1.5-2.0x ước tính**: 1.2 (penalty trung bình)
- **1.0-1.5x ước tính**: 1.1 (penalty nhẹ)
- **< 0.1x và đang In Progress**: 0.9 (giảm nhẹ vì vừa bắt đầu)

## 🎯 Mapping Score → Priority

| Priority Score | Priority Level | Ý nghĩa |
|---------------|---------------|---------|
| ≥ 0.8 | **HIGH** | Cần ưu tiên cao nhất |
| 0.5 - 0.8 | **MEDIUM** | Ưu tiên trung bình |
| < 0.5 | **LOW** | Ưu tiên thấp |

## 📈 Ví dụ tính toán

### Task A: "User Authentication" 
- Time Pressure: 0.6 (60% thời gian đã trôi qua)
- Work Efficiency: 1.2 (vượt 20% ước tính)
- Deadline Risk: 0.5 (còn 5 ngày)
- Business Impact: 0.8 (At Risk)
- Status: IN_PROGRESS (1.0)
- Efficiency: 1.1 (vượt ước tính nhẹ)

**Calculation:**
```
Score = (0.6×0.3 + 1.2×0.25 + 0.5×0.25 + 0.8×0.2) × 1.0 × 1.1
      = (0.18 + 0.30 + 0.125 + 0.16) × 1.1
      = 0.765 × 1.1 = 0.84
```
**Result: HIGH Priority** 🔴

### Task B: "Documentation"
- Time Pressure: 0.3 (30% thời gian đã trôi qua)
- Work Efficiency: 0.6 (làm 60% ước tính)
- Deadline Risk: 0.2 (còn 15 ngày)
- Business Impact: 0.4 (On Track)
- Status: IN_PROGRESS (1.0)
- Efficiency: 1.0 (bình thường)

**Calculation:**
```
Score = (0.3×0.3 + 0.6×0.25 + 0.2×0.25 + 0.4×0.2) × 1.0 × 1.0
      = (0.09 + 0.15 + 0.05 + 0.08) × 1.0
      = 0.37
```
**Result: LOW Priority** 🟢

## 🚨 Các trường hợp đặc biệt

### 1. Task quá hạn (Overdue)
- Deadline Risk = 1.0
- Tự động được **HIGH Priority**
- Hiển thị cảnh báo 🚨

### 2. Task vượt quá 2x thời gian ước tính
- Efficiency Multiplier = 1.3
- Có khả năng cao được **HIGH Priority**
- Hiển thị cảnh báo ⚠️

### 3. Task PENDING
- Status Multiplier = 1.2 (tăng nhẹ)
- Vẫn tính toán các yếu tố khác
- Ưu tiên duy trì tracking

### 4. Task DONE
- Luôn return **LOW Priority**
- Không cần tính toán thêm

## 🔄 Cập nhật real-time

Priority được tính toán lại khi:
- ⏰ Time tracking cập nhật
- 📅 Thời gian trôi qua (gần deadline)
- 🔄 Status thay đổi
- 📊 Progress cập nhật

## 🎪 Demo Cases

Hệ thống có sẵn các task demo để test:
- **Task #2**: In Progress, vượt ước tính → HIGH
- **Task #7**: In Progress, gần deadline → HIGH  
- **Task #8**: Pending, còn thời gian → MEDIUM
- **Task #18**: In Progress, đúng tiến độ → MEDIUM/LOW

## 🔧 Customization

Có thể điều chỉnh trọng số theo nhu cầu:
```typescript
// Trọng số hiện tại
timePressure * 0.3 +
workEfficiency * 0.25 + 
deadlineRisk * 0.25 +
businessImpact * 0.2

// Có thể thay đổi thành:
timePressure * 0.4 +  // Tăng trọng số deadline
workEfficiency * 0.2 + 
deadlineRisk * 0.3 +
businessImpact * 0.1
```

---
*Logic này đảm bảo priority được tính toán chính xác, phản ánh đúng tình trạng thực tế của task và hỗ trợ quyết định ưu tiên làm việc hiệu quả.*