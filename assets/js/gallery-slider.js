(function () {
  var slider = document.querySelector(".as-slider");
  if (!slider) return;

  var slides = Array.prototype.slice.call(slider.querySelectorAll(".as-slide"));
  var caption = document.querySelector(".as-images > h2");
  if (!slides.length) return;

  var activeIndex = 0;
  var intervalMs = 3500;
  var isDragging = false;
  var startX = 0;
  var startY = 0;
  var lastX = 0;
  var lastY = 0;
  var lockedAxis = null; // "x" | "y" | null
  var ignoreClickUntil = 0;

  function mod(n, m) {
    return ((n % m) + m) % m;
  }

  function applyClasses() {
    var len = slides.length;
    var prevIndex = mod(activeIndex - 1, len);
    var nextIndex = mod(activeIndex + 1, len);

    slides.forEach(function (el, i) {
      el.classList.remove("active", "prev", "next", "hidden");
      if (i === activeIndex) el.classList.add("active");
      else if (i === prevIndex) el.classList.add("prev");
      else if (i === nextIndex) el.classList.add("next");
      else el.classList.add("hidden");
    });

    if (caption) {
      var img = slides[activeIndex].querySelector("img");
      caption.textContent = (img && img.alt) ? img.alt : "Gallery";
    }
  }

  function prev() {
    activeIndex = mod(activeIndex - 1, slides.length);
    applyClasses();
  }

  function next() {
    activeIndex = mod(activeIndex + 1, slides.length);
    applyClasses();
  }

  function setDragX(px) {
    slider.style.setProperty("--drag-x", px + "px");
  }

  function stopDrag(reset) {
    isDragging = false;
    lockedAxis = null;
    slider.classList.remove("dragging");
    if (reset) setDragX(0);
  }

  applyClasses();
  var timer = window.setInterval(next, intervalMs);

  slider.addEventListener("click", function (e) {
    if (Date.now() < ignoreClickUntil) return;
    var target = e.target && e.target.closest ? e.target.closest(".as-slide") : null;
    if (!target) return;
    if (target.classList.contains("next")) next();
    else if (target.classList.contains("prev")) prev();
  });

  /* Pause on hover/focus for accessibility */
  function pause() {
    if (!timer) return;
    window.clearInterval(timer);
    timer = null;
  }
  function resume() {
    if (timer) return;
    timer = window.setInterval(next, intervalMs);
  }

  slider.addEventListener("mouseenter", pause);
  slider.addEventListener("mouseleave", resume);
  slider.addEventListener("focusin", pause);
  slider.addEventListener("focusout", resume);

  function getPointFromEvent(ev) {
    if (ev.touches && ev.touches[0]) return { x: ev.touches[0].clientX, y: ev.touches[0].clientY };
    if (ev.changedTouches && ev.changedTouches[0]) return { x: ev.changedTouches[0].clientX, y: ev.changedTouches[0].clientY };
    return { x: ev.clientX, y: ev.clientY };
  }

  function onStart(ev) {
    var p = getPointFromEvent(ev);
    isDragging = true;
    startX = lastX = p.x;
    startY = lastY = p.y;
    lockedAxis = null;
    slider.classList.add("dragging");
    pause();
  }

  function onMove(ev) {
    if (!isDragging) return;
    var p = getPointFromEvent(ev);
    lastX = p.x;
    lastY = p.y;

    var dx = lastX - startX;
    var dy = lastY - startY;

    if (!lockedAxis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      lockedAxis = Math.abs(dx) >= Math.abs(dy) ? "x" : "y";
    }

    if (lockedAxis === "x") {
      setDragX(dx);
      if (ev.cancelable) ev.preventDefault();
    }
  }

  function onEnd() {
    if (!isDragging) return;
    var dx = lastX - startX;
    var threshold = Math.max(80, Math.round(slider.clientWidth * 0.12));

    stopDrag(true);
    ignoreClickUntil = Date.now() + 250;

    if (Math.abs(dx) >= threshold) {
      if (dx < 0) next();
      else prev();
    }

    resume();
  }

  /* Mouse */
  slider.addEventListener("mousedown", function (ev) {
    if (ev.button !== 0) return;
    onStart(ev);
  });
  window.addEventListener("mousemove", onMove, { passive: false });
  window.addEventListener("mouseup", onEnd);

  /* Touch */
  slider.addEventListener("touchstart", onStart, { passive: true });
  slider.addEventListener("touchmove", onMove, { passive: false });
  slider.addEventListener("touchend", onEnd);
  slider.addEventListener("touchcancel", onEnd);
})();

