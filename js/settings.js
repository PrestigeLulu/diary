const themeButtons = document.querySelectorAll('input[name="theme"]');

for (const button of themeButtons) {
  button.addEventListener("change", function() {
    localStorage.setItem("theme", button.value);
    document.documentElement.setAttribute("data-theme", button.value);
  });
}

// 저장된 테마 선택
const savedTheme = localStorage.getItem("theme") || "light";

for (const button of themeButtons) {
  if (button.value === savedTheme) {
    button.checked = true;
  }
}


document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("profile-title").textContent = getName();
  document.getElementById("profile-stuid").textContent = getStudentId();
  document.getElementById("created-at").textContent =
    getCreatedAt() + "부터 기록 중";
});
