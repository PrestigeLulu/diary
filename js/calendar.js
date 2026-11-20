// 공휴일 계산 결과를 연도별로 보관합니다. 외부 요청 없이 HTML 파일에서도 동작합니다.
const calendarHolidayCache = new Map();
// 해당 연도의 공휴일 이름을 날짜별로 묶어 반환하는 함수
function getCalendarHolidays(year) {
  // 이미 계산한 연도는 다시 계산하지 않고 보관한 결과 반환
  if (calendarHolidayCache.has(year)) return calendarHolidayCache.get(year);
  const holidays = new Map();
  const groups = [];
  // 공휴일을 조회할 때 사용할 YYYY-MM-DD 형태의 날짜 키 생성
  const keyOf = date => date.toISOString().slice(0, 10);
  // 하나의 공휴일이나 연휴를 등록하고 대체공휴일 계산에 필요한 정보 보관
  const addGroup = (name, dates, substitute = "none") => {
    groups.push({ name, dates, substitute });
    dates.forEach(date => {
      const key = keyOf(date);
      holidays.set(key, [...(holidays.get(key) || []), name]);
    });
  };
  // 월과 일을 받아 UTC 날짜를 만들고 양력 공휴일 등록
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
    // 하루씩 순회하면서 음력 월과 일을 확인
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
    // 연휴 다음 날부터 주말과 다른 공휴일을 피해 대체 날짜 찾기
    const substitute = new Date(group.dates[group.dates.length - 1]);
    do { substitute.setUTCDate(substitute.getUTCDate() + 1); }
    while (substitute.getUTCDay() === 0 || substitute.getUTCDay() === 6 || holidays.has(keyOf(substitute)));
    holidays.set(keyOf(substitute), [`대체공휴일 (${group.name})`]);
  });
  // 계산을 마친 공휴일 목록을 연도별로 보관
  calendarHolidayCache.set(year, holidays);
  return holidays;
}

// 달력 제목과 요일, 날짜 목록, 월 이동 버튼 요소 불러오기
const monthHeading = document.querySelector(".calendar-month");
const weekdaysContainer = document.querySelector(".calendar-weekdays");
const daysContainer = document.querySelector(".calendar-days");
const previousMonthButton = document.querySelector("#previous-month");
const nextMonthButton = document.querySelector("#next-month");

