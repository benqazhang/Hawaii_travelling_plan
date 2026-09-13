(function () {
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(
      /[&<>"']/g,
      function (character) {
        return {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[character];
      },
    );
  }
  const originalFetch = window.fetch.bind(window);
  window.fetch = function (input, init) {
    const url = typeof input === "string" ? input : input && input.url;
    if (url && /(^|\/)trip-data\.json(?:\?|$)/.test(url)) {
      try {
        const saved = localStorage.getItem("hawaii-generated-trip-data");
        if (saved) {
          return Promise.resolve(
            new Response(saved, {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }),
          );
        }
      } catch (_) {}
    }
    return originalFetch(input, init);
  };

  document.addEventListener("travel-data-ready", function (event) {
    queueMicrotask(function () {
      const data = event.detail;
      const route = document.getElementById("route");
      const explorer = document.getElementById("route-explorer");
      const count = document.getElementById("route-day-count");
      if (!route || !explorer || !Array.isArray(data.days)) return;
      route.hidden = false;
      if (count) count.textContent = data.days.length + " DAYS";
      explorer.innerHTML =
        '<div class="bridge-route">' +
        data.days
          .map(function (day) {
            return (
              "<article><span>DAY " +
              String(day.day).padStart(2, "0") +
              "</span><b>" +
              escapeHtml(day.locations.join(" · ")) +
              "</b><small>" +
              escapeHtml(day.title) +
              "</small></article>"
            );
          })
          .join("") +
        "</div>";

      var planner = data.planner;
      var summarySection = document.getElementById("planner-summary");
      var summaryRoot = document.getElementById("planner-summary-content");
      if (planner && summarySection && summaryRoot) {
        var optional = (planner.decisions || []).filter(function (decision) {
          return decision.status === "optional";
        });
        var dropped = (planner.decisions || []).filter(function (decision) {
          return decision.status === "not_recommended";
        });
        summarySection.hidden = false;
        summaryRoot.innerHTML =
          '<div class="planner-summary__heading"><div><p class="section-kicker">PLANNING DECISIONS</p><h2>为什么这样安排</h2></div><span>' +
          planner.summary.planned +
          " / " +
          planner.summary.totalSelected +
          " 已安排</span></div>" +
          '<div class="planner-summary__stats"><span><b>' +
          planner.summary.planned +
          "</b>已计划</span><span><b>" +
          planner.summary.optional +
          "</b>候补</span><span><b>" +
          planner.summary.notRecommended +
          "</b>不建议强行加入</span></div>" +
          (optional.length || dropped.length
            ? '<div class="planner-decisions">' +
              optional
                .concat(dropped)
                .map(function (decision) {
                  return (
                    '<article class="is-' +
                    escapeHtml(decision.status) +
                    '"><b>' +
                    escapeHtml(decision.spotName) +
                    "</b><span>" +
                    (decision.status === "optional" ? "候补" : "不建议") +
                    "</span><p>" +
                    escapeHtml(decision.reason) +
                    "</p></article>"
                  );
                })
                .join("") +
              "</div>"
            : "");
      }
    });
  });
})();
