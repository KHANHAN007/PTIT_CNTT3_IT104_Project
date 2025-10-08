// Script: updateTasksEstimatedHoursAndProgress.js
// Usage: node updateTasksEstimatedHoursAndProgress.js
// Adds estimatedHours if missing and recalculates progress for all tasks in db.json

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');
const BACKUP_PATH = path.join(__dirname, `db.json.bak.progress.${Date.now()}`);

function computeProgress(task) {
  // Logic from tasksService.ts
  if (task.status === 'Done') return 'Hoàn thành';
  const estimated = typeof task.estimatedHours === 'number' ? task.estimatedHours : null;
  const time = typeof task.timeSpentMinutes === 'number' ? task.timeSpentMinutes : 0;
  if (!estimated || estimated <= 0) return 'Đúng tiến độ';
  const ratio = time / (estimated * 60);
  if (ratio < 0.5) return 'Đúng tiến độ';
  if (ratio < 1) return 'Có rủi ro';
  return 'Trễ hẹn';
}

function main() {
  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const db = JSON.parse(raw);
  if (!Array.isArray(db.tasks)) throw new Error('No tasks array in db.json');

  // Backup
  fs.writeFileSync(BACKUP_PATH, raw);

  let changed = 0;
  db.tasks = db.tasks.map(task => {
    let updated = { ...task };
    if (!('estimatedHours' in updated)) {
      updated.estimatedHours = null;
      changed++;
    }
    // Always update progress
    updated.progress = computeProgress(updated);
    return updated;
  });

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  console.log(`Updated ${db.tasks.length} tasks. Added estimatedHours to ${changed} tasks.`);
  console.log(`Backup saved at: ${BACKUP_PATH}`);
}

main();
