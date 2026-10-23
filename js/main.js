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
  const theme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", theme);
}

document.addEventListener("DOMContentLoaded", function() {
  updateProfile();
  updateTheme();
});

// 달력에서만 저장 모듈을 로드합니다. 다른 페이지의 공통 스크립트 사용도 유지합니다.
window.calendarStorageReady = document.querySelector(".calendar-days")
  ? import("./storage.js")
  : Promise.resolve(null);
// 모듈 로드 실패는 입력란을 연결할 때 사용자에게 안내합니다.
window.calendarStorageReady.catch(() => {});

window.bindCalendarTodo = async function(input, dateKey) {
  const status = document.getElementById("calendar-save-status");
  const notify = message => { if (status) status.textContent = message; };
  // 데이터를 불러오기 전에 입력해서 덮어쓰는 일을 방지합니다.
  input.disabled = true;
  try {
    const storage = await window.calendarStorageReady;
    input.value = storage.getCalendarTodo(dateKey);
    input.disabled = false;
    input.addEventListener("input", () => {
      try {
        storage.saveCalendarTodo(dateKey, input.value);
        notify("자동 저장됨");
      } catch {
        notify("저장하지 못했습니다. 입력 내용을 복사해 두고 브라우저 저장소 설정을 확인해 주세요.");
      }
    });
  } catch {
    notify("저장된 내용을 불러오지 못했습니다. Live Server로 실행하고 브라우저 저장소 설정을 확인해 주세요.");
  }
};