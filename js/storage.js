export function getSchedules() {
  return JSON.parse(localStorage.getItem("schedules")) || [];
}

export function saveSchedules(schedules) {
  localStorage.setItem("schedules", JSON.stringify(schedules));
}

export function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}

export function saveTodos(todos) {
  localStorage.setItem("todos", JSON.stringify(todos));
}