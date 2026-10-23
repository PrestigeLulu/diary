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
