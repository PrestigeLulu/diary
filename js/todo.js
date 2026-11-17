// 저장돼있는 날짜가 다르면 할일목록을 초기화 하기 위한 함수
function resetTodosDaily() {
  // 로컬 스토리지의 날짜와 현재 날짜를 저장
  const lastDate = localStorage.getItem("lastTodoDate");
  const currentDate = today();

  // 날짜가 다르다면 할일을 초기화 후 로컬 스토리지에 현재 날짜를 다시 저장
  if (lastDate !== currentDate) {
    saveTodos([]);
    localStorage.setItem("lastTodoDate", currentDate);
  }
}

// 오늘의 날짜를 포맷된 형태로 반한하는 함수
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

// 할 일을 추가하는 함수
// 매개변수로 제목, 설명, 날짜, 중요도를 받음
function addTodo(title, description, priority) {
  // 할일과 다음 아이디를 불러온다
  const todos = getTodos();
  const id = Number(localStorage.getItem("nextTodoId") || 1);
  // 할일 배열에 다음 할일과 데이터와 함께 푸쉬한다.
  todos.push({
    id,
    title,
    description,
    priority,
    completed: false,
    completedAt: null
  });
  // saveTodos 함수로 todo를 저장하고 다음 아이디를 구하여 다시 넣는다.
  saveTodos(todos);
  localStorage.setItem("nextTodoId", Math.max(id, ...todos.map(t => t.id)) + 1);
  // 화면에 할일을 다시 랜더링 해서 사용자에게 보여준다.
  renderTodos();
}

// 할일의 상태를 토글하는 함수
function toggleTodo(id) {
  // 할일을 불러와서 find함수로 id와 매개변수로 받은 id가 같은것을 찾는다
  // 없으면 그대로 함수 종료
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  // 불리언 값에 부정만 붙이면 true는 fasle fasle 는 true 로 바뀐다.
  todo.completed = !todo.completed;
  todo.completedAt = todo.completed ? today() : null;

  // 저장하고 다시 화면 렌더링
  saveTodos(todos);
  renderTodos();
}

// 할 일을 삭제하는 함수
function deleteTodo(id) {
  // 취소 버튼을 누르면 false라면 true가 되어서 끝낸다.
  if (!confirm("할 일을 삭제할까요?")) return;
  // filter로 아이디가 같지 않은것만 하면 없어진 투두만 걸러지니
  // 그걸 저장하고 화면 렌더링 한다.
  saveTodos(getTodos().filter(t => t.id !== id));
  renderTodos();
}

// 할 일 수정 하는 함수
function updateTodo(id, title, description, priority) {
  // 할일 목록에서 id가 같은것을 찾고 없으면 끝낸다.
  const todos = getTodos();
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  // 오브젝트의 속성값을 업데이트되는 값으로 바꾼다.
  todo.title = title;
  todo.description = description;
  todo.priority = priority;

  // 저장하고 화면 렌더링
  saveTodos(todos);
  renderTodos();
}

// 완료된 할일과 해야하는 할일을 구분하기위함 필터함수
// completed 모드면 complted가 true인 것만 필터링한다 incomplete는 반대
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
  // 수정인지 구분 하기 위한 삼항연산자로 null이 아니라면 find로 찾아온다.
  const todo = id === null ? null : getTodos().find(t => t.id === id);
  // || 는 속성이 null가 되니 우측 값 피연산자를 반환
  const title = prompt("할 일 제목", todo?.title || "")
  // 제목이 없다면 종료
  if (!title?.trim()) return;
  // 같은원리
  const description = prompt("설명", todo?.description || "");
  if (description === null) return;

  // 우선순위를 받고 미리 정의된 배열에 포함되어있는지 확인후 없으면 종료
  const priority = prompt("우선순위 (high / medium / low)", todo?.priority || "medium");
  if (!["high", "medium", "low"].includes(priority)) {
    if (priority !== null) alert("우선순위가 올바르지 않습니다.");
    return;
  }

  // todo가 null이 아니면 업데이트 null이면 추가 한다
  if (todo) {
    updateTodo(id, title.trim(), description, priority);
  } else {
    addTodo(title.trim(), description, priority);
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
  // 부모 리스트 엘리먼트
  const list = document.getElementById(elementId);
  // 받아온 todos가 0개라면 비어있습니다라고 출력
    list.innerHTML = "";
    if (todos.length === 0) {
    list.innerHTML = `<li class="empty-message">비어 있습니다.</li>`;
    return;
  }

  // 중요도 영어 한글 매칭
  const priorityNames = {
    high: "높음",
    medium: "보통",
    low: "낮음"
  };

  // 할일을 순회하면서 데이터에 맞는 html을 만들고 부모 엘리먼트에 추가하기
  todos.forEach(todo => {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.completed ? "completed" : ""}`;
    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? "checked" : ""}>
      <div class="todo-info">
        <strong></strong>
        <p></p>
      </div>
      <span class="priority ${["high", "medium", "low"].includes(todo.priority) ? todo.priority : "medium"}"></span>
      <button class="todo-edit" type="button">✎</button>
      <button class="todo-delete" type="button">×</button>
    `;

    // 추가된 html에서 순히되는 정보 넣기
    li.querySelector("strong").textContent = todo.title;
    li.querySelector("p").textContent = todo.description;
    li.querySelector(".priority").textContent =
      priorityNames[todo.priority] || "보통";

    // 추가된 html에 각자 대응되는 이벤트함수들 추가하기
    li.querySelector("input").onchange = () => toggleTodo(todo.id);
    li.querySelector(".todo-edit").onclick = () => openTodoForm(todo.id);
    li.querySelector(".todo-delete").onclick = () => deleteTodo(todo.id);

    list.appendChild(li);
  });
}

// 화면이 전부 로딩이 되었을때
document.addEventListener("DOMContentLoaded", () => {
  // 할일을 날마다 초기화 하는 함수 실행
  resetTodosDaily();
  // 할일 추가 버튼에 할일 추가 할때 보여지는 창 보이게 하는 함수를 등록
  document.getElementById("add-todo").onclick = () => openTodoForm();
  // 할일을 표시
  renderTodos();
});
