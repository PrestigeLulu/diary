import { getSchedules, saveSchedules } from "./storage.js";

function addSchedule(title, date, time, category) {
  const schedules = getSchedules();

  const newSchedule = {
    id: Number(localStorage.getItem("nextScheduleId") || 1),
    title,
    date,
    time,
    category
  };

  schedules.push(newSchedule);
  saveSchedules(schedules);

  localStorage.setItem("nextScheduleId", newSchedule.id + 1);
}