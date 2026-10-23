import { getTodos, saveTodos } from "./storage.js";

// 할 일 추가
function addTodo(title, description, dueDate, priority) {
  const todos = getTodos();
  const id = Number(localStorage.getItem("nextTodoId") || 1);
  const newTodo = {
    id,
    title,
    description,
    dueDate,
    priority,
    completed: false
  };
  todos.push(newTodo);
  saveTodos(todos);
  localStorage.setItem("nextTodoId", id + 1);
}

// 완료 상태 변경
function toggleTodo(id) {
  const todos = getTodos();
  const todo = todos.find(todo => todo.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos(todos);
  }
}

// 할 일 삭제
function deleteTodo(id) {
  const todos = getTodos();
  const filtered = todos.filter(todo => todo.id !== id);
  saveTodos(filtered);
}

// 할 일 수정
function updateTodo(id, title, description, dueDate, priority) {
  const todos = getTodos();
  const todo = todos.find(todo => todo.id === id);
  if (todo) {
    todo.title = title;
    todo.description = description;
    todo.dueDate = dueDate;
    todo.priority = priority;
    saveTodos(todos);
  }
}

// 상태별 필터링
function filterTodos(type) {
  const todos = getTodos();
  if (type === "completed") {
    return todos.filter(todo => todo.completed);
  }

  if (type === "incomplete") {
    return todos.filter(todo => !todo.completed);
  }

  return todos;
}