// 달력에 필요한 요소가 모두 있는 페이지에서만 실행
if (
	monthHeading &&
	weekdaysContainer &&
	daysContainer &&
	previousMonthButton &&
	nextMonthButton
) {
	// 오늘 날짜와 현재 화면에 표시할 달을 저장
	const today = new Date();
	let displayedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	const weekdays = ["일", "월", "화", "수", "목", "금", "토"];

	// 선택한 달의 날짜와 일정, 메모 입력창을 다시 그리는 함수
	const renderCalendar = () => {
		const year = displayedMonth.getFullYear();
		const month = displayedMonth.getMonth();
		// 이번 달 1일의 요일과 마지막 날짜를 구해 날짜 칸 배치에 사용
		const firstWeekday = new Date(year, month, 1).getDay();
		const daysInMonth = new Date(year, month + 1, 0).getDate();
		const holidays = getCalendarHolidays(year);
    const schedules = getSchedules();

		// 선택한 연도와 월을 제목에 표시하고 이전 달의 요일과 날짜 칸 초기화
		monthHeading.textContent = new Intl.DateTimeFormat("ko-KR", {
			year: "numeric",
			month: "long",
		}).format(displayedMonth);
		daysContainer.setAttribute("aria-label", `${year}년 ${month + 1}월 날짜`);
		weekdaysContainer.replaceChildren();
		daysContainer.replaceChildren();

		// 요일 이름을 순서대로 추가하고 일요일과 토요일을 구분
		weekdays.forEach((weekday, index) => {
			const label = document.createElement("span");
			label.className = "calendar-weekday";
			label.textContent = weekday;
			if (index === 0) label.classList.add("is-sunday");
			if (index === 6) label.classList.add("is-saturday");
			weekdaysContainer.append(label);
		});

		// 이번 달 1일 앞에 필요한 만큼 빈 칸을 추가해 요일을 맞춤
		for (let cell = 0; cell < firstWeekday; cell += 1) {
			const emptyCell = document.createElement("span");
			emptyCell.className = "calendar-empty";
			emptyCell.setAttribute("aria-hidden", "true");
			daysContainer.append(emptyCell);
		}

		// 1일부터 마지막 날까지 날짜 칸과 메모 입력창 생성
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
            // 공휴일이면 구분 클래스를 붙이고 날짜에 공휴일 이름 표시
            const holidayNames = holidays.get(dateKey);
            if (holidayNames) {
              dateCell.classList.add("is-holiday");
              dateLabel.title = holidayNames.join(" · ");
              dateLabel.setAttribute("aria-label", `${month + 1}월 ${day}일 ${holidayNames.join(", ")}`);
            }
			todoInput.className = "calendar-todo-input";
			todoInput.rows = 2;
			todoInput.setAttribute("aria-label", `${month + 1}월 ${day}일 할 일`);
			// 날짜에 맞는 메모를 불러오고 자동 저장 이벤트 연결
			bindCalendarTodo(todoInput, dateKey);
			
      // 해당 날짜의 일정을 담을 목록 생성
      const scheduleList = document.createElement("div");
      scheduleList.className = "calendar-schedules";

      // 현재 날짜와 일치하는 일정만 시간순으로 정렬해서 표시
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

      // 날짜, 일정, 메모를 한 칸에 넣고 주말과 오늘 날짜를 구분
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

        // 마지막 주의 빈 칸 채우기
        while (daysContainer.children.length % 7 !== 0) {
            const empty = document.createElement("span");
            empty.className = "calendar-empty";
            empty.setAttribute("aria-hidden", "true");
            daysContainer.append(empty);
        }
    };  

	// 이전 달 버튼을 누르면 표시할 달을 한 달 줄이고 다시 렌더링
	previousMonthButton.addEventListener("click", () => {
		displayedMonth = new Date(
			displayedMonth.getFullYear(),
			displayedMonth.getMonth() - 1,
			1,
		);
		renderCalendar();
	});

	// 다음 달 버튼을 누르면 표시할 달을 한 달 늘리고 다시 렌더링
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
// 저장된 일정 목록을 반환하는 함수
function readDeadlineTodos() {
  return getSchedules();
}
// 날짜 단위로 비교하여 시간대와 서머타임에 따른 오차를 방지합니다.
// 날짜 형식과 실제 존재하는 날짜인지 검사하고 날짜를 일 단위 숫자로 반환
function deadlineDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date.getTime() / 86400000;
}

// 일정을 날짜와 시간순으로 정렬해 남은 날짜와 함께 표시하는 함수
function renderDeadlines() {
    if (!deadlineList) return;

    const today = new Date();
    // 오늘의 시각을 자정으로 맞춰 남은 날짜 계산에 사용
    today.setHours(0, 0, 0, 0);

    // 날짜를 읽을 수 있는 일정만 골라 날짜와 시간순으로 정렬
    const schedules = getSchedules()
        .filter(s => s.date && !isNaN(new Date(`${s.date}T00:00:00`)))
        .sort((a, b) =>
            `${a.date} ${a.time || ""}`.localeCompare(`${b.date} ${b.time || ""}`)
        );

    // 이전에 표시한 마감 목록을 비우고 새로 추가
    deadlineList.replaceChildren();

    // 표시할 일정이 없으면 빈 목록 안내 문구 추가
    if (!schedules.length) {
        const empty = document.createElement("li");
        empty.className = "deadline-empty";
        empty.textContent = "등록된 일정이 없습니다.";
        deadlineList.append(empty);
        return;
    }

    // 각 일정의 날짜에서 오늘 날짜를 빼 남은 일수 계산
    schedules.forEach(schedule => {
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

        // 남은 날짜에 따라 D-Day, D-숫자 또는 지난 일수 표시
        const badge = document.createElement("span");
        badge.className = "deadline-badge";
        badge.textContent =
            remaining < 0 ? `${-remaining}일 지남` :
            remaining === 0 ? "D-Day" : `D-${remaining}`;

        // 오늘부터 3일 이내인 일정은 강조하는 클래스 추가
        if (remaining >= 0 && remaining <= 3) {
            badge.classList.add("is-urgent");
        }

        info.append(title, detail);
        item.append(info, badge);
        deadlineList.append(item);
    });
}

