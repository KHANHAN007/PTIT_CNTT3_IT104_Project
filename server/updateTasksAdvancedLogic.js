// updateTasksAdvancedLogic.js
// Chuyển đổi dữ liệu task theo logic trạng thái, tiến độ, priority thông minh
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const NOW = new Date();

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function getProgress(task, now) {
  if (task.status === 'Done') return 'Hoàn thành';
  if (task.status === 'Pending') return 'Tạm dừng';
  if (task.status === 'To do') return 'Chưa bắt đầu';
  if (task.status !== 'In Progress') return task.progress || 'Chưa bắt đầu';

  // In Progress
  const start = parseDate(task.startDate);
  const deadline = parseDate(task.deadline);
  const estimated = typeof task.estimatedHours === 'number' && task.estimatedHours > 0 ? task.estimatedHours : 8;
  if (!start || !deadline) return 'Đúng tiến độ';
  const totalDuration = deadline - start;
  const elapsed = clamp(now - start, 0, totalDuration);
  const expectedProgress = totalDuration > 0 ? elapsed / totalDuration : 0;
  const actualProgress = (task.timeSpentMinutes || 0) / (estimated * 60);

  if (now > deadline && task.status !== 'Done') return 'Trễ hẹn';
  if (Math.abs(actualProgress - expectedProgress) < 0.1) return 'Đúng tiến độ';
  if (actualProgress < expectedProgress) return 'Trễ hẹn';
  if (actualProgress > expectedProgress) return 'Vượt tiến độ';
  return 'Đúng tiến độ';
}

function getPriority(task, now) {
  const start = parseDate(task.startDate);
  const deadline = parseDate(task.deadline);
  if (!start || !deadline) return 'medium';
  const total = deadline - start;
  const left = deadline - now;
  const percentLeft = total > 0 ? left / total : 0;
  const progress = task.progress;
  if (progress === 'Trễ hẹn') return 'high';
  if (percentLeft > 0.7 && progress === 'Đúng tiến độ') return 'low';
  if (percentLeft < 0.3) return 'high';
  if (percentLeft <= 0.7 && percentLeft >= 0.3) return 'medium';
  return 'medium';
}

function updateTasks() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const db = JSON.parse(raw);
  db.tasks = db.tasks.map(task => {
    // completedAt chỉ khi Done
    if (task.status === 'Done') {
      if (!task.completedAt) task.completedAt = NOW.toISOString();
    } else {
      task.completedAt = null;
    }

    // pausedAt, resumedAt: chỉ lưu nếu Pending hoặc resume
    if (task.status === 'Pending') {
      if (!task.pausedAt) task.pausedAt = NOW.toISOString();
    } else {
      task.pausedAt = null;
    }
    if (task.status === 'In Progress' && task.pausedAt) {
      task.resumedAt = NOW.toISOString();
    } else {
      task.resumedAt = null;
    }

    // progress
    task.progress = getProgress(task, NOW);

    // priority
    task.priority = getPriority(task, NOW);

    return task;
  });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log('Đã cập nhật trạng thái, tiến độ, priority, completedAt, pausedAt, resumedAt cho tất cả các task.');
}

updateTasks();
