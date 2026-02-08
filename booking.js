flatpickr("#calendar", {
  minDate: "today",
  dateFormat: "Y-m-d"
});

const slots = document.querySelectorAll(".slot");

slots.forEach(slot => {
  slot.addEventListener("click", () => {
    slots.forEach(s => s.classList.remove("active"));
    slot.classList.add("active");
  });
});
