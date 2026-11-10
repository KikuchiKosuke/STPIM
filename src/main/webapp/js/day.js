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
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: data.toString()
    }).then(function (response) {
      return response.json().then(function (result) {
        if (!response.ok && result.ok !== false) throw new Error("通信に失敗しました。");
        return result;
      });
    });
  }
  function reloadAfter(action, id, extra, card) {
    if (clearing.has(id)) return;
    clearing.add(id);
    var effectDuration = action === "clear" || action === "manual" ? 650 : 0;
    if (card && effectDuration) card.classList.add("effect-launch");
    post(action, id, extra).then(function (result) {
      if (!result.ok) {
        if (card) card.classList.remove("effect-launch");
        showToast(result.message || "操作できませんでした。", true);
        clearing.delete(id);
        return;
      }
      window.setTimeout(function () { window.location.reload(); }, effectDuration);
    }).catch(function () {
      if (card) card.classList.remove("effect-launch");
      clearing.delete(id);
      showToast("通信に失敗しました。もう一度お試しください。", true);
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
        card.style.transform = "";
        reloadAfter("clear", card.dataset.id, null, card);
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
