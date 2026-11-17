// ===== 공휴일 계산 =====
// 한 번 계산한 공휴일은 연도별로 저장해 두고 다시 사용함
const calendarHolidayCache = new Map();
function getCalendarHolidays(year) {
  if (calendarHolidayCache.has(year)) return calendarHolidayCache.get(year);
  // 날짜별 공휴일 이름과 연휴 묶음을 따로 보관함
  const holidays = new Map();
  const groups = [];
  const keyOf = date => date.toISOString().slice(0, 10);
  // 같은 날짜에 공휴일이 겹치면 이름을 모두 넣음
  const addGroup = (name, dates, substitute = "none") => {
    groups.push({ name, dates, substitute });
    dates.forEach(date => {
      const key = keyOf(date);
      holidays.set(key, [...(holidays.get(key) || []), name]);
    });
  };
  // 양력 공휴일 등록. 대체공휴일 적용 여부는 연도별로 구분함
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
  // 2026년 공휴일 지정 사항 반영함
  if (year >= 2026) {
    addGroup("노동절", [solar(5, 1)], "weekend");
    addGroup("제헌절", [solar(7, 17)], "weekend");
  }
  if (year === 2026) addGroup("전국동시지방선거", [solar(6, 3)]);

  // 1년을 하루씩 확인하면서 음력 공휴일 찾음. 윤달은 제외함
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
  // 대체 대상인 공휴일이 주말이나 다른 공휴일과 겹치면 다음 빈 평일 찾음
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
  // 계산이 끝난 연도는 다음에 바로 꺼내 쓸 수 있게 저장함
  calendarHolidayCache.set(year, holidays);
  return holidays;
}

// ===== 월간 달력 표시 =====
// 달력 제목, 요일 줄, 날짜 칸, 월 이동 버튼 가져옴
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

	// 현재 보고 있는 달에 맞춰 달력 다시 그림
	const renderCalendar = () => {
		const year = displayedMonth.getFullYear();
		const month = displayedMonth.getMonth();
		const firstWeekday = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const holidays = getCalendarHolidays(year);
    const schedules = getSchedules();

		// 상단 연월을 바꾸고 이전에 그린 요일과 날짜 칸 비움
		monthHeading.textContent = new Intl.DateTimeFormat("ko-KR", {
			year: "numeric",
			month: "long",
		}).format(displayedMonth);
		daysContainer.setAttribute("aria-label", `${year}년 ${month + 1}월 날짜`);
		weekdaysContainer.replaceChildren();
		daysContainer.replaceChildren();

		// 일요일부터 토요일까지 요일 줄 생성함
		weekdays.forEach((weekday, index) => {
			const label = document.createElement("span");
			label.className = "calendar-weekday";
			label.textContent = weekday;
			if (index === 0) label.classList.add("is-sunday");
			if (index === 6) label.classList.add("is-saturday");
			weekdaysContainer.append(label);
		});

		// 1일이 시작하는 요일 앞까지 빈 칸 채움
		for (let cell = 0; cell < firstWeekday; cell += 1) {
			const emptyCell = document.createElement("span");
			emptyCell.className = "calendar-empty";
			emptyCell.setAttribute("aria-hidden", "true");
			daysContainer.append(emptyCell);
		}

		// 1일부터 마지막 날까지 날짜 칸 생성함
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
            // 공휴일이면 강조 표시하고 날짜에 공휴일 이름 붙임
            const holidayNames = holidays.get(dateKey);
            if (holidayNames) {
              dateCell.classList.add("is-holiday");
              dateLabel.title = holidayNames.join(" · ");
              dateLabel.setAttribute("aria-label", `${month + 1}월 ${day}일 ${holidayNames.join(", ")}`);
            }
			// 날짜별 할 일 입력란을 저장 기능에 연결함
			todoInput.className = "calendar-todo-input";
			todoInput.rows = 2;
			todoInput.setAttribute("aria-label", `${month + 1}월 ${day}일 할 일`);
			bindCalendarTodo(todoInput, dateKey);
			
      const scheduleList = document.createElement("div");
      scheduleList.className = "calendar-schedules";

      // 이 날짜의 일정만 골라 시간순으로 표시함
      schedules
          .filter(schedule => schedule.date === dateKey)
          .sort((a, b) => a.time.localeCompare(b.time))
          .forEach(schedule => {
              const event = document.createElement("div");
              event.className = "calendar-event";

              event.textContent = `${schedule.time} ${schedule.title}`;
              event.title = `${schedule.title} (${schedule.category})`;

              scheduleList.append(event);
          });

      // 날짜, 일정, 할 일을 한 칸에 넣고 주말과 오늘 날짜 표시함
      dateCell.append(dateLabel, scheduleList, todoInput);
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

        // 마지막 주의 빈 칸 채움
        while (daysContainer.children.length % 7 !== 0) {
            const empty = document.createElement("span");
            empty.className = "calendar-empty";
            empty.setAttribute("aria-hidden", "true");
            daysContainer.append(empty);
        }
    };  

	// 이전 달 버튼: 한 달 뒤로 이동한 뒤 달력 다시 그림
	previousMonthButton.addEventListener("click", () => {
		displayedMonth = new Date(
			displayedMonth.getFullYear(),
			displayedMonth.getMonth() - 1,
			1,
		);
		renderCalendar();
	});

	// 다음 달 버튼: 한 달 앞으로 이동함
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

