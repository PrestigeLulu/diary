// 공휴일 계산 결과를 연도별로 보관합니다. 외부 요청 없이 HTML 파일에서도 동작합니다.
const calendarHolidayCache = new Map();
function getCalendarHolidays(year) {
  if (calendarHolidayCache.has(year)) return calendarHolidayCache.get(year);
  const holidays = new Map();
  const groups = [];
  const keyOf = date => date.toISOString().slice(0, 10);
  const addGroup = (name, dates, substitute = "none") => {
    groups.push({ name, dates, substitute });
    dates.forEach(date => {
      const key = keyOf(date);
      holidays.set(key, [...(holidays.get(key) || []), name]);
    });
  };
  const solar = (month, day) => new Date(Date.UTC(year, month - 1, day));
  const nationalSubstitute = year >= 2022 ? "weekend" : "none";
  addGroup("신정", [solar(1, 1)]);
  addGroup("삼일절", [solar(3, 1)], nationalSubstitute);
  addGroup("어린이날", [solar(5, 5)], year >= 2014 ? "weekend" : "none");
  addGroup("현충일", [solar(6, 6)]);
  addGroup("광복절", [solar(8, 15)], year >= 2021 ? "weekend" : "none");
  addGroup("개천절", [solar(10, 3)], year >= 2021 ? "weekend" : "none");
  if (year >= 2013) addGroup("한글날", [solar(10, 9)], year >= 2021 ? "weekend" : "none");
  addGroup("성탄절", [solar(12, 25)], year >= 2023 ? "weekend" : "none");
  // 2026년 공휴일 지정 사항 반영.
  if (year >= 2026) {
    addGroup("노동절", [solar(5, 1)], "weekend");
    addGroup("제헌절", [solar(7, 17)], "weekend");
  }
  if (year === 2026) addGroup("전국동시지방선거", [solar(6, 3)]);

  // 한국 음력(dangi)으로 설날, 부처님오신날, 추석을 찾습니다. 윤달은 제외합니다.
  const lunar = new Intl.DateTimeFormat("en-u-ca-dangi", {
    month: "numeric", day: "numeric", timeZone: "Asia/Seoul"
  });
  for (let date = solar(1, 1); date.getUTCFullYear() === year; date.setUTCDate(date.getUTCDate() + 1)) {
    const parts = lunar.formatToParts(date);
    const month = parts.find(part => part.type === "month")?.value;
    const day = Number(parts.find(part => part.type === "day")?.value);
    if ((month === "1" && day === 1) || (month === "8" && day === 15)) {
      const dates = [-1, 0, 1].map(offset => new Date(date.getTime() + offset * 86400000));
      addGroup(month === "1" ? "설날 연휴" : "추석 연휴", dates, year >= 2014 ? "sunday" : "none");
    }
    if (month === "4" && day === 8) {
      addGroup("부처님오신날", [new Date(date)], year >= 2023 ? "weekend" : "none");
    }
  }
  // 설·추석은 토요일만 겹칠 때 대체하지 않습니다. 신정·현충일도 대체 대상이 아닙니다.
  groups.sort((a, b) => a.dates[0] - b.dates[0]).forEach(group => {
    if (group.substitute === "none") return;
    const overlaps = group.dates.some(date => {
      const weekday = date.getUTCDay();
      return weekday === 0 || (group.substitute === "weekend" && weekday === 6)
        || holidays.get(keyOf(date)).length > 1;
    });
    if (!overlaps) return;
    const substitute = new Date(group.dates[group.dates.length - 1]);
    do { substitute.setUTCDate(substitute.getUTCDate() + 1); }
    while (substitute.getUTCDay() === 0 || substitute.getUTCDay() === 6 || holidays.has(keyOf(substitute)));
    holidays.set(keyOf(substitute), [`대체공휴일 (${group.name})`]);
  });
  calendarHolidayCache.set(year, holidays);
  return holidays;
}

const monthHeading = document.querySelector(".calendar-month");
const weekdaysContainer = document.querySelector(".calendar-weekdays");
const daysContainer = document.querySelector(".calendar-days");
const previousMonthButton = document.querySelector("#previous-month");
const nextMonthButton = document.querySelector("#next-month");

