function getName() {
  return localStorage.getItem("name") || "게스트";
}

function getEmail() {
  return localStorage.getItem("email") || "게스트";
}

function getCreatedAt() {
  const date = new Date(localStorage.getItem("createdAt"));
  if (!isNaN(date.getTime())) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}년 ${month}월`;
  }
  return "기록 없음";
}

function updateProfile() {
  const nameElement = document.getElementById("my-name");
  const emailElement = document.getElementById("my-email");
  nameElement.textContent = getName();
  emailElement.textContent = getEmail();
}

document.addEventListener("DOMContentLoaded", updateProfile);
