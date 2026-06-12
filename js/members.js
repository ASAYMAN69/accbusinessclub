(function () {
  "use strict";

  function getInitials(name) {
    return name
      .trim()
      .split(/\s+/)
      .map(function (w) { return w.charAt(0).toUpperCase(); })
      .join("");
  }

  function memberCard(member) {
    var src = member.image || "";
    var initials = getInitials(member.name);
    var escapedInitials = encodeURIComponent(initials);

    if (!src) {
      src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect fill='%231a1f2e' width='400' height='400'/%3E%3Ctext fill='%234a5568' font-size='120' x='200' y='220' text-anchor='middle' font-family='Inter,sans-serif'%3E" + escapedInitials + "%3C/text%3E%3C/svg%3E";
    }

    return (
      '<div class="member-card">' +
        '<div class="member-img-wrapper">' +
          '<img class="member-img" src="' + src + '" alt="' + member.name + '" loading="lazy" onerror="this.src=\'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27400%27 height=%27400%27%3E%3Crect fill=%27%231a1f2e%27 width=%27400%27 height=%27400%27/%3E%3Ctext fill=%27%234a5568%27 font-size=%27120%27 x=%27200%27 y=%27220%27 text-anchor=%27middle%27 font-family=%27Inter,sans-serif%27%3E' + escapedInitials + '%3C/text%3E%3C/svg%3E\'">' +
        '</div>' +
        '<div class="member-card-text">' +
          '<h3 class="member-name">' + member.name + '</h3>' +
          '<p class="member-role">' + member.role + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  window.renderMembers = function (jsonUrl, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var limit = container.hasAttribute("data-limit")
      ? parseInt(container.getAttribute("data-limit"), 10)
      : Infinity;

    fetch(jsonUrl)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var items = limit < Infinity ? data.slice(0, limit) : data;
        container.innerHTML = items.map(memberCard).join("");
      })
      .catch(function (err) {
        console.error("members.js: failed to load " + jsonUrl, err);
      });
  };
})();
