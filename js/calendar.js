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
			const storageKey = `diary-todos:${dateKey}`;
			dateCell.className = "calendar-day";
			dateLabel.className = "calendar-date";
			dateLabel.dateTime = dateKey;
			dateLabel.textContent = String(day);
			todoInput.className = "calendar-todo-input";
			todoInput.rows = 2;
			todoInput.value = localStorage.getItem(storageKey) ?? "";
			todoInput.placeholder = "오늘의 할 일";
			todoInput.setAttribute("aria-label", `${month + 1}월 ${day}일 할 일`);
			todoInput.addEventListener("input", () => {
				if (todoInput.value.trim()) {
					localStorage.setItem(storageKey, todoInput.value);
				} else {
					localStorage.removeItem(storageKey);
				}
			});
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
