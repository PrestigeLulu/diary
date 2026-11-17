
// ===== 프로필 정보 불러오기 =====
// 저장된 이름이 없으면 기본 이름 사용함
function getName() {
  return localStorage.getItem("name") || "유한대학교";
}

// 저장된 학번이 없으면 기본 학번 사용함
function getStudentId() {
  return localStorage.getItem("stuid") || "202612345";
}

// 처음 사용한 날짜를 저장하고, 연도와 월만 꺼내 씀
function getCreatedAt() {
  let saved = localStorage.getItem("createdAt");

  // 저장된 날짜가 없을 때만 현재 시각 기록함
  if (!saved) {
    saved = new Date().toISOString();
    localStorage.setItem("createdAt", saved);
  }

  // 날짜로 읽을 수 없는 값이면 기록 없음으로 표시함
  const date = new Date(saved);
  return isNaN(date.getTime())
    ? "기록 없음"
    : `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

// ===== 화면에 프로필 표시 =====
// 이름과 학번을 보여 줄 요소가 있는 경우에만 내용 채움
function updateProfile() {
  const name = document.getElementById("my-name");
  const stuid = document.getElementById("my-stuid");

  if (name) name.textContent = getName();
  if (stuid) stuid.textContent = getStudentId();
}

// ===== 테마 적용 =====
// 저장된 설정이 dark면 어두운 테마, 나머지는 밝은 테마 사용함
function updateTheme() {
  const theme = localStorage.getItem("theme") === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  // 입력창이나 스크롤바 같은 브라우저 기본 UI도 테마에 맞춤
  document.documentElement.style.colorScheme = theme;
}

// ===== 달력 할 일 불러오기와 자동 저장 =====
// 날짜별 저장 내용을 입력란에 연결함
function bindCalendarTodo(input, dateKey) {
  const status = document.getElementById("calendar-save-status");

  // 불러오기나 저장에 실패하면 안내를 표시함. 자동 저장 성공 문구는 숨김 처리함
  function notify(message) {
    if (!status) return;
    status.textContent = message;
    status.hidden = message === "자동 저장됨";
  }

  // 저장된 내용을 불러오기 전까지 입력 막음
  input.disabled = true;

  try {
    // 해당 날짜의 할 일을 채운 뒤 입력 허용함
    input.value = getCalendarTodo(dateKey);
    input.disabled = false;
  } catch {
    notify("저장된 내용을 불러오지 못했습니다.");
    return;
  }

  // 입력 내용이 바뀔 때마다 해당 날짜에 바로 저장함
  input.addEventListener("input", () => {
    try {
      saveCalendarTodo(dateKey, input.value);
      notify("자동 저장됨");
    } catch {
      // 저장에 실패해도 입력 내용은 남겨 두고 복사를 안내함
      notify("저장에 실패했습니다. 입력 내용을 복사해 두세요.");
    }
  });
}

// ===== 처음 실행할 때와 화면 상태가 바뀔 때 처리 =====
// 화면이 뜨기 전에 저장된 테마 적용함
updateTheme();

// HTML 요소가 준비되면 이름과 학번 표시함
document.addEventListener("DOMContentLoaded", updateProfile);
// 페이지를 다시 보여 주거나 이 창으로 돌아오면 테마 다시 확인함
window.addEventListener("pageshow", updateTheme);
window.addEventListener("focus", updateTheme);
// 다른 탭에서 테마를 바꾸거나 저장소를 비우면 이 페이지에도 반영됨
window.addEventListener("storage", e => {
  if (e.key === "theme" || e.key === null) updateTheme();
});