if (
	monthHeading &&
	weekdaysContainer &&
	daysContainer &&
	previousMonthButton &&
	nextMonthButton
) {
	const today = new Date();
	let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

	const renderCalendar = () => {
		const year = displayedMonth.getFullYear();
		const month = displayedMonth.getMonth();
		const firstWeekday = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const holidays = getCalendarHolidays(year);

		monthHeading.textContent = new Intl.DateTimeFormat("ko-KR", {
			year: "numeric",
			month: "long",
		}).format(displayedMonth);
		daysContainer.setAttribute("aria-label", `${year}년 ${month + 1}월 날짜`);
		weekdaysContainer.replaceChildren();
		daysContainer.replaceChildren();

		weekdays.forEach((weekday, index) => {
			const label = document.createElement("span");
			label.className = "calendar-weekday";
			label.textContent = weekday;
			if (index === 0) label.classList.add("is-sunday");
			if (index === 6) label.classList.add("is-saturday");
			weekdaysContainer.append(label);
		});

		for (let cell = 0; cell < firstWeekday; cell += 1) {
			const emptyCell = document.createElement("span");
			emptyCell.className = "calendar-empty";
			emptyCell.setAttribute("aria-hidden", "true");
			daysContainer.append(emptyCell);
		}

		for (let day = 1; day <= daysInMonth; day += 1) {
			const dateCell = document.createElement("div");
			const dateLabel = document.createElement("time");
			const todoInput = document.createElement("textarea");
			const weekday = new Date(year, month, day).getDay();
			const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
			dateCell.className = "calendar-day";
			dateLabel.className = "calendar-date";
			dateLabel.dateTime = dateKey;
			dateLabel.textContent = String(day);
            const holidayNames = holidays.get(dateKey);
            if (holidayNames) {
              dateCell.classList.add("is-holiday");
              dateLabel.title = holidayNames.join(" · ");
              dateLabel.setAttribute("aria-label", `${month + 1}월 ${day}일 ${holidayNames.join(", ")}`);
            }
			todoInput.className = "calendar-todo-input";
			todoInput.rows = 2;
			todoInput.setAttribute("aria-label", `${month + 1}월 ${day}일 할 일`);
			window.bindCalendarTodo(todoInput, dateKey);
			dateCell.append(dateLabel, todoInput);

			if (weekday === 0) dateCell.classList.add("is-sunday");
			if (weekday === 6) dateCell.classList.add("is-saturday");
			if (
				year === today.getFullYear() &&
				month === today.getMonth() &&
				day === today.getDate()
			) {
				dateCell.classList.add("is-today");
				dateCell.setAttribute("aria-current", "date");
			}

			daysContainer.append(dateCell);
		}
	};

	previousMonthButton.addEventListener("click", () => {
		displayedMonth = new Date(
			displayedMonth.getFullYear(),
			displayedMonth.getMonth() - 1,
			1,
		);
		renderCalendar();
	});

	nextMonthButton.addEventListener("click", () => {
		displayedMonth = new Date(
			displayedMonth.getFullYear(),
		displayedMonth.getMonth() + 1,
			1,
		);
		renderCalendar();
	});

	renderCalendar();
}

