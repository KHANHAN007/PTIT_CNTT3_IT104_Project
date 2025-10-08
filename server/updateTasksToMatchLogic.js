// updateTasksToMatchLogic.js
// Cập nhật dữ liệu task trong db.json cho đúng logic mới nhất
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

function computeProgress(status, startDate, estimatedHours, currentProgress) {
  if (status === 'Done') return 'Hoàn thành';
  if (status === 'Pending') return currentProgress || 'Đúng tiến độ';
  if (!estimatedHours || estimatedHours <= 0 || !startDate) return 'Đúng tiến độ';
  const now = NOW;
  const start = parseDate(startDate);
  if (!start) return 'Đúng tiến độ';
  const elapsed = (now - start) / (1000 * 60); // phút
  const estimated = estimatedHours * 60;
  if (elapsed < 0.5 * estimated) return 'Đúng tiến độ';
  if (elapsed < estimated) return 'Có rủi ro';
  return 'Trễ hẹn';
}

function updateTasks() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const db = JSON.parse(raw);
  db.tasks = db.tasks.map(task => {
    // estimatedHours: nếu chưa có hoặc <=0 thì tính từ startDate, deadline
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

    // completedAt chỉ có khi status là Done
    if (task.status === 'Done') {
      if (!task.completedAt) task.completedAt = NOW.toISOString();
    } else {
      task.completedAt = null;
    }

    // progress
    task.progress = computeProgress(task.status, task.startDate, estimated, task.progress);
    return task;
  });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  console.log('Đã cập nhật estimatedHours, completedAt và progress cho tất cả các task theo logic mới.');
}

updateTasks();
