/* KisanQ website — scroll reveals and the operator→farmer flow demo.
   Both degrade to a fully readable page with no JS: the markup renders complete at rest. */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- scroll reveals -------------------------------------------------- */
  // Only opt in when we can actually observe; otherwise the CSS default leaves
  // everything visible rather than stranding sections at opacity 0.
  if ("IntersectionObserver" in window && !reduced) {
    document.documentElement.classList.add("js-reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });

    document.querySelectorAll(".reveal").forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 70 + "ms";
      io.observe(el);
    });
  }

  /* ---- operator → farmer flow ------------------------------------------ */
  // Four presses walk the lot through weighing, quality check, acceptance and
  // payment. Each press reveals the operator's entry and ticks the matching
  // step on the farmer side, which is the whole point being demonstrated.
  var btn = document.getElementById("advance");
  if (!btn) return;

  var LABELS = ["Record the weight", "Run the quality check", "Accept the lot", "Raise the payment", "Replay"];
  var MAX = 4;
  var step = 0;

  var opRows = Array.prototype.slice.call(document.querySelectorAll(".readout [data-step]"));
  var ticks = Array.prototype.slice.call(document.querySelectorAll(".ticks [data-step]"));

  function render() {
    opRows.forEach(function (row) {
      row.classList.toggle("is-hidden", Number(row.dataset.step) > step);
    });
    ticks.forEach(function (li) {
      var n = Number(li.dataset.step);
      li.classList.toggle("done", n < step);
      li.classList.toggle("now", n === step);
    });
    btn.textContent = LABELS[Math.min(step, MAX)];
  }

  btn.addEventListener("click", function () {
    step = step >= MAX ? 0 : step + 1;
    render();
  });

  render();
})();
