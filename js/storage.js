function getSchedules() {
  return JSON.parse(localStorage.getItem("schedules")) || [];
}

function saveSchedules(schedules) {
  localStorage.setItem("schedules", JSON.stringify(schedules));
}

function getTodos() {
  return JSON.parse(localStorage.getItem("todos")) || [];
}

function saveTodos(todos) {
  localStorage.setItem("todos", JSON.stringify(todos));
}