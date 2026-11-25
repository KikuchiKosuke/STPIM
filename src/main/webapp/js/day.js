(function () {
  "use strict";
  var ctx = document.body.getAttribute("data-ctx") || "";
  var toast = document.getElementById("toast");
  var clearing = new Set();
  function showToast(message, error) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle("error", Boolean(error));
    toast.classList.add("show");
    window.setTimeout(function () { toast.classList.remove("show"); }, 3200);
  }
  function post(action, id, extra) {
    var data = new URLSearchParams(extra || {});
    data.set("id", id);
    return fetch(ctx + "/block/" + action, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        "Accept": "application/json"
      },
      body: data.toString()
    }).then(function (response) {
      if (response.status === 401) {
        window.location.href = ctx + "/login";
        return null;
      }
      var contentType = response.headers.get("Content-Type") || "";
      if (contentType.indexOf("application/json") === -1) {
        throw new Error("ページの表示中に問題が発生しました。再読み込みしてください。");
      }
      return response.json().then(function (result) {
        if (!response.ok && result.ok !== false) throw new Error("通信に失敗しました。");
        return result;
      });
    });
  }
  function resetEffect(card) {
    if (!card) return;
    card.classList.remove("effect-launch", "effect-impact");
    if (card.parentElement) card.parentElement.classList.remove("effect-shock");
    ["--release-x", "--impact-x", "--travel-x"].forEach(function (name) { card.style.removeProperty(name); });
  }
  function reloadAfter(action, id, extra, card, releaseX) {
    if (clearing.has(id)) return;
    clearing.add(id);
    var effectDuration = action === "clear" || action === "manual" ? 1000 : 0;
    var effectStarted = Date.now();
    if (card && effectDuration) {
      var viewportWidth = Math.max(window.innerWidth, document.documentElement.clientWidth);
      card.style.setProperty("--release-x", (releaseX || 0) + "px");
      card.style.setProperty("--impact-x", Math.min(190, Math.max(96, card.getBoundingClientRect().width * .36)) + "px");
      card.style.setProperty("--travel-x", (viewportWidth + card.getBoundingClientRect().width + 70) + "px");
      card.classList.add("effect-impact");
      if (card.parentElement) card.parentElement.classList.add("effect-shock");
    }
    post(action, id, extra).then(function (result) {
      if (!result) return;
      if (!result.ok) {
        resetEffect(card);
        showToast(result.message || "操作できませんでした。", true);
        clearing.delete(id);
        return;
      }
      var remaining = Math.max(0, effectDuration - (Date.now() - effectStarted));
      window.setTimeout(function () { window.location.reload(); }, remaining);
    }).catch(function (error) {
      resetEffect(card);
      clearing.delete(id);
      showToast(error && error.message ? error.message : "通信に失敗しました。もう一度お試しください。", true);
    });
  }
  document.querySelectorAll("[data-action='clear'],[data-action='start'],[data-action='undo']").forEach(function (button) {
    button.addEventListener("click", function () {
      var action = button.dataset.action;
      reloadAfter(action, button.dataset.id, null, button.closest(".block-card"));
    });
  });
  document.querySelectorAll(".block-card.draggable").forEach(function (card) {
    var startX = 0, startY = 0, deltaX = 0, active = false, moved = false;
    card.addEventListener("pointerdown", function (event) {
      if (event.button !== 0 || event.target.closest("button,a,details,summary,input,select,textarea")) return;
      active = true; moved = false; deltaX = 0; startX = event.clientX; startY = event.clientY;
      if (card.setPointerCapture) card.setPointerCapture(event.pointerId);
    });
    card.addEventListener("pointermove", function (event) {
      if (!active) return;
      var x = event.clientX - startX, y = event.clientY - startY;
      if (!moved && Math.abs(y) > Math.abs(x) && Math.abs(y) > 8) { active = false; return; }
      if (Math.abs(x) > 5) {
        moved = true;
        card.classList.add("dragging");
        card.style.transform = "translateX(" + Math.max(-20, Math.min(x, 160)) + "px) rotate(" + (x > 0 ? Math.min(3, x / 55) : 0) + "deg)";
      }
      deltaX = x;
    });
    function finish() {
      if (!active && !moved) return;
      active = false; card.classList.remove("dragging");
      if (deltaX > 105) {
        var releaseX = Math.min(deltaX, 160);
        card.style.transform = "";
        reloadAfter("clear", card.dataset.id, null, card, releaseX);
      } else {
        card.style.transform = "";
      }
    }
    card.addEventListener("pointerup", finish);
    card.addEventListener("pointercancel", function () { active = false; moved = false; deltaX = 0; card.classList.remove("dragging"); card.style.transform = ""; });
  });
  document.querySelectorAll(".manual-form").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var endTime = new FormData(form).get("endTime");
      reloadAfter("manual", form.dataset.id, { endTime: endTime }, form.closest(".block-card"));
    });
  });
  document.querySelectorAll("[data-close-result]").forEach(function (button) {
    button.addEventListener("click", function () {
      var modal = document.getElementById("result-modal");
      if (modal) modal.remove();
    });
  });
  var resultModal = document.getElementById("result-modal");
  if (resultModal) {
    resultModal.addEventListener("click", function (event) {
      if (event.target === event.currentTarget) event.currentTarget.remove();
    });
  }
})();
