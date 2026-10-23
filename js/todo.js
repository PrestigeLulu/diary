// 오늘의 날짜 문자열 구하는 함수
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// 할 일 추가 매개변수(제목, 설명, 날짜, 중요도)
function addTodo(title, description, dueDate, priority) {
  const todos = getTodos();
  const id = Number(localStorage.getItem("nextTodoId") || 1);
  todos.push({
    id,
    title,
    description,
    dueDate,
    priority,
    completed: false,
    completedAt: null
  });
  saveTodos(todos);
  localStorage.setItem("nextTodoId", Math.max(id, ...todos.map(t => t.id)) + 1);
  renderTodos();
}

// 완료 상태 변경
function toggleTodo(id) {
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  todo.completed = !todo.completed;
  todo.completedAt = todo.completed ? today() : null;

  saveTodos(todos);
  renderTodos();
}

// 할 일 삭제
function deleteTodo(id) {
  // false라면 true가 되서 리턴
  if (!confirm("할 일을 삭제할까요?")) return;
  saveTodos(getTodos().filter(t => t.id !== id));
  renderTodos();
}

// 할 일 수정
function updateTodo(id, title, description, dueDate, priority) {
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  todo.title = title;
  todo.description = description;
  todo.dueDate = dueDate;
  todo.priority = priority;

  saveTodos(todos);
  renderTodos();
}

// 상태별 필터링
function filterTodos(type) {
  const todos = getTodos();
  if (type === "completed") return todos.filter(t => t.completed);
  if (type === "incomplete") return todos.filter(t => !t.completed);
  return todos;
}
let currentFilter = "all";

function filterView(type, element) {
  currentFilter = type;
  document.querySelectorAll(".stat").forEach(stat => {
    stat.classList.remove("is-active");
  });
  element.classList.add("is-active");
  renderTodos();
}

// 할 일 추가 / 수정 입력
function openTodoForm(id = null) {
  const todo = id === null ? null : getTodos().find(t => t.id === id);
  const title = prompt("할 일 제목", todo?.title || "");
  if (!title?.trim()) return;
  const description = prompt("설명", todo?.description || "");
  if (description === null) return;
  const dueDate = prompt("마감일 (YYYY-MM-DD)", todo?.dueDate || today());
  if (dueDate === null) return;
  if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
      isNaN(new Date(dueDate).getTime()) ||
      new Date(dueDate).toISOString().slice(0, 10) !== dueDate)) {
    alert("올바른 날짜를 입력하세요.");
    return;
  }

  const priority = prompt("우선순위 (high / medium / low)", todo?.priority || "medium");
  if (!["high", "medium", "low"].includes(priority)) {
    if (priority !== null) alert("우선순위가 올바르지 않습니다.");
    return;
  }

  if (todo) {
    updateTodo(id, title.trim(), description, dueDate, priority);
  } else {
    addTodo(title.trim(), description, dueDate, priority);
  }
}

// 전체 화면 갱신
function renderTodos() {
  const todos = getTodos();
  const active = filterTodos("incomplete");
  const completed = filterTodos("completed");

  document.getElementById("total-count").textContent = todos.length;
  document.getElementById("active-count").textContent = active.length;
  document.getElementById("completed-count").textContent = completed.length;
  document.getElementById("active-title-count").textContent = active.length;

  const count = completed.filter(t => t.completedAt === today()).length;
  document.getElementById("today-count").textContent = `오늘 ${count}개 완료`;

  renderList("active-list", currentFilter === "completed" ? [] : active);
  renderList("completed-list", currentFilter === "incomplete" ? [] : completed);

  document.getElementById("active-list").parentElement.style.display =
    currentFilter === "completed" ? "none" : "";
  document.getElementById("completed-list").parentElement.style.display =
    currentFilter === "incomplete" ? "none" : "";
}

// 목록 출력
function renderList(elementId, todos) {
  const list = document.getElementById(elementId);
    list.innerHTML = "";
    if (todos.length === 0) {
    list.innerHTML = `<li class="empty-message">비어 있습니다.</li>`;
    return;
  }

  const priorityNames = {
    high: "높음",
    medium: "보통",
    low: "낮음"
  };

  todos.forEach(todo => {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "completed" : ""}`;
    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? "checked" : ""}>
      <div class="todo-info">
        <strong></strong>
        <p></p>
      </div>
      <span class="todo-date"></span>
      <span class="priority ${["high", "medium", "low"].includes(todo.priority) ? todo.priority : "medium"}"></span>
      <button class="todo-edit" type="button">✎</button>
      <button class="todo-delete" type="button">×</button>
    `;

    li.querySelector("strong").textContent = todo.title;
    li.querySelector("p").textContent = todo.description;
    li.querySelector(".todo-date").textContent =
      todo.dueDate === today() ? "오늘" : todo.dueDate || "날짜 없음";
    li.querySelector(".priority").textContent =
      priorityNames[todo.priority] || "보통";

    li.querySelector("input").onchange = () => toggleTodo(todo.id);
    li.querySelector(".todo-edit").onclick = () => openTodoForm(todo.id);
    li.querySelector(".todo-delete").onclick = () => deleteTodo(todo.id);

    list.appendChild(li);
  });
}

// 초기 화면 출력
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("add-todo").onclick = () => openTodoForm();
  renderTodos();
});