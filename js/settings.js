
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

const PRESET_COLORS = [
  "#7f9d87", "#b96e4f", "#78649b", "#4f8eb9", "#b9a24f", 
  "#b94f7e", "#4fb9a2", "#8b4fb9", "#b98b4f", "#4f5bb9",
  "#d97777", "#77a6d9", "#77d9b9", "#d9b977", "#a677d9"
];

// 아직 사용되지 않은 색상을 찾아 추천하는 함수
function getNextSuggestedColor() {
  const categories = getCategories();
  const usedColors = categories.map(c => c.color.toLowerCase());
  
  // 사용되지 않은 프리셋 색상 찾기
  const availableColor = PRESET_COLORS.find(color => !usedColors.includes(color.toLowerCase()));
  
  // 모든 팔레트 색상을 다 사용했다면 랜덤 색상 생성
  if (availableColor) return availableColor;
  
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// 카테고리 추가
function addCategory() {
  const name = prompt("카테고리 이름");
  if (!name?.trim()) return;

  // 매번 다른 추천 색상을 기본값으로 제공
  const suggestedColor = getNextSuggestedColor();
  const color = prompt("색상 코드", suggestedColor);
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
