(function () {
  var nav = document.querySelector(".nav");
  var menu = document.querySelector(".menu");
  if (!nav || !menu) return;

  var mq = window.matchMedia("(max-width: 1024px)");

  function setDrawerOpen(open) {
    nav.classList.toggle("active", open);
    document.body.classList.toggle("nav-open", open);
  }

  menu.addEventListener("click", function (e) {
    e.stopPropagation();
    if (!mq.matches) return;
    setDrawerOpen(!nav.classList.contains("active"));
  });

  nav.querySelectorAll(".navi a").forEach(function (link) {
    link.addEventListener("click", function () {
      if (mq.matches) setDrawerOpen(false);
    });
  });

  function onMqChange() {
    if (!mq.matches) setDrawerOpen(false);
  }

  if (mq.addEventListener) {
    mq.addEventListener("change", onMqChange);
  } else {
    mq.addListener(onMqChange);
  }

  window.addEventListener("resize", onMqChange);
})();
