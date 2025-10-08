// updateTasksSmartProgress.js
// Script cập nhật estimatedHours thực tế, actualElapsedMinutes và progress thông minh cho tất cả các task
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const NOW = new Date();

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d) ? null : d;
}

function estimateHoursFromDates(start, end) {
  if (!start || !end) return 8; // default 8h nếu thiếu dữ liệu
  const ms = end - start;
  const hours = ms / (1000 * 60 * 60);
  return Math.max(1, Math.round(hours));
}

function computeProgress(task, elapsedMinutes, estimatedHours) {
  if (task.status === 'Done') return 'Hoàn thành';
  if (!estimatedHours || estimatedHours <= 0) return 'Đúng tiến độ';
  const ratio = elapsedMinutes / (estimatedHours * 60);
  if (ratio < 0.5) return 'Đúng tiến độ';
  if (ratio < 1) return 'Có rủi ro';
  return 'Trễ hẹn';
}

function updateTasks() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const db = JSON.parse(raw);
  db.tasks = db.tasks.map(task => {
    // estimatedHours: nếu chưa có thì tính từ startDate, deadline
    let estimated = typeof task.estimatedHours === 'number' && task.estimatedHours > 0
      ? task.estimatedHours
      : null;
    const start = parseDate(task.startDate);
    const end = parseDate(task.deadline);
    if (!estimated && start && end) {
      estimated = estimateHoursFromDates(start, end);
    }
    if (!estimated) estimated = 8; // fallback mặc định
    task.estimatedHours = estimated;

    // actualElapsedMinutes: từ startDate đến NOW (hoặc đến deadline nếu Done)
    let elapsedTo = (task.status === 'Done' && end) ? end : NOW;
    let elapsedMinutes = start ? Math.max(0, Math.round((elapsedTo - start) / (1000 * 60))) : 0;
    task.actualElapsedMinutes = elapsedMinutes;

    // progress
    task.progress = computeProgress(task, elapsedMinutes, estimated);
    return task;
  });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log('Đã cập nhật estimatedHours, actualElapsedMinutes và progress thông minh cho tất cả các task.');
}

updateTasks();
