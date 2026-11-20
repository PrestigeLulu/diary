// 일정 목록과 개수, 날짜 필터, 카테고리 필터 요소 불러오기
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

// 카테고리 이름에 맞는 색상을 찾고 없으면 회색을 반환하는 함수
function getCategoryColor(name) {
  const c = loadCategories().find((c) => c.name === name);
  return c ? c.color : "#999999";
}

// 번호 목록을 보여주고 카테고리 이름을 돌려줌 (취소하면 null)
function chooseCategory(defaultName) {
  const categories = loadCategories();

  // 카테고리 이름 앞에 번호를 붙이고 줄바꿈으로 연결해 선택 목록 생성
  const list = categories
    .map((c, i) => `${i + 1}. ${c.name}`)
    .join("\n");

  // 수정 중인 카테고리의 번호를 기본값으로 사용하고 없으면 첫 번째 번호 사용
  const defaultIndex = Math.max(
    categories.findIndex((c) => c.name === defaultName),
    0
  ) + 1;

  const input = prompt(`카테고리를 번호로 선택하세요\n\n${list}`, defaultIndex);
  if (input === null) return null;

  // 입력한 번호에 맞는 카테고리를 찾고 목록에 없는 번호면 안내 후 종료
  const picked = categories[Number(input.trim()) - 1];
  if (!picked) {
    alert("목록에 있는 번호를 입력해주세요.");
    return null;
  }
  return picked.name;
}

/* ---------- 데이터 ---------- */
// 제목과 날짜, 시간, 카테고리를 받아 새 일정을 저장하는 함수
function addSchedule(title, date, time, category) {
  const schedules = getSchedules();

  // 다음 일정 번호를 불러와 새 일정 데이터 생성
  const newSchedule = {
    id: Number(localStorage.getItem("nextScheduleId") || 1),
    title,
    date,
    time,
    category
  };

  // 목록에 새 일정을 추가해 저장하고 다음에 사용할 번호 증가
  schedules.push(newSchedule);
  saveSchedules(schedules);

  localStorage.setItem("nextScheduleId", newSchedule.id + 1);
}

// 삭제 여부를 확인한 다음 해당 id의 일정을 제외하고 저장하는 함수
function deleteSchedule(id) {
  if (!confirm("이 일정을 삭제할까요?")) return;

  const schedules = getSchedules().filter((s) => s.id !== id);
  saveSchedules(schedules);
  renderSchedules();
}

/* ---------- 입력 검사 ---------- */
// YYYY-MM-DD 형식이고 Date로 읽을 수 있는 값인지 확인하는 함수
function isValidDate(text) {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !isNaN(new Date(text));
}

// 시간이 00:00부터 23:59 사이의 HH:MM 형식인지 확인하는 함수
function isValidTime(text) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text);
}

