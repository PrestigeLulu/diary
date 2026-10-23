function getName() {
  return localStorage.getItem("name") || "유한대학교";
}

function getStudentId() {
  return localStorage.getItem("stuid") || "202612345";
}

function getCreatedAt() {
  let savedDate = localStorage.getItem("createdAt");
  if (!savedDate) {
    savedDate = new Date().toISOString();
    localStorage.setItem("createdAt", savedDate);
  }
  const date = new Date(savedDate);
  if (isNaN(date.getTime())) return "기록 없음";
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월`;
}

function updateProfile() {
  const nameElement = document.getElementById("my-name");
  const stuidElement = document.getElementById("my-stuid");
  if (nameElement) nameElement.textContent = getName();
  if (stuidElement) stuidElement.textContent = getStudentId();
}

function updateTheme() {
  let theme = "light";
  try {
    theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";
  } catch {
    // 저장소가 제한된 경우 기본 라이트 테마를 적용합니다.
  }
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

// 페이지 진입과 뒤로 가기, 다른 탭에서 설정을 바꾼 경우에도 테마를 반영합니다.
updateTheme();
window.addEventListener("pageshow", updateTheme);
window.addEventListener("focus", updateTheme);
window.addEventListener("storage", event => {
  if (event.key === "theme" || event.key === null) updateTheme();
});

document.addEventListener("DOMContentLoaded", function() {
  updateProfile();
  updateTheme();
});

// storage.js를 먼저 로드하여 HTML 파일에서도 날짜별 메모를 저장합니다.
window.bindCalendarTodo = function(input, dateKey) {
  const status = document.getElementById("calendar-save-status");
  const notify = message => {
    if (status) {
      status.textContent = message;
      status.hidden = message === "자동 저장됨";
    }
  };
  // 데이터를 불러오기 전에 입력해서 덮어쓰는 일을 방지합니다.
  input.disabled = true;
  try {
    input.value = getCalendarTodo(dateKey);
    input.disabled = false;
    input.addEventListener("input", () => {
      try {
        saveCalendarTodo(dateKey, input.value);
        notify("자동 저장됨");
      } catch {
        notify("저장하지 못했습니다. 입력 내용을 복사해 두고 브라우저 저장소 설정을 확인해 주세요.");
      }
    });
  } catch {
    notify("저장된 내용을 불러오지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.");
  }
};