// 마감 목록이 있으면 다른 탭의 변경이나 창 복귀 시 목록 갱신
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
  // 마감 패널의 펼침 상태와 접근성 속성, 배경 표시를 함께 변경
  function setDeadlineOpen(open) {
    deadlinePanel.classList.toggle("is-open", open);
    deadlineToggle.setAttribute("aria-expanded", String(open));
    deadlineContent.inert = !open;
    deadlineBackdrop.hidden = !open;
    if (open) renderDeadlines();
    // 닫는 패널 안에 포커스가 있으면 펼침 버튼으로 이동
    else if (deadlineContent.contains(document.activeElement)) deadlineToggle.focus();
  }
  // 버튼을 누를 때마다 현재 펼침 상태를 반대로 변경
  deadlineToggle.addEventListener("click", () => {
    setDeadlineOpen(deadlineToggle.getAttribute("aria-expanded") !== "true");
  });
  // 패널 바깥을 클릭하거나 Esc 키를 누르면 마감 목록 닫기
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
// 저장소를 사용할 수 없을 때도 현재 페이지에서 선택한 글귀 보관
let dailyEncouragement = null;
// 오늘 날짜에 맞는 응원 글귀를 불러오거나 새로 선택하는 함수
function renderDailyEncouragement() {
  if (!encouragementElement) return;
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  let saved = dailyEncouragement;
  try {
    // 저장된 글귀가 준비된 문구 목록에 있는 경우에만 사용
    const stored = JSON.parse(localStorage.getItem("diary-daily-encouragement"));
    if (stored && encouragementQuotes.includes(stored.quote)) saved = stored;
  } catch {
    // 저장소를 사용할 수 없어도 현재 페이지에서는 글귀를 표시합니다.
  }
  // 처음 실행했거나 날짜가 바뀌면 직전 글귀를 제외하고 무작위 선택
  if (!saved || saved.date !== date) {
    const candidates = encouragementQuotes.filter(quote => quote !== saved?.quote);
    saved = { date, quote: candidates[Math.floor(Math.random() * candidates.length)] };
    try {
      localStorage.setItem("diary-daily-encouragement", JSON.stringify(saved));
    } catch {
      // 저장이 제한된 환경에서는 메모리에 보관합니다.
    }
  }
  // 선택한 글귀를 메모리에 보관하고 화면에 표시
  dailyEncouragement = saved;
  encouragementElement.textContent = saved.quote;
}
// 응원 글귀 영역이 있으면 처음 표시하고 창 복귀나 저장소 변경 시 갱신
if (encouragementElement) {
  renderDailyEncouragement();
  window.addEventListener("focus", renderDailyEncouragement);
  window.addEventListener("storage", renderDailyEncouragement);
  // 자정이 지난 뒤에도 페이지를 새로 열지 않고 글귀를 갱신합니다.
  setInterval(renderDailyEncouragement, 60000);
}

// 현재 창에서 일정이 저장되었다는 이벤트를 받으면 마감 목록 갱신
window.addEventListener("schedules-updated", renderDeadlines);