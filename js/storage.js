// 저장돼 있는 일정 목록을 파싱해서 반환하는 함수
function getSchedules() {
  return JSON.parse(localStorage.getItem("schedules")) || [];
}

// 일정 목록을 문자열화 해서 저장하고 이벤트를 보내는 함수
function saveSchedules(schedules) {
  localStorage.setItem("schedules", JSON.stringify(schedules));
  window.dispatchEvent(new Event("schedules-updated"));
}

// 저장돼 있는 할일 목록을 파싱해서 반환하는 함수
function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}

// 할일 목록을 문자열화 해서 저장하는 함수
function saveTodos(todos) {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// 날짜별 달력 메모는 기존 키를 유지해 이전 입력도 그대로 불러옵니다.
function getCalendarTodo(dateKey) {
  return localStorage.getItem(`diary-todos:${dateKey}`) ?? "";
}

// 입력할 때마다 즉시 저장합니다. 저장 실패는 호출한 화면에서 안내합니다.
function saveCalendarTodo(dateKey, text) {
  if (text === "") {
    localStorage.removeItem(`diary-todos:${dateKey}`);
  } else {
    localStorage.setItem(`diary-todos:${dateKey}`, text);
  }
}