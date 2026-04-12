(function () {
  var iconEl = document.querySelector(".icon");
  var aboutEl = document.querySelector("#about");
  var topBtn = document.querySelector(".icon .top");

  if (!iconEl) return;

  function updateIconVisibility() {
    if (!aboutEl) {
      iconEl.classList.remove("show");
      return;
    }
    var threshold = aboutEl.offsetTop;
    if (window.scrollY >= threshold) {
      iconEl.classList.add("show");
    } else {
      iconEl.classList.remove("show");
    }
  }

  window.addEventListener("scroll", updateIconVisibility, { passive: true });
  window.addEventListener("resize", updateIconVisibility);
  window.addEventListener("load", updateIconVisibility);
  updateIconVisibility();

  if (topBtn) {
    topBtn.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }
})();
