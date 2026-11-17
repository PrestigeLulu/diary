const rows = document.querySelector(".scheduleRows");
const countEl = document.querySelector(".scheduleCount");
const dateFilterBox = document.querySelector("#dateFilter");
const categoryFilterBox = document.querySelector("#categoryFilter");
const listTitle = document.querySelector("#scheduleListTitle");

// 필터 상태 (month: all/"2026-09", category: all/이름)
const filters = { month: "all", category: "all" };

/* ---------- 카테고리 ---------- */
// 카테고리 불러오기 (설정 페이지와 키 공유)
function loadCategories() {
  return JSON.parse(localStorage.getItem("categories")) || [
    { id: "personal", name: "개인", color: "#7f9d87" },
    { id: "work", name: "업무", color: "#b96e4f" },
    { id: "appointment", name: "약속", color: "#78649b" }
  ];
}

// 카테고리 색상 (없으면 회색)
function getCategoryColor(name) {
  const c = loadCategories().find((c) => c.name === name);
  return c ? c.color : "#999999";
}

// 번호로 카테고리 선택 (취소 시 null)
function chooseCategory(defaultName) {
  const categories = loadCategories();

  // 번호 목록 문자열
  const list = categories
    .map((c, i) => `${i + 1}. ${c.name}`)
    .join("\n");

  // 기본 선택 번호
  const defaultIndex = Math.max(
    categories.findIndex((c) => c.name === defaultName),
    0
  ) + 1;

  const input = prompt(`카테고리를 번호로 선택하세요\n\n${list}`, defaultIndex);
  if (input === null) return null;

  // 번호 검증
  const picked = categories[Number(input.trim()) - 1];
  if (!picked) {
    alert("목록에 있는 번호를 입력해주세요.");
    return null;
  }
  return picked.name;
}

/* ---------- 데이터 ---------- */
// 일정 추가
function addSchedule(title, date, time, category) {
  const schedules = getSchedules();

  // 새 일정 (id 자동 증가)
  const newSchedule = {
    id: Number(localStorage.getItem("nextScheduleId") || 1),
    title,
    date,
    time,
    category
  };

  schedules.push(newSchedule);
  saveSchedules(schedules);

  // 다음 id 저장
  localStorage.setItem("nextScheduleId", newSchedule.id + 1);
}

// 일정 삭제
function deleteSchedule(id) {
  // 삭제 확인
  if (!confirm("이 일정을 삭제할까요?")) return;

  const schedules = getSchedules().filter((s) => s.id !== id);
  saveSchedules(schedules);
  renderSchedules();
}

/* ---------- 입력 검사 ---------- */
// 날짜 형식 검사
function isValidDate(text) {
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && !isNaN(new Date(text));
}

// 시간 형식 검사
function isValidTime(text) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(text);
}

