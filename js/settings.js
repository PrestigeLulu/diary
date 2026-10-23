
const getCategories = () => JSON.parse(localStorage.getItem("categories")) || [
  { id: "personal", name: "개인", color: "#7f9d87" },
  { id: "work", name: "업무", color: "#b96e4f" },
  { id: "appointment", name: "약속", color: "#78649b" }
];

const saveCategories = data => localStorage.setItem("categories", JSON.stringify(data));
const getSchedules = () => JSON.parse(localStorage.getItem("schedules")) || [];

// 프로필 표시
function renderProfile() {
  document.getElementById("profile-title").textContent = getName();
  document.getElementById("profile-stuid").textContent = getStudentId();
  document.getElementById("created-at").textContent = getCreatedAt() + "부터 기록 중";
  document.getElementById("profile-avatar").textContent = getName().slice(0, 2);
}

// 프로필 수정
function editProfile() {
  const name = prompt("이름을 입력하세요.", getName());
  if (!name?.trim()) return;

  const stuid = prompt("학번을 입력하세요.", getStudentId());
  if (stuid === null) return;

  localStorage.setItem("name", name.trim());
  localStorage.setItem("stuid", stuid.trim());

  renderProfile();
  updateProfile();
}

// 카테고리 목록
function renderCategories() {
  const list = document.getElementById("category-list");
  list.innerHTML = "";

  getCategories().forEach(c => {
    const count = getSchedules().filter(s =>
      s.categoryId === c.id || s.category === c.id || s.category === c.name
    ).length;

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="category-dot" style="background:${c.color}"></span>
      <strong></strong>
      <span class="category-count">${count}개 일정</span>
      <button class="icon-button edit" type="button">✎</button>
      <button class="icon-button delete" type="button">×</button>
    `;

    li.querySelector("strong").textContent = c.name;
    li.querySelector(".edit").onclick = () => editCategory(c.id);
    li.querySelector(".delete").onclick = () => deleteCategory(c.id);
    list.appendChild(li);
  });
}

// 카테고리 추가
function addCategory() {
  const name = prompt("카테고리 이름");
  if (!name?.trim()) return;

  const color = prompt("색상 코드", "#7f9d87");
  if (!/^#[0-9a-f]{6}$/i.test(color || "")) return;

  const categories = getCategories();
  if (categories.some(c => c.name === name.trim())) return;

  categories.push({ id: crypto.randomUUID(), name: name.trim(), color });
  saveCategories(categories);
  renderCategories();
}

// 카테고리 수정
function editCategory(id) {
  const categories = getCategories();
  const category = categories.find(c => c.id === id);
  if (!category) return;

  const name = prompt("카테고리 이름", category.name);
  if (!name?.trim()) return;

  const color = prompt("색상 코드", category.color);
  if (!/^#[0-9a-f]{6}$/i.test(color || "")) return;
  if (categories.some(c => c.id !== id && c.name === name.trim())) return;

  const schedules = getSchedules();
  schedules.forEach(s => {
    if (s.category === category.name) s.category = name.trim();
  });

  localStorage.setItem("schedules", JSON.stringify(schedules));
  category.name = name.trim();
  category.color = color;

  saveCategories(categories);
  renderCategories();
}

// 카테고리 삭제 + 연결된 일정 삭제
function deleteCategory(id) {
  const categories = getCategories();
  const category = categories.find(c => c.id === id);
  if (!category) return;

  if (!confirm(`"${category.name}" 카테고리와 연결된 일정을 모두 삭제할까요?`)) return;

  const schedules = getSchedules().filter(s =>
    s.categoryId !== id &&
    s.category !== id &&
    s.category !== category.name
  );

  localStorage.setItem("schedules", JSON.stringify(schedules));
  saveCategories(categories.filter(c => c.id !== id));
  renderCategories();
}

// 테마 설정
const themeButtons = document.querySelectorAll('input[name="theme"]');
const savedTheme = localStorage.getItem("theme") || "light";

themeButtons.forEach(button => {
  button.checked = button.value === savedTheme;
  button.onchange = () => {
    localStorage.setItem("theme", button.value);
    updateTheme();
  };
});

// 초기 실행
document.addEventListener("DOMContentLoaded", () => {
  renderProfile();
  renderCategories();
});
