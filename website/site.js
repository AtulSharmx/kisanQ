/* KisanQ website — mobile menu, scroll reveals, counter→phone demo, copy link.
   Everything degrades: with JS off the page is complete, the menu links are reachable
   through the footer and anchors, and the demo simply shows its first state. */
(function () {
  "use strict";

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── mobile menu ───────────────────────────────────────────────────── */
  var burger = document.getElementById("burger");
  var menu = document.getElementById("navmenu");
  if (burger && menu) {
    var setOpen = function (open) {
      menu.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    };
    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });
    // Close after choosing a section, and on Escape.
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        burger.focus();
      }
    });
    // A resize past the breakpoint leaves the panel open but unstyled otherwise.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 760) setOpen(false);
    });
  }

  /* ── scroll reveals ────────────────────────────────────────────────── */
  // Opt in only where it can actually be undone; otherwise the CSS default
  // leaves every section visible rather than stranding it at opacity 0.
  if ("IntersectionObserver" in window && !reduced) {
    document.documentElement.classList.add("js-r");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });

    var targets = document.querySelectorAll(
      ".hero-copy, .hero-shot, .sec-head, .challenges li, .steps li, .flow-side, " +
      ".pane-head, .gallery figure, .split > *, .quad > div, .led, .affil, .get > *, .team > *"
    );
    Array.prototype.forEach.call(targets, function (el, i) {
      el.classList.add("r");
      el.style.transitionDelay = (i % 4) * 60 + "ms";
      io.observe(el);
    });
  }

  /* ── counter → phone demo ──────────────────────────────────────────── */
  // Four presses walk one lot through weighing, quality check, acceptance and
  // payment, ticking the farmer's side in step. That sequence is the product's
  // whole claim, so it is the one thing on the page worth making interactive.
  var btn = document.getElementById("advance");
  if (btn) {
    var LABELS = ["Record the weight", "Run the quality check", "Accept the lot", "Raise the payment", "Start again"];
    var MAX = 4;
    var step = 0;
    var rows = [].slice.call(document.querySelectorAll(".tape [data-step]"));
    var ticks = [].slice.call(document.querySelectorAll(".track [data-step]"));

    var render = function () {
      rows.forEach(function (r) { r.hidden = Number(r.dataset.step) > step; });
      ticks.forEach(function (li) {
        var n = Number(li.dataset.step);
        li.classList.toggle("done", n < step);
        li.classList.toggle("now", n === step);
      });
      btn.textContent = LABELS[Math.min(step, MAX)];
    };

    btn.addEventListener("click", function () {
      step = step >= MAX ? 0 : step + 1;
      render();
    });
    render();
  }

  /* ── copy the download link (download page) ────────────────────────── */
  var copy = document.getElementById("copy");
  var url = document.getElementById("apk-url");
  if (copy && url) {
    var flash = function (msg) {
      copy.textContent = msg;
      setTimeout(function () { copy.textContent = "Copy link"; }, 2000);
    };
    var selectIt = function () {
      var r = document.createRange();
      r.selectNodeContents(url);
      var s = window.getSelection();
      s.removeAllRanges();
      s.addRange(r);
      flash("Press Ctrl/Cmd+C");
    };
    copy.addEventListener("click", function () {
      var text = url.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { flash("Copied"); }, selectIt);
      } else {
        selectIt();
      }
    });
  }
})();