// ===== 일정 및 마감일 목록 =====
// 저장된 일정과 D-Day를 보여 줄 목록을 가져옴
const deadlineList = document.querySelector("#deadline-list");
const deadlineMessage = document.querySelector("#deadline-message");
function readDeadlineTodos() {
  return getSchedules();
}
// 날짜 형식을 확인하고 일 단위 숫자로 바꿈
function deadlineDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date.getTime() / 86400000;
}

// 날짜가 유효한 일정을 날짜·시간순으로 정렬해 마감 목록 생성함
function renderDeadlines() {
    if (!deadlineList) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const schedules = getSchedules()
        .filter(s => s.date && !isNaN(new Date(`${s.date}T00:00:00`)))
        .sort((a, b) =>
            `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`)
        );

    deadlineList.replaceChildren();

    // 일정이 없으면 안내 문구만 표시함
    if (!schedules.length) {
        const empty = document.createElement("li");
        empty.className = "deadline-empty";
        empty.textContent = "등록된 일정이 없습니다.";
        deadlineList.append(empty);
        return;
    }

    schedules.forEach(schedule => {
        // 오늘부터 며칠 남았는지 계산함. 지난 일정은 음수로 나옴
        const date = new Date(`${schedule.date}T00:00:00`);
        const remaining = Math.round((date - today) / 86400000);

        const item = document.createElement("li");
        item.className = "deadline-item";

        const info = document.createElement("div");
        info.className = "deadline-info";

        const title = document.createElement("strong");
        title.textContent = schedule.title;

        const detail = document.createElement("small");
        detail.textContent = `${schedule.date} ${schedule.time || ""} · ${schedule.category || "일정"}`;

        // 지난 날짜는 경과 일수, 오늘은 D-Day, 이후는 D-남은 일수로 표시함
        const badge = document.createElement("span");
        badge.className = "deadline-badge";
        badge.textContent =
            remaining < 0 ? `${-remaining}일 지남` :
            remaining === 0 ? "D-Day" : `D-${remaining}`;

        // 오늘부터 3일 안에 잡힌 일정은 눈에 띄게 표시함
        if (remaining >= 0 && remaining <= 3) {
            badge.classList.add("is-urgent");
        }

        info.append(title, detail);
        item.append(info, badge);
        deadlineList.append(item);
    });
}

// 다른 탭에서 저장했거나 이 창으로 돌아왔을 때 목록 새로 불러옴
if (deadlineList) {
  window.addEventListener("storage", renderDeadlines);
  window.addEventListener("focus", renderDeadlines);
  // 날짜가 바뀐 경우를 위해 1분마다 남은 날짜 다시 계산함
  setInterval(renderDeadlines, 60000);
  renderDeadlines();
}
// ===== 마감일 패널 열기/닫기 =====
// 패널과 열기 버튼, 내용 영역, 뒤쪽 배경 가져옴
const deadlinePanel = document.querySelector("#deadline-panel");
const deadlineToggle = document.querySelector("#deadline-toggle");
const deadlineContent = document.querySelector("#deadline-content");
const deadlineBackdrop = document.querySelector("#deadline-backdrop");
if (deadlinePanel && deadlineToggle && deadlineContent && deadlineBackdrop) {
  // 패널 표시와 버튼 상태를 함께 변경함. 닫힌 내용은 키보드로 접근하지 못하게 처리함
  function setDeadlineOpen(open) {
    deadlinePanel.classList.toggle("is-open", open);
    deadlineToggle.setAttribute("aria-expanded", String(open));
    deadlineContent.inert = !open;
    deadlineBackdrop.hidden = !open;
    if (open) renderDeadlines();
    else if (deadlineContent.contains(document.activeElement)) deadlineToggle.focus();
  }
  // 버튼으로 열고 닫음. 배경을 누르거나 Esc를 눌러도 닫힘
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
// ===== 오늘의 응원 문구 =====
// 오늘 보여 줄 문구 후보. 하루 동안은 같은 문구 사용함
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
  // 저장된 문구가 후보 목록에 있으면 그대로 사용함
  let saved = dailyEncouragement;
  try {
    const stored = JSON.parse(localStorage.getItem("diary-daily-encouragement"));
    if (stored && encouragementQuotes.includes(stored.quote)) saved = stored;
  } catch {
    // 저장된 값을 못 읽으면 이 페이지에서 기억해 둔 문구 사용함
  }
  // 날짜가 바뀌었으면 직전 문구를 빼고 무작위로 하나 뽑음
  if (!saved || saved.date !== date) {
    const candidates = encouragementQuotes.filter(quote => quote !== saved?.quote);
    saved = { date, quote: candidates[Math.floor(Math.random() * candidates.length)] };
    try {
      localStorage.setItem("diary-daily-encouragement", JSON.stringify(saved));
    } catch {
      // 저장이 안 돼도 아래 변수에 담아 페이지가 열린 동안 유지함
    }
  }
  dailyEncouragement = saved;
  encouragementElement.textContent = saved.quote;
}
// 처음 문구를 띄우고, 창으로 돌아오거나 다른 탭에서 저장하면 다시 확인함
if (encouragementElement) {
  renderDailyEncouragement();
  window.addEventListener("focus", renderDailyEncouragement);
  window.addEventListener("storage", renderDailyEncouragement);
  // 페이지를 열어 둔 채 날짜가 바뀌어도 1분마다 문구 확인함
  setInterval(renderDailyEncouragement, 60000);
}

// 같은 페이지에서 일정을 수정한 경우에도 마감 목록 갱신함
window.addEventListener("schedules-updated", renderDeadlines);