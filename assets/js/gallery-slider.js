/**
 * arte-space: clone 기반 무한 루프 (트랙 [cloneLast, ...reals, cloneFirst])
 */
(function () {
  var root = document.querySelector("[data-arte-slider]");
  if (!root) return;
  var slider = root;

  var track = root.querySelector(".slider-track");
  if (!track) return;

  var realSlides = [].slice.call(track.querySelectorAll(".slide"));
  if (realSlides.length < 1) return;

  var realN = realSlides.length;
  var firstEl = realSlides[0];
  var lastEl = realSlides[realN - 1];
  var cloneStart = lastEl.cloneNode(true);
  var cloneEnd = firstEl.cloneNode(true);
  cloneStart.setAttribute("data-clone", "start");
  cloneEnd.setAttribute("data-clone", "end");
  cloneStart.classList.add("slide--clone");
  cloneEnd.classList.add("slide--clone");
  cloneStart.removeAttribute("id");
  cloneEnd.removeAttribute("id");
  track.insertBefore(cloneStart, firstEl);
  track.appendChild(cloneEnd);

  var slides = [].slice.call(track.querySelectorAll(".slide"));
  var n = slides.length;

  var trackIndex = 1;
  var isDragging = false;
  var startX = 0;
  var dragX = 0;
  var moveDist = 0;
  var ignoreClickUntil = 0;
  var isJumping = false;
  var autoSlide = null;
  var intervalMs = 3000;

  function getClientX(ev) {
    if (ev.touches && ev.touches[0]) return ev.touches[0].clientX;
    if (ev.changedTouches && ev.changedTouches[0]) return ev.changedTouches[0].clientX;
    return ev.clientX;
  }

  /**
   * 활성 슬라이드 중심을 .slider(뷰포트) 기준 정확히 중앙에 맞춤.
   * 트랙 좌표: c = offsetLeft + width/2 → translateX = W/2 - c (+ 드래그).
   * getBoundingClientRect로도 동일: offset = slideL - contL - W/2 + w/2 → -offset
   */
  function updateTransform() {
    if (!track || !slides[trackIndex]) return;
    var container = slider;
    var W = container.clientWidth;
    if (W < 1) return;
    var slide = slides[trackIndex];
    var c = slide.offsetLeft + slide.offsetWidth * 0.5;
    var t = W * 0.5 - c;
    if (isDragging) t += dragX;
    track.style.transform = "translate3d(" + t + "px,0,0)";
  }

  function applyVisualState() {
    var ti = trackIndex;
    slides.forEach(function (el, i) {
      el.classList.remove("active", "is-prev", "is-next", "is-hidden");
      if (i === ti) el.classList.add("active");
      else if (i === ti - 1) el.classList.add("is-prev");
      else if (i === ti + 1) el.classList.add("is-next");
      else el.classList.add("is-hidden");
    });
  }

  /**
   * 클론 끝 ↔ 실제 인덱스로 점프할 때: transform만 즉시 갱신하고,
   * active / is-hidden 전환은 같은 틱에서 반영(지연 시 한 프레임 opacity 0 = 깜빡임).
   * rAF 2회는 track의 transition 복구용만 사용.
   */
  function setTrackIndexInstant(newIndex) {
    isJumping = true;
    slider.classList.add("is-instant-reposition");
    var prev = track.style.transition;
    track.style.transition = "none";
    trackIndex = newIndex;
    applyVisualState();
    updateTransform();
    track.offsetHeight;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        track.style.transition = prev || "";
        isJumping = false;
        slider.classList.remove("is-instant-reposition");
      });
    });
  }

  function onTrackTransitionEnd(ev) {
    if (isJumping) return;
    if (ev.target !== track) return;
    if (ev.propertyName !== "transform") return;
    if (isDragging) return;
    if (trackIndex === 0) {
      setTrackIndexInstant(realN);
    } else if (trackIndex === n - 1) {
      setTrackIndexInstant(1);
    }
  }

  function moveSlide(dir) {
    if (isDragging) return;
    if (isJumping) return;
    trackIndex += dir;
    trackIndex = Math.max(0, Math.min(n - 1, trackIndex));
    applyVisualState();
    updateTransform();
  }

  function goToTrackIndex(tgt) {
    if (isJumping) return;
    var next = Math.max(0, Math.min(n - 1, tgt));
    if (next === trackIndex) return;
    trackIndex = next;
    applyVisualState();
    updateTransform();
  }

  function stopAutoSlide() {
    if (autoSlide == null) return;
    clearInterval(autoSlide);
    autoSlide = null;
  }

  function startAutoSlide() {
    if (autoSlide != null) return;
    autoSlide = window.setInterval(function () {
      moveSlide(1);
    }, intervalMs);
  }

  function onStart(ev) {
    if (ev.type === "mousedown" && ev.button !== 0) return;
    isDragging = true;
    startX = getClientX(ev);
    dragX = 0;
    moveDist = 0;
    slider.classList.add("dragging");
    if (track) track.style.cursor = "grabbing";
    stopAutoSlide();
  }

  function onMove(ev) {
    if (!isDragging) return;
    var x = getClientX(ev);
    dragX = x - startX;
    moveDist = Math.max(moveDist, Math.abs(dragX));
    updateTransform();
    if (ev.cancelable) ev.preventDefault();
  }

  function finishDrag() {
    var thMove = Math.max(48, Math.round(slider.clientWidth * 0.1));
    if (moveDist > 5) {
      if (dragX <= -thMove) {
        moveSlide(1);
      } else if (dragX >= thMove) {
        moveSlide(-1);
      } else {
        updateTransform();
      }
    } else {
      updateTransform();
    }
    dragX = 0;
    ignoreClickUntil = Date.now() + 200;
    startAutoSlide();
  }

  function stopDragging() {
    if (!isDragging) return;
    isDragging = false;
    slider.classList.remove("dragging");
    if (track) track.style.cursor = "grab";
    finishDrag();
  }

  track.addEventListener("transitionend", onTrackTransitionEnd);

  track.addEventListener("click", function (e) {
    if (Date.now() < ignoreClickUntil) return;
    if (moveDist > 5) return;
    var el = e.target && e.target.closest ? e.target.closest(".slide") : null;
    if (!el) return;
    if (el.classList.contains("is-hidden")) return;
    var i = slides.indexOf(el);
    if (i < 0) return;
    if (i === trackIndex) return;
    if (i === trackIndex - 1) {
      stopAutoSlide();
      moveSlide(-1);
      startAutoSlide();
    } else if (i === trackIndex + 1) {
      stopAutoSlide();
      moveSlide(1);
      startAutoSlide();
    } else {
      stopAutoSlide();
      goToTrackIndex(i);
      startAutoSlide();
    }
  });

  track.addEventListener("mousedown", onStart);
  track.addEventListener("touchstart", onStart, { passive: true });

  document.addEventListener("mousemove", onMove, { passive: false });
  document.addEventListener("mouseup", stopDragging, false);
  document.addEventListener("mouseleave", stopDragging, false);
  window.addEventListener("blur", stopDragging);

  document.addEventListener("touchmove", onMove, { passive: false, capture: true });
  document.addEventListener("touchend", stopDragging, { passive: true, capture: true });
  document.addEventListener("touchcancel", stopDragging, { passive: true, capture: true });

  if (window.ResizeObserver) {
    new ResizeObserver(function () {
      updateTransform();
    }).observe(root);
  }
  window.addEventListener("resize", function () {
    updateTransform();
  });
  window.addEventListener("load", function () {
    updateTransform();
  });

  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      trackIndex = 1;
      applyVisualState();
      updateTransform();
      startAutoSlide();
    });
  });
})();