// 기존 할 일 저장소를 공유하고, 미완료인 중요 항목과 마감일을 표시합니다.
const deadlineList = document.querySelector("#deadline-list");
const deadlineMessage = document.querySelector("#deadline-message");
function readDeadlineTodos() {
  const todos = JSON.parse(localStorage.getItem("todos") || "[]");
  if (!Array.isArray(todos)) throw new Error("잘못된 할 일 데이터");
  return todos;
}
// 날짜 단위로 비교하여 시간대와 서머타임에 따른 오차를 방지합니다.
function deadlineDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date.getTime() / 86400000;
}
function renderDeadlines() {
  if (!deadlineList) return;
  try {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const todayDay = deadlineDay(todayKey);
    const todos = readDeadlineTodos()
      .filter(todo => todo && !todo.completed && (todo.priority === "high" || deadlineDay(todo.dueDate) !== null))
      .sort((a, b) => (deadlineDay(a.dueDate) ?? Infinity) - (deadlineDay(b.dueDate) ?? Infinity));
    deadlineList.replaceChildren();
    if (!todos.length) {
      const empty = document.createElement("li");
      empty.className = "deadline-empty";
      empty.textContent = "중요하거나 마감일이 있는 미완료 할 일이 없습니다.";
      deadlineList.append(empty);
    }
    todos.forEach(todo => {
      const item = document.createElement("li");
      item.className = "deadline-item";
      const info = document.createElement("div");
      info.className = "deadline-info";
      const title = document.createElement("strong");
      title.textContent = `${todo.priority === "high" ? "★ " : ""}${todo.title}`;
      const date = document.createElement("small");
      const day = deadlineDay(todo.dueDate);
      date.textContent = day === null ? "마감일 미지정" : `마감 ${todo.dueDate}`;
      info.append(title, date);
      const badge = document.createElement("span");
      badge.className = "deadline-badge";
      const remaining = day === null ? null : day - todayDay;
      badge.textContent = remaining === null ? "중요" : remaining < 0 ? `${-remaining}일 지남` : remaining === 0 ? "D-Day" : `D-${remaining}`;
      if (remaining !== null && remaining <= 3) badge.classList.add("is-urgent");
      item.append(info, badge);
      deadlineList.append(item);
    });
  } catch {
    deadlineMessage.textContent = "저장된 할 일을 불러오지 못했습니다. 저장소 설정을 확인해 주세요.";
  }
}
if (deadlineList) {
  window.addEventListener("storage", renderDeadlines);
  window.addEventListener("focus", renderDeadlines);
  // 페이지를 계속 열어 두어도 자정 이후 남은 기한을 갱신합니다.
  setInterval(renderDeadlines, 60000);
  renderDeadlines();
}
// 하단 바를 누르면 목록을 펼치고, 바깥 영역이나 Esc 키로 닫습니다.
const deadlinePanel = document.querySelector("#deadline-panel");
const deadlineToggle = document.querySelector("#deadline-toggle");
const deadlineContent = document.querySelector("#deadline-content");
const deadlineBackdrop = document.querySelector("#deadline-backdrop");
if (deadlinePanel && deadlineToggle && deadlineContent && deadlineBackdrop) {
  function setDeadlineOpen(open) {
    deadlinePanel.classList.toggle("is-open", open);
    deadlineToggle.setAttribute("aria-expanded", String(open));
    deadlineContent.inert = !open;
    deadlineBackdrop.hidden = !open;
    if (open) renderDeadlines();
    else if (deadlineContent.contains(document.activeElement)) deadlineToggle.focus();
  }
  deadlineToggle.addEventListener("click", () => {
    setDeadlineOpen(deadlineToggle.getAttribute("aria-expanded") !== "true");
  });
  deadlineBackdrop.addEventListener("click", () => setDeadlineOpen(false));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && deadlineToggle.getAttribute("aria-expanded") === "true") {
      setDeadlineOpen(false);
      deadlineToggle.focus();
    }
  });
}
// 하루 동안 같은 글귀를 유지하고, 다음 날에는 직전과 다른 글귀를 선택합니다.
const encouragementElement = document.querySelector("#daily-encouragement");
const encouragementQuotes = [
  "오늘도 당신의 속도로, 한 걸음씩 나아가요.",
  "조금 느려도 괜찮아요. 당신은 앞으로 가고 있어요.",
  "오늘 해낸 작은 일도 충분히 소중해요.",
  "잠깐 쉬어 가도 괜찮아요. 쉼도 하루의 일부니까요.",
  "완벽하지 않아도 괜찮아요. 시작한 것만으로도 의미 있어요.",
  "어제보다 작은 한 걸음, 그것만으로도 충분해요.",
  "모든 일을 다 하지 못해도, 당신의 하루는 소중해요.",
  "힘든 날에는 스스로에게 조금 더 다정해져요.",
  "지금의 작은 노력이 내일의 당신을 도와줄 거예요.",
  "오늘도 여기까지 온 당신, 수고 많았어요.",
  "잘하고 싶은 마음만큼, 자신을 아끼는 마음도 챙겨요.",
  "새로운 하루에는 다시 시작할 기회가 있어요."
];
let dailyEncouragement = null;
function renderDailyEncouragement() {
  if (!encouragementElement) return;
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  let saved = dailyEncouragement;
  try {
    const stored = JSON.parse(localStorage.getItem("diary-daily-encouragement"));
    if (stored && encouragementQuotes.includes(stored.quote)) saved = stored;
  } catch {
    // 저장소를 사용할 수 없어도 현재 페이지에서는 글귀를 표시합니다.
  }
  if (!saved || saved.date !== date) {
    const candidates = encouragementQuotes.filter(quote => quote !== saved?.quote);
    saved = { date, quote: candidates[Math.floor(Math.random() * candidates.length)] };
    try {
      localStorage.setItem("diary-daily-encouragement", JSON.stringify(saved));
    } catch {
      // 저장이 제한된 환경에서는 메모리에 보관합니다.
    }
  }
  dailyEncouragement = saved;
  encouragementElement.textContent = saved.quote;
}
if (encouragementElement) {
  renderDailyEncouragement();
  window.addEventListener("focus", renderDailyEncouragement);
  window.addEventListener("storage", renderDailyEncouragement);
  // 자정이 지난 뒤에도 페이지를 새로 열지 않고 글귀를 갱신합니다.
  setInterval(renderDailyEncouragement, 60000);
}