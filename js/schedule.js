const rows = document.querySelector(".scheduleRows");
const countEl = document.querySelector(".scheduleCount");
const dateFilterBox = document.querySelector("#dateFilter");
const categoryFilterBox = document.querySelector("#categoryFilter");
const listTitle = document.querySelector("#scheduleListTitle");

// month: "all" 또는 "2026-09" / category: "all" 또는 카테고리 이름
const filters = { month: "all", category: "all" };

/* ---------- 카테고리 (설정 페이지와 같은 localStorage 키 사용) ---------- */
function loadCategories() {
  return JSON.parse(localStorage.getItem("categories")) || [
    { id: "personal", name: "개인", color: "#7f9d87" },
    { id: "work", name: "업무", color: "#b96e4f" },
    { id: "appointment", name: "약속", color: "#78649b" }
  ];
}

function getCategoryColor(name) {
  const c = loadCategories().find((c) => c.name === name);
  return c ? c.color : "#999999";
}

// 번호 목록을 보여주고 카테고리 이름을 돌려줌 (취소하면 null)
function chooseCategory(defaultName) {
  const categories = loadCategories();

  const list = categories
    .map((c, i) => `${i + 1}. ${c.name}`)
    .join("\n");

  const defaultIndex = Math.max(
    categories.findIndex((c) => c.name === defaultName),
    0
  ) + 1;

  const input = prompt(`카테고리를 번호로 선택하세요\n\n${list}`, defaultIndex);
  if (input === null) return null;

  const picked = categories[Number(input.trim()) - 1];
  if (!picked) {
    alert("목록에 있는 번호를 입력해주세요.");
    return null;
  }
  return picked.name;
}

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

// "09:00", "09 00", "9:5", "0900" 등을 "09:00"으로 변환 (형식이 틀리면 null)
function parseTime(text) {
  const match = text.trim().match(/^(\d{1,2})\s*[: ]\s*(\d{1,2})$|^(\d{2})(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1] ?? match[3]);
  const minute = Number(match[2] ?? match[4]);

  if (hour > 23 || minute > 59) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// 년 → 월 → 일을 따로 받아서 "YYYY-MM-DD"로 돌려줌 (취소/오류면 null)
// defaultDate: "2026-09-09" 형태 (수정할 때 현재 값을 기본값으로 보여줌)
function askDate(defaultDate) {
  const [dy, dm, dd] = defaultDate
    ? defaultDate.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];

  const yearInput = prompt("년도를 입력하세요 (예: 2026)", dy);
  if (yearInput === null) return null;
  const year = Number(yearInput.trim());
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    alert("년도는 1900~2100 사이의 숫자로 입력해주세요.");
    return null;
  }

  const monthInput = prompt("월을 입력하세요 (1~12)", dm);
  if (monthInput === null) return null;
  const month = Number(monthInput.trim());
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    alert("월은 1~12 사이의 숫자로 입력해주세요.");
    return null;
  }

  // 해당 월의 마지막 날 (윤년, 30/31일 자동 계산)
  const lastDay = new Date(year, month, 0).getDate();

  const dayInput = prompt(`일을 입력하세요 (1~${lastDay})`, dd);
  if (dayInput === null) return null;
  const day = Number(dayInput.trim());
  if (!Number.isInteger(day) || day < 1 || day > lastDay) {
    alert(`${month}월은 1~${lastDay}일까지 있어요.`);
    return null;
  }

  const mm = String(month).padStart(2, "0");
  const dd2 = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd2}`;
}

/* ---------- 화면 그리기 ---------- */
const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderSchedules() {
  const all = getSchedules();

  const schedules = all.filter((s) =>
    (filters.month === "all" || s.date.startsWith(filters.month)) &&
    (filters.category === "all" || s.category === filters.category)
  );

  schedules.sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  );

  if (listTitle) {
    listTitle.textContent =
      filters.month === "all"
        ? "전체 일정"
        : `${Number(filters.month.slice(5))}월의 일정`;
  }

  if (countEl) {
    countEl.textContent = `총 ${schedules.length}개의 일정`;
  }

  if (schedules.length === 0) {
    rows.innerHTML = `<p class="scheduleEmpty">${
      all.length === 0 ? "등록된 일정이 없어요." : "조건에 맞는 일정이 없어요."
    }</p>`;
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

          <span class="category-dot" style="background-color:${getCategoryColor(s.category)}"></span>
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

  const date = askDate();
  if (date === null) return;

  const timeInput = prompt("시간을 입력하세요 (예: 09:00 또는 09 00)");
  if (timeInput === null) return;
  const time = parseTime(timeInput);
  if (time === null) {
    alert("시간 형식이 올바르지 않아요. 예: 09:00 또는 09 00");
    return;
  }

  const category = chooseCategory();
  if (category === null) return;

  addSchedule(title.trim(), date, time, category);
  renderSchedules();
});

/* ---------- 일정 수정 (prompt) ---------- */
function editSchedule(id) {
  const schedules = getSchedules();
  const target = schedules.find((s) => s.id === id);
  if (!target) return;

  const title = prompt("일정 제목", target.title);
  if (title === null) return;

  const date = askDate(target.date);   // 현재 날짜가 기본값
  if (date === null) return;

  const timeInput = prompt("시간 (예: 09:00 또는 09 00)", target.time);
  if (timeInput === null) return;
  const time = parseTime(timeInput);
  if (time === null) {
    alert("시간 형식이 올바르지 않아요. 예: 09:00 또는 09 00");
    return;
  }

  const category = chooseCategory(target.category);
  if (category === null) return;

  target.title = title.trim() || target.title;
  target.date = date;
  target.time = time;
  target.category = category || target.category;

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

/* ---------- 필터 (드롭다운) ---------- */
function getMonthOptions() {
  const months = [...new Set(getSchedules().map((s) => s.date.slice(0, 7)))].sort();

  return [
    { value: "all", label: "전체" },
    ...months.map((m) => ({
      value: m,
      label: `${m.slice(0, 4)}년 ${Number(m.slice(5))}월`
    }))
  ];
}

function getCategoryOptions() {
  return [
    { value: "all", label: "전체" },
    ...loadCategories().map((c) => ({ value: c.name, label: c.name }))
  ];
}

function setupFilter(box, getOptions, key) {
  const valueEl = box.querySelector(".filterValue");
  const listEl = box.querySelector(".filterList");

  function buildList() {
    listEl.innerHTML = "";

    getOptions().forEach((opt) => {
      const li = document.createElement("li");
      li.textContent = opt.label;
      if (opt.value === filters[key]) li.classList.add("selected");

      li.addEventListener("click", (e) => {
        e.stopPropagation();          // 상자의 열기/닫기와 분리
        filters[key] = opt.value;
        valueEl.textContent = opt.label;
        box.classList.remove("open");
        renderSchedules();
      });

      listEl.appendChild(li);
    });
  }

  box.addEventListener("click", () => {
    const willOpen = !box.classList.contains("open");

    document.querySelectorAll(".filterBox.open").forEach((b) => b.classList.remove("open"));

    if (willOpen) {
      buildList();                    // 열 때마다 최신 목록으로 갱신
      box.classList.add("open");
    }
  });
}

setupFilter(dateFilterBox, getMonthOptions, "month");
setupFilter(categoryFilterBox, getCategoryOptions, "category");

// 바깥을 클릭하면 닫기
document.addEventListener("click", (e) => {
  if (!e.target.closest(".filterBox")) {
    document.querySelectorAll(".filterBox.open").forEach((b) => b.classList.remove("open"));
  }
});

/* ---------- 첫 로딩 ---------- */
renderSchedules();