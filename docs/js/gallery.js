(function () {
  "use strict";

  var IMAGE_SIZES = ["wide", "tall", "", "", "wide", ""];
  var TEXT_SIZES = ["", "wide", "tall", "", "", ""];

  function sizeClass(i, isText) {
    var pattern = isText ? TEXT_SIZES : IMAGE_SIZES;
    var cls = pattern[i % pattern.length];
    return cls ? " " + cls : "";
  }

  function imageTile(item, i) {
    return (
      '<div class="gallery-item skeleton' + sizeClass(i, false) + '">' +
        '<img src="' + item.image + '" alt="' + (item.caption || "Gallery image") + '" loading="lazy" onload="this.parentElement.classList.remove(\'skeleton\')">' +
      '</div>'
    );
  }

  function textTile(item, i) {
    var yearHtml = item.year
      ? '<span class="year-chip">' + item.year + '</span>'
      : "";
    var kind = item.type === "achievement" ? "ACHIEVEMENT" : "EVENT";
    return (
      '<div class="gallery-tile skeleton' + sizeClass(i, true) + '" data-type="' + (item.type || "event") + '">' +
        '<div class="gallery-tile-watermark">' + kind + '</div>' +
        '<div class="gallery-tile-body">' +
          yearHtml +
          '<h3>' + item.title + '</h3>' +
          '<p>' + item.description + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  function galleryItem(item, i) {
    return item.type === "image" ? imageTile(item, i) : textTile(item, i);
  }

  function init() {
    var container = document.getElementById("gallery-grid");
    if (!container) return;

    fetch("/gallery.json")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        container.innerHTML = data.map(galleryItem).join("");
      })
      .catch(function (err) {
        console.error("gallery.js: failed to load gallery.json", err);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();