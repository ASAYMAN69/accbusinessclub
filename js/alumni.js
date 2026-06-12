(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    var container = document.getElementById('alumni-grid');
    var tabsEl    = document.getElementById('alumni-tabs');
    if (!container) return;

    var alumniData, sortedYears;

    try {
      var res = await fetch('/alumni.json');
      if (!res.ok) throw new Error('Network error');
      alumniData = await res.json();
    } catch (e) {
      container.innerHTML = '<p style="color:rgba(255,255,255,0.3);text-align:center;padding:40px 0;">Could not load alumni data.</p>';
      return;
    }

    var grouped = {};
    alumniData.forEach(function (m) {
      if (!grouped[m.year]) grouped[m.year] = [];
      grouped[m.year].push(m);
    });

    sortedYears = Object.keys(grouped).sort(function (a, b) { return Number(b) - Number(a); });

    if (tabsEl) {
      tabsEl.innerHTML = '';
      sortedYears.forEach(function (year, i) {
        var btn = document.createElement('button');
        btn.className = 'year-tab' + (i === 0 ? ' active' : '');
        btn.textContent = year;
        btn.setAttribute('data-year', year);
        btn.addEventListener('click', function () {
          var act = tabsEl.querySelector('.year-tab.active');
          if (act) act.classList.remove('active');
          btn.classList.add('active');
          renderGrid(grouped[year]);
        });
        tabsEl.appendChild(btn);
      });
    }

    renderGrid(grouped[sortedYears[0]]);

    function renderGrid(members) {
      members.sort(function (a, b) { return a.sort_order - b.sort_order; });

      container.innerHTML = members.map(function (m) {
        var initials = getInitials(m.name);
        var imgHtml;
        if (m.image_url) {
          imgHtml = '<img class="member-img" src="' + escapeAttr(m.image_url) + '" alt="' + escapeAttr(m.name) + '" loading="lazy">';
        } else {
          imgHtml = '';
        }

        return '<div class="member-card alumni-card">' +
          '<div class="member-img-wrapper">' +
          '<div class="member-placeholder"><span class="member-initials">' + escapeHtml(initials) + '</span></div>' +
          imgHtml +
          '</div>' +
          '<div class="member-card-text">' +
          '<h3 class="member-name">' + escapeHtml(m.name) + '</h3>' +
          '<p class="member-role">' + escapeHtml(m.panel_name) + '</p>' +
          '</div></div>';
      }).join('');

      // Handle image load errors – hide broken images to reveal placeholder
      var imgs = container.querySelectorAll('.member-img');
      var i;
      for (i = 0; i < imgs.length; i++) {
        imgs[i].addEventListener('error', function () {
          this.style.display = 'none';
        });
        // If image already errored before listener attached
        if (imgs[i].complete && imgs[i].naturalWidth === 0) {
          imgs[i].style.display = 'none';
        }
      }
    }

    function getInitials(name) {
      return name.split(' ').map(function (w) { return w.charAt(0); }).join('').substring(0, 2).toUpperCase();
    }

    function escapeHtml(str) {
      var d = document.createElement('div');
      d.appendChild(document.createTextNode(str));
      return d.innerHTML;
    }

    function escapeAttr(str) {
      return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
  });

})();
