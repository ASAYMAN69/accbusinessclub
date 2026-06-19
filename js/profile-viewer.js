(function () {
  'use strict';

  var overlay;

  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'profile-overlay';
    overlay.id = 'profileOverlay';
    overlay.innerHTML =
      '<div class="profile-overlay-bg" id="overlayBg"></div>' +
      '<div class="profile-card-wrapper">' +
        '<button class="profile-close-btn" id="closeProfileBtn" aria-label="Close">&times;</button>' +
        '<div class="profile-card" id="profileCard">' +
          '<img class="profile-img" id="profileImg" src="" alt="">' +
          '<div class="profile-img-fallback" id="profileImgFallback"></div>' +
          '<div class="profile-info" id="profileInfo">' +
            '<h1 id="infoName"></h1>' +
            '<p class="designation" id="infoRole"></p>' +
            '<div class="profile-quote" id="profileQuote"></div>' +
            '<div class="timeline-tag" id="profileTimeline"><i class="fa-regular fa-calendar-check"></i> <span id="timelineText"></span></div>' +
            '<div class="achievements-box" id="achievementsBox"><h3>Key Milestones</h3><ul id="achievementsList"></ul></div>' +
            '<div class="social-matrix" id="socialMatrix"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);
  }

  function bindEvents() {
    document.getElementById('overlayBg').addEventListener('click', close);
    document.getElementById('closeProfileBtn').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) close();
    });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  var escapeHtml = function (str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  };

  var getInitials = function (name) {
    return name.split(' ').map(function (w) { return w.charAt(0); }).join('').substring(0, 2).toUpperCase();
  };

  function buildSocialHTML(m) {
    var items = [];
    function add(cond, icon, href, label) {
      if (!cond) return;
      items.push('<a href="' + href + '" target="_blank" rel="noopener" aria-label="' + label + '"><i class="' + icon + '"></i></a>');
    }
    if (m.facebook) {
      var fb = m.facebook;
      add(true, 'fa-brands fa-facebook', fb.indexOf('http') === 0 ? fb : 'https://facebook.com/' + encodeURIComponent(fb), 'Facebook');
    }
    if (m.instagram) {
      var ig = m.instagram;
      add(true, 'fa-brands fa-instagram', ig.indexOf('http') === 0 ? ig : 'https://instagram.com/' + encodeURIComponent(ig), 'Instagram');
    }
    if (m.whatsapp) {
      var wa = m.whatsapp;
      if (/^[\d\s\-\+]+$/.test(wa)) wa = 'https://wa.me/' + wa.replace(/[\s\-\+]/g, '');
      else if (wa.indexOf('http') !== 0) wa = 'https://wa.me/' + encodeURIComponent(wa);
      add(true, 'fa-brands fa-whatsapp', wa, 'WhatsApp');
    }
    if (m.linkedin_url) {
      var li = m.linkedin_url;
      add(true, 'fa-brands fa-linkedin', li.indexOf('http') === 0 ? li : 'https://linkedin.com/in/' + encodeURIComponent(li), 'LinkedIn');
    }
    if (m.phone_number) {
      var tel = m.phone_number.replace(/[\s\-\+\(\)]/g, '');
      if (tel.length > 0 && tel.indexOf('+') !== 0) tel = '+' + tel;
      add(true, 'fa-solid fa-phone', 'tel:' + tel, 'Phone');
    }
    return items.join('');
  }

  window.openProfileViewer = function (member) {
    createOverlay();

    var name = member.name || 'Unknown';
    var role = member.role || member.panel_name || '';
    var image = member.image || member.image_url || '';
    var quote = member.quote || '';
    var achievements = member.achievements || [];
    var initials = getInitials(name);

    var imgEl = document.getElementById('profileImg');
    var fbEl = document.getElementById('profileImgFallback');
    if (image) {
      imgEl.src = image;
      imgEl.style.display = '';
      fbEl.style.display = 'none';
      imgEl.onerror = function () {
        this.style.display = 'none';
        fbEl.textContent = initials;
        fbEl.style.display = 'flex';
      };
    } else {
      imgEl.style.display = 'none';
      fbEl.textContent = initials;
      fbEl.style.display = 'flex';
    }

    document.getElementById('infoName').textContent = name;
    document.getElementById('infoRole').textContent = role;

    var tlEl = document.getElementById('profileTimeline');
    var tlText = document.getElementById('timelineText');
    if (member.year) { tlText.textContent = 'Class of ' + member.year; tlEl.style.display = ''; }
    else if (member.quote) { tlEl.style.display = 'none'; }
    else { tlText.textContent = 'Active Member'; tlEl.style.display = ''; }

    var qEl = document.getElementById('profileQuote');
    if (quote) { qEl.innerHTML = '<i class="fa-solid fa-quote-left"></i> ' + escapeHtml(quote); qEl.style.display = ''; }
    else { qEl.style.display = 'none'; }

    var aList = document.getElementById('achievementsList');
    var aBox = document.getElementById('achievementsBox');
    if (achievements.length > 0) {
      aList.innerHTML = achievements.map(function (a) {
        var num = a.serial ? a.serial + '. ' : '';
        var txt = a.text || a;
        return '<li><i class="fa-solid fa-circle-check"></i> ' + escapeHtml(num + txt) + '</li>';
      }).join('');
      aBox.style.display = '';
    } else { aBox.style.display = 'none'; }

    var sEl = document.getElementById('socialMatrix');
    var sHtml = buildSocialHTML(member);
    if (sHtml) { sEl.innerHTML = sHtml; sEl.style.display = ''; }
    else { sEl.style.display = 'none'; }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  createOverlay();
  bindEvents();
})();
