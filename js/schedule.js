const rows = document.querySelector(".scheduleRows");
const countEl = document.querySelector(".scheduleCount");

/* ---------- 데이터 ---------- */
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

function deleteSchedule(id) {
  if (!confirm("이 일정을 삭제할까요?")) return;

  const schedules = getSchedules().filter((s) => s.id !== id);
  saveSchedules(schedules);
  renderSchedules();
}

/* ---------- 입력 검사 ---------- */
function isValidDate(text) {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !isNaN(new Date(text));
}

function isValidTime(text) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text);
}

/* ---------- 화면 그리기 ---------- */
const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderSchedules() {
  const schedules = getSchedules();

  schedules.sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  );

  if (countEl) {
    countEl.textContent = `총 ${schedules.length}개의 일정`;
  }

  if (schedules.length === 0) {
    rows.innerHTML = `<p class="scheduleEmpty">등록된 일정이 없어요.</p>`;
    return;
  }

  rows.innerHTML = schedules
    .map((s) => {
      const d = new Date(s.date + "T00:00:00");
      const day = String(d.getDate()).padStart(2, "0");
      const sub = `${d.getMonth() + 1}월 · ${WEEKDAYS[d.getDay()]}`;

      return `
        <div class="scheduleListBox" data-id="${s.id}">
          <div class="dateBox">
            <strong>${day}</strong>
            <span>${sub}</span>
          </div>

          <div class="line"></div>

          <div class="timeBox">
            <strong>${escapeHtml(s.time)}</strong>
          </div>

          <span class="category-dot ${escapeHtml(s.category)}"></span>

          <div class="scheduleInfo">
            <h2>${escapeHtml(s.title)}</h2>
            <p>${escapeHtml(s.category)}</p>
          </div>

          <button class="icon-button" type="button" data-action="edit">✎</button>
          <button class="icon-button delete" type="button" data-action="delete">×</button>
        </div>
      `;
    })
    .join("");
}

/* ---------- 일정 추가 (prompt) ---------- */
document.querySelector(".scheduleAdd").addEventListener("click", function () {
  const title = prompt("일정 제목을 입력하세요");
  if (!title || !title.trim()) return;

  const date = prompt("날짜를 입력하세요 (예: 2026-09-09)");
  if (date === null) return;
  if (!isValidDate(date.trim())) {
    alert("날짜 형식이 올바르지 않아요. 예: 2026-09-09");
    return;
  }

  const time = prompt("시간을 입력하세요 (예: 09:00)");
  if (time === null) return;
  if (!isValidTime(time.trim())) {
    alert("시간 형식이 올바르지 않아요. 예: 09:00");
    return;
  }

  const category = prompt("카테고리를 입력하세요 (업무 / 약속 / 건강)", "업무");
  if (category === null) return;

  addSchedule(title.trim(), date.trim(), time.trim(), category.trim() || "업무");
  renderSchedules();
});

/* ---------- 일정 수정 (prompt) ---------- */
function editSchedule(id) {
  const schedules = getSchedules();
  const target = schedules.find((s) => s.id === id);
  if (!target) return;

  const title = prompt("일정 제목", target.title);
  if (title === null) return;

  const date = prompt("날짜 (예: 2026-09-09)", target.date);
  if (date === null) return;
  if (!isValidDate(date.trim())) {
    alert("날짜 형식이 올바르지 않아요.");
    return;
  }

  const time = prompt("시간 (예: 09:00)", target.time);
  if (time === null) return;
  if (!isValidTime(time.trim())) {
    alert("시간 형식이 올바르지 않아요.");
    return;
  }

  const category = prompt("카테고리 (업무 / 약속 / 건강)", target.category);
  if (category === null) return;

  target.title = title.trim() || target.title;
  target.date = date.trim();
  target.time = time.trim();
  target.category = category.trim() || target.category;

  saveSchedules(schedules);
  renderSchedules();
}

/* ---------- 수정 / 삭제 버튼 (이벤트 위임) ---------- */
rows.addEventListener("click", function (e) {
  const button = e.target.closest("button");
  if (!button) return;

  const row = button.closest(".scheduleListBox");
  if (!row) return;

  const id = Number(row.dataset.id);

  if (button.dataset.action === "delete") {
    deleteSchedule(id);
  } else if (button.dataset.action === "edit") {
    editSchedule(id);
  }
});

// js/theme.js
document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("theme") === "dark" ? "dark" : "light"
);

/* ---------- 첫 로딩 ---------- */
renderSchedules();