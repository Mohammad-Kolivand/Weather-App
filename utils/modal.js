const modal = document.getElementById("modal");
const modalText = document.getElementById("modal-message");
const closeButton = document.getElementById("modal-btn");
const actionButton = document.querySelector(".modal-action");

const removeModal = () => {
  modal.style.display = "none";
};

const showModal = (message) => {
  modalText.textContent = message;
  modal.style.display = "flex";
  closeButton.focus();
};

closeButton.addEventListener("click", removeModal);
actionButton?.addEventListener("click", removeModal);

export { showModal, removeModal };
