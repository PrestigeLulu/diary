function updateProfile() {
  const nameElement = document.getElementById("my-name");
  const emailElement = document.getElementById("my-email");
  nameElement.textContent = getName();
  emailElement.textContent = getEmail();
}

document.addEventListener("DOMContentLoaded", updateProfile);
