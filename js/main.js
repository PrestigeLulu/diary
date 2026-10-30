
function getName() {
  return localStorage.getItem("name") || "유한대학교";
}

function getStudentId() {
  return localStorage.getItem("stuid") || "202612345";
}

function getCreatedAt() {
  let saved = localStorage.getItem("createdAt");

  if (!saved) {
    saved = new Date().toISOString();
    localStorage.setItem("createdAt", saved);
  }

  const date = new Date(saved);
  return isNaN(date.getTime())
    ? "기록 없음"
    : `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function updateProfile() {
  const name = document.getElementById("my-name");
  const stuid = document.getElementById("my-stuid");

  if (name) name.textContent = getName();
  if (stuid) stuid.textContent = getStudentId();
}

function updateTheme() {
  const theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function bindCalendarTodo(input, dateKey) {
  const status = document.getElementById("calendar-save-status");

  function notify(message) {
    if (!status) return;
    status.textContent = message;
    status.hidden = message === "자동 저장됨";
  }

  input.disabled = true;

  try {
    input.value = getCalendarTodo(dateKey);
    input.disabled = false;
  } catch {
    notify("저장된 내용을 불러오지 못했습니다.");
    return;
  }

  input.addEventListener("input", () => {
    try {
      saveCalendarTodo(dateKey, input.value);
      notify("자동 저장됨");
    } catch {
      notify("저장에 실패했습니다. 입력 내용을 복사해 두세요.");
    }
  });
}

updateTheme();

document.addEventListener("DOMContentLoaded", updateProfile);
window.addEventListener("pageshow", updateTheme);
window.addEventListener("focus", updateTheme);
window.addEventListener("storage", e => {
  if (e.key === "theme" || e.key === null) updateTheme();
});