// "09:00", "09 00", "9:5", "0900" 등을 "09:00"으로 변환 (형식이 틀리면 null)
function parseTime(text) {
  const match = text.trim().match(/^(\d{1,2})\s*[: ]\s*(\d{1,2})$|^(\d{2})(\d{2})$/);
  if (!match) return null;

  // 구분자 유무에 맞춰 정규식에서 찾은 시와 분을 숫자로 변환
  const hour = Number(match[1] ?? match[3]);
  const minute = Number(match[2] ?? match[4]);

  if (hour > 23 || minute > 59) return null;

  // 시와 분을 두 자리로 맞춰 HH:MM 형태로 반환
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// 년 → 월 → 일을 따로 받아서 "YYYY-MM-DD"로 돌려줌 (취소/오류면 null)
// defaultDate: "2026-09-09" 형태 (수정할 때 현재 값을 기본값으로 보여줌)
function askDate(defaultDate) {
  // 기존 날짜가 있으면 입력 기본값으로 사용하고 없으면 오늘 날짜 사용
  const [dy, dm, dd] = defaultDate
    ? defaultDate.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];

  // 연도를 입력받고 정수이며 허용 범위 안에 있는지 검사
  const yearInput = prompt("년도를 입력하세요 (예: 2026)", dy);
  if (yearInput === null) return null;
  const year = Number(yearInput.trim());
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    alert("년도는 1900~2100 사이의 숫자로 입력해주세요.");
    return null;
  }

  // 월을 입력받고 1부터 12 사이의 정수인지 검사
  const monthInput = prompt("월을 입력하세요 (1~12)", dm);
  if (monthInput === null) return null;
  const month = Number(monthInput.trim());
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    alert("월은 1~12 사이의 숫자로 입력해주세요.");
    return null;
  }

  // 해당 월의 마지막 날 (윤년, 30/31일 자동 계산)
  const lastDay = new Date(year, month, 0).getDate();

  // 일을 입력받고 해당 월의 마지막 날짜를 넘지 않는지 검사
  const dayInput = prompt(`일을 입력하세요 (1~${lastDay})`, dd);
  if (dayInput === null) return null;
  const day = Number(dayInput.trim());
  if (!Number.isInteger(day) || day < 1 || day > lastDay) {
    alert(`${month}월은 1~${lastDay}일까지 있어요.`);
    return null;
  }

  // 월과 일을 두 자리로 맞춰 YYYY-MM-DD 형태로 반환
  const mm = String(month).padStart(2, "0");
  const dd2 = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd2}`;
}

/* ---------- 화면 그리기 ---------- */
const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

// 입력한 문자가 HTML 태그로 해석되지 않도록 텍스트로 바꾸는 함수
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 현재 필터 조건에 맞는 일정을 정렬해서 목록에 표시하는 함수
function renderSchedules() {
  const all = getSchedules();

  // 전체 일정에서 선택한 월과 카테고리에 모두 맞는 항목만 필터링
  const schedules = all.filter((s) =>
    (filters.month === "all" || s.date.startsWith(filters.month)) &&
    (filters.category === "all" || s.category === filters.category)
  );

  // 날짜와 시간을 합친 문자열로 비교해 빠른 일정부터 정렬
  schedules.sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  );

  // 목록 제목 요소가 있으면 선택한 월에 맞는 제목 표시
  if (listTitle) {
    listTitle.textContent =
      filters.month === "all"
        ? "전체 일정"
        : `${Number(filters.month.slice(5))}월의 일정`;
  }

  // 필터링된 일정 개수를 화면에 표시
  if (countEl) {
    countEl.textContent = `총 ${schedules.length}개의 일정`;
  }

  // 등록된 일정이 없는 경우와 필터 결과가 없는 경우를 구분해 안내
  if (schedules.length === 0) {
    rows.innerHTML = `<p class="scheduleEmpty">${
      all.length === 0 ? "등록된 일정이 없어요." : "조건에 맞는 일정이 없어요."
    }</p>`;
    return;
  }

  // 각 일정의 날짜, 시간, 카테고리, 수정과 삭제 버튼을 HTML로 생성
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

  // 날짜, 시간, 카테고리를 순서대로 입력받고 취소하면 추가 중단
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

  // 입력값을 저장하고 일정 목록을 다시 렌더링
  addSchedule(title.trim(), date, time, category);
  renderSchedules();
});

/* ---------- 일정 수정 (prompt) ---------- */
function editSchedule(id) {
  const schedules = getSchedules();
  // 수정할 id와 같은 일정을 찾고 없으면 함수 종료
  const target = schedules.find((s) => s.id === id);
  if (!target) return;

  // 기존 값을 기본값으로 보여주고 수정할 내용을 입력받음
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

  // 입력받은 값으로 일정을 수정하고 비어 있는 제목은 기존 제목 유지
  target.title = title.trim() || target.title;
  target.date = date;
  target.time = time;
  target.category = category || target.category;

  saveSchedules(schedules);
  renderSchedules();
}

/* ---------- 수정 / 삭제 버튼 (이벤트 위임) ---------- */
rows.addEventListener("click", function (e) {
  // 목록 안에서 클릭한 수정 또는 삭제 버튼을 찾아 처리
  const button = e.target.closest("button");
  if (!button) return;

  const row = button.closest(".scheduleListBox");
  if (!row) return;

  // 버튼이 속한 행의 일정 번호를 읽어 수정 또는 삭제 함수 실행
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
// 등록된 일정의 연도와 월을 중복 없이 모아 날짜 필터 목록으로 반환
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

// 설정에 저장된 카테고리를 필터에서 선택할 목록으로 반환
function getCategoryOptions() {
  return [
    { value: "all", label: "전체" },
    ...loadCategories().map((c) => ({ value: c.name, label: c.name }))
  ];
}

// 날짜와 카테고리 필터에 드롭다운 열기와 선택 이벤트를 연결하는 함수
function setupFilter(box, getOptions, key) {
  const valueEl = box.querySelector(".filterValue");
  const listEl = box.querySelector(".filterList");

  // 현재 저장된 데이터에 맞춰 필터 선택 목록을 다시 만드는 함수
  function buildList() {
    listEl.innerHTML = "";

    getOptions().forEach((opt) => {
      const li = document.createElement("li");
      li.textContent = opt.label;
      if (opt.value === filters[key]) li.classList.add("selected");

      // 항목을 선택하면 필터 값과 표시 문구를 바꾸고 일정 목록 갱신
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

  // 다른 필터는 닫고 클릭한 필터의 목록을 열거나 닫음
  box.addEventListener("click", () => {
    const willOpen = !box.classList.contains("open");

    document.querySelectorAll(".filterBox.open").forEach((b) => b.classList.remove("open"));

    if (willOpen) {
      buildList();                    // 열 때마다 최신 목록으로 갱신
      box.classList.add("open");
    }
  });
}

// 날짜 필터와 카테고리 필터를 각각 연결
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