// 시간 변환 ("09 00", "9:5", "0900" → "09:00") / 오류 시 null
function parseTime(text) {
  const match = text.trim().match(/^(\d{1,2})\s*[: ]\s*(\d{1,2})$|^(\d{2})(\d{2})$/);
  if (!match) return null;

  // 시, 분 추출
  const hour = Number(match[1] ?? match[3]);
  const minute = Number(match[2] ?? match[4]);

  // 범위 초과
  if (hour > 23 || minute > 59) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

// 년 → 월 → 일 순서로 입력 (결과 "YYYY-MM-DD", 취소/오류 시 null)
// defaultDate: 수정 시 현재 날짜 (기본값)
function askDate(defaultDate) {
  // 기본값 (없으면 오늘)
  const [dy, dm, dd] = defaultDate
    ? defaultDate.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate()];

  // 년도
  const yearInput = prompt("년도를 입력하세요 (예: 2026)", dy);
  if (yearInput === null) return null;
  const year = Number(yearInput.trim());
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    alert("년도는 1900~2100 사이의 숫자로 입력해주세요.");
    return null;
  }

  // 월
  const monthInput = prompt("월을 입력하세요 (1~12)", dm);
  if (monthInput === null) return null;
  const month = Number(monthInput.trim());
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    alert("월은 1~12 사이의 숫자로 입력해주세요.");
    return null;
  }

  // 말일 (윤년, 30/31일 자동)
  const lastDay = new Date(year, month, 0).getDate();

  // 일
  const dayInput = prompt(`일을 입력하세요 (1~${lastDay})`, dd);
  if (dayInput === null) return null;
  const day = Number(dayInput.trim());
  if (!Number.isInteger(day) || day < 1 || day > lastDay) {
    alert(`${month}월은 1~${lastDay}일까지 있어요.`);
    return null;
  }

  // 두 자리 맞춤
  const mm = String(month).padStart(2, "0");
  const dd2 = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd2}`;
}

/* ---------- 화면 그리기 ---------- */
// 요일 이름
const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

// HTML 이스케이프 (XSS 방지)
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// 일정 목록 렌더링
function renderSchedules() {
  const all = getSchedules();

  // 필터 적용
  const schedules = all.filter((s) =>
    (filters.month === "all" || s.date.startsWith(filters.month)) &&
    (filters.category === "all" || s.category === filters.category)
  );

  // 날짜+시간순 정렬
  schedules.sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time)
  );

  // 제목 갱신
  if (listTitle) {
    listTitle.textContent =
      filters.month === "all"
        ? "전체 일정"
        : `${Number(filters.month.slice(5))}월의 일정`;
  }

  // 개수 갱신
  if (countEl) {
    countEl.textContent = `총 ${schedules.length}개의 일정`;
  }

  // 빈 목록 처리 (전체 없음 / 조건 불일치)
  if (schedules.length === 0) {
    rows.innerHTML = `<p class="scheduleEmpty">${
      all.length === 0 ? "등록된 일정이 없어요." : "조건에 맞는 일정이 없어요."
    }</p>`;
    return;
  }

  // 목록 HTML 생성
  rows.innerHTML = schedules
    .map((s) => {
      // 날짜 표시용 값
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

/* ---------- 일정 추가 ---------- */
document.querySelector(".scheduleAdd").addEventListener("click", function () {
  // 제목
  const title = prompt("일정 제목을 입력하세요");
  if (!title || !title.trim()) return;

  // 날짜
  const date = askDate();
  if (date === null) return;

  // 시간
  const timeInput = prompt("시간을 입력하세요 (예: 09:00 또는 09 00)");
  if (timeInput === null) return;
  const time = parseTime(timeInput);
  if (time === null) {
    alert("시간 형식이 올바르지 않아요. 예: 09:00 또는 09 00");
    return;
  }

  // 카테고리
  const category = chooseCategory();
  if (category === null) return;

  // 저장 후 다시 그리기
  addSchedule(title.trim(), date, time, category);
  renderSchedules();
});

/* ---------- 일정 수정 ---------- */
function editSchedule(id) {
  const schedules = getSchedules();
  const target = schedules.find((s) => s.id === id);
  if (!target) return;

  // 제목 (현재 값 기본)
  const title = prompt("일정 제목", target.title);
  if (title === null) return;

  // 날짜 (현재 값 기본)
  const date = askDate(target.date);
  if (date === null) return;

  // 시간 (현재 값 기본)
  const timeInput = prompt("시간 (예: 09:00 또는 09 00)", target.time);
  if (timeInput === null) return;
  const time = parseTime(timeInput);
  if (time === null) {
    alert("시간 형식이 올바르지 않아요. 예: 09:00 또는 09 00");
    return;
  }

  // 카테고리 (현재 값 기본)
  const category = chooseCategory(target.category);
  if (category === null) return;

  // 값 반영 (빈 값이면 기존 유지)
  target.title = title.trim() || target.title;
  target.date = date;
  target.time = time;
  target.category = category || target.category;

  saveSchedules(schedules);
  renderSchedules();
}

/* ---------- 수정/삭제 버튼 (이벤트 위임) ---------- */
rows.addEventListener("click", function (e) {
  // 버튼 아니면 무시
  const button = e.target.closest("button");
  if (!button) return;

  // 소속 일정 행
  const row = button.closest(".scheduleListBox");
  if (!row) return;

  const id = Number(row.dataset.id);

  // 동작 분기
  if (button.dataset.action === "delete") {
    deleteSchedule(id);
  } else if (button.dataset.action === "edit") {
    editSchedule(id);
  }
});

// js/theme.js
// 테마 적용 (저장값 없으면 라이트)
document.documentElement.setAttribute(
  "data-theme",
  localStorage.getItem("theme") === "dark" ? "dark" : "light"
);

/* ---------- 필터 (드롭다운) ---------- */
// 월 옵션 (일정 있는 월만)
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

// 카테고리 옵션
function getCategoryOptions() {
  return [
    { value: "all", label: "전체" },
    ...loadCategories().map((c) => ({ value: c.name, label: c.name }))
  ];
}

// 필터 드롭다운 설정
function setupFilter(box, getOptions, key) {
  const valueEl = box.querySelector(".filterValue");
  const listEl = box.querySelector(".filterList");

  // 옵션 목록 생성
  function buildList() {
    listEl.innerHTML = "";

    getOptions().forEach((opt) => {
      const li = document.createElement("li");
      li.textContent = opt.label;
      // 현재 선택값 표시
      if (opt.value === filters[key]) li.classList.add("selected");

      li.addEventListener("click", (e) => {
        e.stopPropagation();          // 열기/닫기와 분리
        filters[key] = opt.value;
        valueEl.textContent = opt.label;
        box.classList.remove("open");
        renderSchedules();
      });

      listEl.appendChild(li);
    });
  }

  // 열기/닫기 토글
  box.addEventListener("click", () => {
    const willOpen = !box.classList.contains("open");

    // 다른 드롭다운 닫기
    document.querySelectorAll(".filterBox.open").forEach((b) => b.classList.remove("open"));

    if (willOpen) {
      buildList();                    // 열 때마다 최신 목록
      box.classList.add("open");
    }
  });
}

// 필터 등록
setupFilter(dateFilterBox, getMonthOptions, "month");
setupFilter(categoryFilterBox, getCategoryOptions, "category");

// 바깥 클릭 시 닫기
document.addEventListener("click", (e) => {
  if (!e.target.closest(".filterBox")) {
    document.querySelectorAll(".filterBox.open").forEach((b) => b.classList.remove("open"));
  }
});

/* ---------- 첫 로딩 ---------- */
// 최초 렌더링
renderSchedules();