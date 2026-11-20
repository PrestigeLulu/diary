// 저장된 이름을 반환하고 없으면 기본 이름을 사용하는 함수
function getName() {
  return localStorage.getItem("name") || "유한대학교";
}

// 저장된 학번을 반환하고 없으면 기본 학번을 사용하는 함수
function getStudentId() {
  return localStorage.getItem("stuid") || "202612345";
}

// 처음 기록한 날짜를 저장하고 시작한 연도와 월을 반환하는 함수
function getCreatedAt() {
  let saved = localStorage.getItem("createdAt");

  // 처음 실행한 경우 현재 시간을 저장해 다음에도 같은 시작일을 사용
  if (!saved) {
    saved = new Date().toISOString();
    localStorage.setItem("createdAt", saved);
  }

  // 저장된 날짜가 올바르면 연도와 월을 표시하고 아니면 기록 없음 반환
  const date = new Date(saved);
  return isNaN(date.getTime())
    ? "기록 없음"
    : `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

// 사이드바에 나의 이름과 학번을 넣어주는 함수
function updateProfile() {
  const name = document.getElementById("my-name");
  const stuid = document.getElementById("my-stuid");

  // 해당 요소가 있는 경우에만 프로필 정보를 표시
  if (name) name.textContent = getName();
  if (stuid) stuid.textContent = getStudentId();
}

// 저장된 테마에 맞춰 페이지 색상과 브라우저 기본 입력 요소의 색상 변경
function updateTheme() {
  const theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

// 날짜별 메모를 불러오고 입력할 때마다 저장하도록 연결하는 함수
function bindCalendarTodo(input, dateKey) {
  const status = document.getElementById("calendar-save-status");

  // 저장 상태를 안내하고 정상적으로 저장되면 안내 영역을 숨기는 함수
  function notify(message) {
    if (!status) return;
    status.textContent = message;
    status.hidden = message === "자동 저장됨";
  }

  // 기존 내용을 불러오기 전에는 입력을 막아 저장된 메모가 덮어써지는 것을 방지
  input.disabled = true;

  try {
    // 해당 날짜의 메모를 불러온 다음 입력할 수 있도록 변경
    input.value = getCalendarTodo(dateKey);
    input.disabled = false;
  } catch {
    notify("저장된 내용을 불러오지 못했습니다.");
    return;
  }

  // 메모 내용이 바뀔 때마다 저장하고 실패하면 복사해 두도록 안내
  input.addEventListener("input", () => {
    try {
      saveCalendarTodo(dateKey, input.value);
      notify("자동 저장됨");
    } catch {
      notify("저장에 실패했습니다. 입력 내용을 복사해 두세요.");
    }
  });
}

// 화면이 모두 로딩되기 전에도 저장된 테마를 바로 적용
updateTheme();

// 화면 로딩이 끝나면 사이드바 프로필 표시
document.addEventListener("DOMContentLoaded", updateProfile);
// 페이지를 다시 표시하거나 창으로 돌아왔을 때 테마 갱신
window.addEventListener("pageshow", updateTheme);
window.addEventListener("focus", updateTheme);
// 다른 탭에서 테마를 변경하거나 저장소를 비우면 현재 화면에도 반영
window.addEventListener("storage", e => {
  if (e.key === "theme" || e.key === null) updateTheme();
});
