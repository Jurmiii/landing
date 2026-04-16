(function () {
  var slider = document.querySelector(".as-slider");
  if (!slider) return;

  var slides = Array.prototype.slice.call(slider.querySelectorAll(".as-slide"));
  var caption = document.querySelector(".as-images > h2");
  if (!slides.length) return;

  // Image order (space1~4) => title mapping
  // - space1 is kept as-is from existing markup when possible
  var titles = (function () {
    var fallbackSpace1 = caption && caption.textContent ? caption.textContent.trim() : "";
    return [
      fallbackSpace1 || "리셉션 라운지",
      "뷰티컨설팅라운지",
      "프라이빗 케어룸",
      "릴렉스 라운지",
    ];
  })();

  var activeIndex = 0;
  var intervalMs = 3500;
  var isDragging = false;
  var startX = 0;
  var currentTranslate = 0;
  var prevTranslate = 0;
  var lastX = 0;
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
      var title = titles[activeIndex];
      if (!title) {
        var img = slides[activeIndex].querySelector("img");
        title = (img && img.alt) ? img.alt : "Gallery";
      }
      caption.textContent = title;
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
    prevTranslate = 0;
    currentTranslate = 0;
    slider.classList.add("dragging");
    pause();
  }

  function onMove(ev) {
    if (!isDragging) return;
    var p = getPointFromEvent(ev);
    lastX = p.x;
    var dx = lastX - startX;
    currentTranslate = prevTranslate + dx;
    setDragX(currentTranslate);
    if (ev.cancelable) ev.preventDefault();
  }

  function onEnd() {
    if (!isDragging) return;
    var threshold = Math.max(80, Math.round(slider.clientWidth * 0.12));
    var movedDistance = currentTranslate - prevTranslate;

    stopDrag(false);
    ignoreClickUntil = Date.now() + 250;

    // Snap to nearest (prev/next) if moved enough; otherwise return to center
    if (movedDistance <= -threshold) {
      next();
    } else if (movedDistance >= threshold) {
      prev();
    }

    // Animate back to center (or centered on new active)
    prevTranslate = 0;
    currentTranslate = 0;
    setDragX(0);

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

