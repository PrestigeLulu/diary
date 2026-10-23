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

document.querySelector('.scheduleAdd').addEventListener('click', function() {
  // 일정 추가 버튼 클릭 시 동작
  // 버튼을 클릭시 창이 열릴도록 구현

});

document.querySelector('.scheduleListBox').addEventListener('click', function() {
});
