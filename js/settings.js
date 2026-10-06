document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("profile-title").textContent = getName();
  document.getElementById("profile-email").textContent = getEmail();
  document.getElementById("created-at").textContent =
    getCreatedAt() + "부터 기록 중";
});
