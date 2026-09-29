(function () {
  "use strict";

  function init() {
    var form = document.getElementById("join-form");
    if (!form) return;

    var card = document.getElementById("join-card");
    var success = document.getElementById("join-success");
    var nameInput = document.getElementById("join-name");
    var nameError = document.getElementById("name-error");
    var collegeIdInput = document.getElementById("join-id");
    var idError = document.getElementById("id-error");
    var duplicateIdError = document.getElementById("id-duplicate-error");
    var interestPills = form.querySelectorAll(".interest-pill");
    var cookiePills = form.querySelectorAll(".cookie-pill");
    var interestError = document.getElementById("interest-error");
    var cookieError = document.getElementById("cookie-error");
    var dropdowns = form.querySelectorAll(".join-dropdown");
    var cfError = document.getElementById("cf-error");
    var generalError = document.getElementById("form-general-error");
    var submitBtn = document.getElementById("join-submit-btn") || form.querySelector('button[type="submit"]');
    var smoothScroll = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

    var prevClubPills = form.querySelectorAll(".yn-pill[data-field='prevClub']");
    var prevClubInput = document.getElementById("join-prev-club");
    var prevClubError = document.getElementById("prev-club-error");
    var joinedClubsPills = form.querySelectorAll(".yn-pill[data-field='joinedClubs']");
    var joinedClubsInput = document.getElementById("join-joined-clubs");
    var joinedClubsError = document.getElementById("joined-clubs-error");
    var nameOfClubsInput = document.getElementById("join-name-of-clubs");
    var nameOfClubsError = document.getElementById("name-of-clubs-error");
    var nameOfClubsField = document.getElementById("field-name-of-clubs");
    var wpInput = document.getElementById("join-wp");
    var wpError = document.getElementById("wp-error");
    var fbInput = document.getElementById("join-fb");
    var fbError = document.getElementById("fb-error");

    var turnstileWidgetId = null;
    var turnstileToken = "";

    function debounce(fn, delay) {
      var timer = null;
      return function () {
        var context = this;
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fn.apply(context, args);
        }, delay);
      };
    }

    function selectedOf(pills) {
      return Array.prototype.filter.call(pills, function (btn) {
        return btn.classList.contains("selected");
      });
    }

    // 1. Validation Logic
    function validateName(showError) {
      var val = nameInput.value.trim();
      var msg = "";
      var valid = true;

      if (!val) {
        msg = "Please enter your full name.";
        valid = false;
      } else if (val.length > 64) {
        msg = "Full name must be 64 characters or fewer.";
        valid = false;
      } else if (!/^[A-Za-z.()\s]+$/.test(val)) {
        msg = "Only letters (A-Z, a-z), spaces, dots, and parentheses are allowed.";
        valid = false;
      }

      if (showError) {
        if (nameError) {
          nameError.textContent = msg;
          nameError.classList.toggle("show", !valid);
        }
        nameInput.classList.toggle("invalid", !valid);
      } else if (valid) {
        if (nameError) nameError.classList.remove("show");
        nameInput.classList.remove("invalid");
      }

      return {
        valid: valid,
        el: document.getElementById("field-name") || nameInput,
        focusEl: nameInput
      };
    }

    function validateId(showError) {
      var val = collegeIdInput.value.trim();
      var msg = "";
      var valid = true;

      if (!val) {
        msg = "Please enter your 6-digit College ID.";
        valid = false;
      } else if (!/^[0-9]{6}$/.test(val)) {
        msg = "College ID must be exactly 6 numeric digits.";
        valid = false;
      }

      if (showError) {
        if (idError) {
          idError.textContent = msg;
          idError.classList.toggle("show", !valid);
        }
        collegeIdInput.classList.toggle("invalid", !valid);
      } else if (valid) {
        if (idError) idError.classList.remove("show");
        collegeIdInput.classList.remove("invalid");
      }

      return {
        valid: valid,
        el: document.getElementById("field-id") || collegeIdInput,
        focusEl: collegeIdInput
      };
    }

    function validateDropdown(field, showError) {
      var dropdown = form.querySelector('.join-dropdown[data-field="' + field + '"]');
      if (!dropdown) return { valid: true, el: null, focusEl: null };

      var input = dropdown.querySelector('input[type="hidden"]');
      var trigger = dropdown.querySelector(".join-dropdown-trigger");
      var error = document.getElementById(field + "-error");
      var valid = Boolean(input && input.value);

      if (showError) {
        if (trigger) trigger.classList.toggle("invalid", !valid);
        if (error) error.classList.toggle("show", !valid);
      } else if (valid) {
        if (trigger) trigger.classList.remove("invalid");
        if (error) error.classList.remove("show");
      }

      return {
        valid: valid,
        el: document.getElementById("field-" + field) || dropdown,
        focusEl: trigger
      };
    }

    function validateInterests(showError) {
      var interests = selectedOf(interestPills);
      var valid = interests.length > 0;

      if (showError) {
        if (interestError) interestError.classList.toggle("show", !valid);
      } else if (valid) {
        if (interestError) interestError.classList.remove("show");
      }

      return {
        valid: valid,
        el: document.getElementById("field-interests") || (interestPills[0] && interestPills[0].parentElement),
        focusEl: interestPills[0]
      };
    }

    function validateCookies(showError) {
      var cookie = selectedOf(cookiePills);
      var valid = cookie.length === 1;

      if (showError) {
        if (cookieError) cookieError.classList.toggle("show", !valid);
      } else if (valid) {
        if (cookieError) cookieError.classList.remove("show");
      }

      return {
        valid: valid,
        el: document.getElementById("field-cookies") || (cookiePills[0] && cookiePills[0].parentElement),
        focusEl: cookiePills[0]
      };
    }

    function validateTurnstile(showError) {
      var activeCfToken = turnstileToken || (window.turnstile && turnstileWidgetId !== null ? window.turnstile.getResponse(turnstileWidgetId) : "");
      if (!activeCfToken && (!window.turnstile || window.location.protocol === "file:")) {
        activeCfToken = "1x00000000000000000000AA";
      }

      var valid = Boolean(activeCfToken);
      if (showError) {
        if (cfError) cfError.classList.toggle("show", !valid);
      } else if (valid) {
        if (cfError) cfError.classList.remove("show");
      }

       return {
         valid: valid,
         el: document.getElementById("cf-turnstile-wrap") || cfError,
         focusEl: document.getElementById("cf-turnstile-widget")
       };
     }

     function validateYN(pills, errorEl, fieldEl, showError) {
       var chosen = selectedOf(pills);
       var valid = chosen.length === 1;
       if (showError) {
         if (errorEl) errorEl.classList.toggle("show", !valid);
         pills.forEach(function (p) { p.classList.toggle("invalid", !valid && !p.classList.contains("selected")); });
       } else if (valid) {
         if (errorEl) errorEl.classList.remove("show");
         pills.forEach(function (p) { p.classList.remove("invalid"); });
       }
       return { valid: valid, el: fieldEl, focusEl: pills[0] };
     }

     function validateFreeText(input, errorEl, fieldEl, maxLen, pattern, showError) {
       var val = input.value.trim();
       var valid = true;
       var msg = "";
       if (!val) { msg = "This field is required."; valid = false; }
       else if (val.length > maxLen) { msg = "Must be " + maxLen + " characters or fewer."; valid = false; }
       else if (!pattern.test(val)) { msg = "Only A-Z, a-z, 0-9, spaces, and ().,: allowed."; valid = false; }
       if (showError) {
         if (errorEl) { errorEl.textContent = msg; errorEl.classList.toggle("show", !valid); }
         input.classList.toggle("invalid", !valid);
       } else if (valid) {
         if (errorEl) errorEl.classList.remove("show");
         input.classList.remove("invalid");
       }
       return { valid: valid, el: fieldEl, focusEl: input };
     }

     var WP_RE = /^\+[1-9][0-9]{7,14}$/;
     var FB_USERNAME_RE = /^[A-Za-z0-9._-]{1,64}$/;
     var FB_RESERVED = new Set(["profile.php","groups","events","pages","photo","photos","videos","watch","marketplace","sharer","login","help","about","settings"]);

     function validateWpNumber(showError) {
       var raw = wpInput.value.trim();
       var s = raw.replace(/[\s.\-()]/g, "");
       if (s.startsWith("00")) s = "+" + s.slice(2);
       else if (s.startsWith("0") && /^\d{11}$/.test(s)) s = "+880" + s.slice(1);
       else if (/^\d{12}$/.test(s) && s.startsWith("880")) s = "+" + s;
       else if (/^\d{9,15}$/.test(s)) s = "+" + s;
       var msg = "", valid = true;
       if (!raw) { msg = "Whatsapp number is required."; valid = false; }
       else if (!s.startsWith("+")) { msg = "Add country code, e.g. +8801712345678."; valid = false; }
       else if (!WP_RE.test(s)) { msg = "Enter 8-15 digits after the country code."; valid = false; }
       else if (s.startsWith("+880") && !/^\+8801[3-9]\d{8}$/.test(s)) { msg = "Enter a valid Bangladeshi mobile (01[3-9]XXXXXXXX)."; valid = false; }
       if (showError) {
         if (wpError) { wpError.textContent = msg; wpError.classList.toggle("show", !valid); }
         wpInput.classList.toggle("invalid", !valid);
       } else if (valid) {
         if (wpError) wpError.classList.remove("show");
         wpInput.classList.remove("invalid");
       }
       return { valid: valid, el: document.getElementById("field-wp"), focusEl: wpInput };
     }

     function validateFbId(showError) {
       var raw = fbInput.value.trim();
       if (!raw) { if (showError) { fbError.classList.remove("show"); fbInput.classList.remove("invalid"); } return { valid: true, el: document.getElementById("field-fb"), focusEl: fbInput }; }
       var msg = "", valid = true, url;
       try { url = new URL(raw); } catch { msg = "Invalid link — include https://, e.g. https://facebook.com/yourname."; valid = false; }
       if (valid && url.protocol !== "https:") { msg = "Only https:// links are accepted."; valid = false; }
       if (valid) {
         var host = url.hostname.toLowerCase().replace(/^www\./, "");
         if (host !== "facebook.com" && host !== "m.facebook.com" && host !== "fb.com" && host !== "www.fb.com") { msg = "Must be a Facebook link (facebook.com or fb.com)."; valid = false; }
       }
       if (valid) {
         var path = url.pathname.replace(/^\//, "").replace(/\/+$/, "");
         var seg = path.split("/").filter(Boolean);
         if (!seg.length) { msg = "Missing username — link should end with your profile name."; valid = false; }
         else if (seg.length > 1 || FB_RESERVED.has(seg[seg.length - 1])) { msg = "Use your profile link only, not a group/page/event/photo."; valid = false; }
         else if (!FB_USERNAME_RE.test(seg[seg.length - 1])) { msg = "Profile names allow only letters, numbers, . - _."; valid = false; }
       }
       if (showError) {
         if (fbError) { fbError.textContent = msg; fbError.classList.toggle("show", !valid); }
         fbInput.classList.toggle("invalid", !valid);
       } else if (valid) {
         if (fbError) fbError.classList.remove("show");
         fbInput.classList.remove("invalid");
       }
       return { valid: valid, el: document.getElementById("field-fb"), focusEl: fbInput };
     }

    // 2. Real-time / Deactivation (Blur) Handlers
    var debouncedNameCheck = debounce(function () {
      if (nameInput.value.length > 0) {
        validateName(nameError && nameError.classList.contains("show"));
      }
    }, 300);

    nameInput.addEventListener("blur", function () {
      validateName(true);
    });

    nameInput.addEventListener("input", function () {
      if (nameError && nameError.classList.contains("show")) {
        validateName(true);
      } else {
        debouncedNameCheck();
      }
    });

    var debouncedIdCheck = debounce(function () {
      if (collegeIdInput.value.length > 0) {
        validateId(idError && idError.classList.contains("show"));
      }
    }, 300);

    collegeIdInput.addEventListener("blur", function () {
      validateId(true);
    });

    collegeIdInput.addEventListener("input", function () {
      collegeIdInput.value = collegeIdInput.value.replace(/\D/g, "").slice(0, 6);
      if (duplicateIdError) duplicateIdError.classList.remove("show");
      if (idError && idError.classList.contains("show")) {
        validateId(true);
      } else if (collegeIdInput.value.length === 6) {
        validateId(true);
      } else {
        debouncedIdCheck();
      }
    });

    function revealConditional(triggerInput, conditionalField, textInput) {
      var show = triggerInput.value === "true";
      if (show) {
        conditionalField.classList.add("show");
      } else {
        conditionalField.classList.remove("show");
        textInput.value = "";
        var err = textInput.parentElement.querySelector(".pills-error");
        if (err) err.classList.remove("show");
        textInput.classList.remove("invalid");
      }
    }

    var CLUB_NAME_RE = /^[A-Za-z0-9 ().,:]+$/;

    function bindTextValidation(input, errorEl, fieldId, maxLen) {
      input.addEventListener("blur", function () {
        if (!input.value.trim()) return;
        validateFreeText(input, errorEl, document.getElementById(fieldId), maxLen, CLUB_NAME_RE, true);
      });
      input.addEventListener("input", function () {
        if (errorEl && errorEl.classList.contains("show")) {
          validateFreeText(input, errorEl, document.getElementById(fieldId), maxLen, CLUB_NAME_RE, true);
        }
      });
    }

    bindTextValidation(nameOfClubsInput, nameOfClubsError, "field-name-of-clubs", 256);

    wpInput.addEventListener("blur", function () { validateWpNumber(true); });
    wpInput.addEventListener("input", function () {
      if (wpError && wpError.classList.contains("show")) validateWpNumber(true);
    });

    fbInput.addEventListener("blur", function () { validateFbId(true); });
    fbInput.addEventListener("input", function () {
      if (fbError && fbError.classList.contains("show")) validateFbId(true);
    });

     function bindToggle(btn, siblings, onSelect) {
       btn.addEventListener("click", function () {
         siblings.forEach(function (other) { other.classList.remove("selected"); other.setAttribute("aria-pressed", "false"); });
         btn.classList.add("selected");
         btn.setAttribute("aria-pressed", "true");
         onSelect();
       });
     }

     function bindMultiToggle(btn, onSelect) {
       btn.addEventListener("click", function () {
         var on = !btn.classList.contains("selected");
         btn.classList.toggle("selected", on);
         btn.setAttribute("aria-pressed", on ? "true" : "false");
         onSelect();
       });
     }

     function bindExclusiveGroup(pills, onSelect) {
       pills.forEach(function (btn) {
         btn.addEventListener("click", function () {
           pills.forEach(function (other) { other.classList.remove("selected"); other.setAttribute("aria-pressed", "false"); });
           btn.classList.add("selected");
           btn.setAttribute("aria-pressed", "true");
           onSelect(btn);
         });
       });
     }

     interestPills.forEach(function (btn) { bindMultiToggle(btn, validateInterests.bind(null, true)); });
     cookiePills.forEach(function (btn) { bindToggle(btn, cookiePills, validateCookies.bind(null, true)); });
     bindExclusiveGroup(prevClubPills, function (btn) {
       prevClubInput.value = btn.classList.contains("yn-yes") ? "true" : "false";
       validateYN(prevClubPills, document.getElementById("prev-club-error"), document.getElementById("field-prev-club"), true);
     });
     bindExclusiveGroup(joinedClubsPills, function (btn) {
       joinedClubsInput.value = btn.classList.contains("yn-yes") ? "true" : "false";
       validateYN(joinedClubsPills, joinedClubsError, document.getElementById("field-joined-clubs"), true);
       revealConditional(joinedClubsInput, nameOfClubsField, nameOfClubsInput);
     });

    function closeDropdown(dropdown) {
      dropdown.classList.remove("is-open");
      dropdown.querySelector(".join-dropdown-trigger").setAttribute("aria-expanded", "false");
      dropdown.querySelector(".join-dropdown-menu").removeAttribute("aria-activedescendant");
    }

    function closeDropdowns(except) {
      dropdowns.forEach(function (dropdown) {
        if (dropdown !== except) closeDropdown(dropdown);
      });
    }

    dropdowns.forEach(function (dropdown) {
      var trigger = dropdown.querySelector(".join-dropdown-trigger");
      var menu = dropdown.querySelector(".join-dropdown-menu");
      var options = dropdown.querySelectorAll(".join-dropdown-option");
      var input = dropdown.querySelector('input[type="hidden"]');
      var value = dropdown.querySelector(".join-dropdown-value");
      var fieldName = dropdown.dataset.field;
      var highlighted = -1;

      function highlight(index) {
        highlighted = Math.max(0, Math.min(index, options.length - 1));
        options.forEach(function (option, optionIndex) {
          option.classList.toggle("highlighted", optionIndex === highlighted);
        });
        if (options[highlighted]) {
          trigger.setAttribute("aria-activedescendant", options[highlighted].id || "");
          options[highlighted].scrollIntoView({ block: "nearest" });
        }
      }

      function select(option) {
        options.forEach(function (item) {
          item.classList.remove("selected");
          item.setAttribute("aria-selected", "false");
        });
        option.classList.add("selected");
        option.setAttribute("aria-selected", "true");
        input.value = option.dataset.value;
        value.textContent = option.textContent;
        trigger.classList.remove("invalid");
        closeDropdown(dropdown);
        validateDropdown(fieldName, true);
      }

      options.forEach(function (option, index) {
        option.id = dropdown.dataset.field + "-option-" + index;
        option.setAttribute("aria-selected", "false");
        option.addEventListener("click", function () { select(option); });
        option.addEventListener("mouseenter", function () { highlight(index); });
      });

      trigger.addEventListener("click", function () {
        var opening = !dropdown.classList.contains("is-open");
        closeDropdowns(dropdown);
        dropdown.classList.toggle("is-open", opening);
        trigger.setAttribute("aria-expanded", String(opening));
        if (opening) highlight(Math.max(0, Array.prototype.indexOf.call(options, dropdown.querySelector(".selected"))));
      });

      trigger.addEventListener("blur", function () {
        setTimeout(function () {
          if (!dropdown.classList.contains("is-open")) {
            validateDropdown(fieldName, true);
          }
        }, 150);
      });

      trigger.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (!dropdown.classList.contains("is-open")) {
            closeDropdowns(dropdown);
            dropdown.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
            highlight(event.key === "ArrowDown" ? 0 : options.length - 1);
          } else {
            highlight(highlighted + (event.key === "ArrowDown" ? 1 : -1));
          }
        } else if (event.key === "Enter" && dropdown.classList.contains("is-open")) {
          event.preventDefault();
          if (options[highlighted]) select(options[highlighted]);
        } else if (event.key === "Escape") {
          closeDropdown(dropdown);
          validateDropdown(fieldName, true);
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (!event.target.closest(".join-dropdown")) closeDropdowns(null);
    });

    // 3. Turnstile Loader
    function initTurnstile() {
      var container = document.getElementById("cf-turnstile-widget");
      if (!container || turnstileWidgetId !== null) return;
      var sitekey = (typeof CF_SITEKEY !== "undefined" && CF_SITEKEY) ? CF_SITEKEY : "1x00000000000000000000AA";
      if (window.turnstile && typeof window.turnstile.render === "function") {
        try {
          container.innerHTML = "";
          turnstileWidgetId = window.turnstile.render(container, {
            sitekey: sitekey,
            theme: "dark",
            callback: function (token) {
              turnstileToken = token;
              if (cfError) cfError.classList.remove("show");
            },
            "expired-callback": function () {
              turnstileToken = "";
            },
            "error-callback": function () {
              turnstileToken = "";
            }
          });
        } catch (e) {
          console.warn("Turnstile render error:", e);
        }
      }
    }

    window.onTurnstileLoaded = initTurnstile;
    if (window.turnstile && typeof window.turnstile.render === "function") {
      initTurnstile();
    }

    // 4. Submit Handler with Problem Scrolling & Specific Feedback
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (generalError) generalError.classList.remove("show");
      if (duplicateIdError) duplicateIdError.classList.remove("show");

      var checks = [
        validateName(true),
        validateId(true),
        validateDropdown("section", true),
        validateDropdown("house", true),
        validateInterests(true),
        validateYN(prevClubPills, prevClubError, document.getElementById("field-prev-club"), true)
      ];

      checks.push(validateYN(joinedClubsPills, joinedClubsError, document.getElementById("field-joined-clubs"), true));

      if (joinedClubsInput.value === "true") {
        checks.push(validateFreeText(nameOfClubsInput, nameOfClubsError, nameOfClubsField, 256, CLUB_NAME_RE, true));
      }

      checks.push(
        validateWpNumber(true),
        validateFbId(true),
        validateCookies(true),
        validateTurnstile(true)
      );

      var firstInvalid = null;
      var allValid = true;

      for (var i = 0; i < checks.length; i++) {
        if (!checks[i].valid) {
          allValid = false;
          if (!firstInvalid) {
            firstInvalid = checks[i];
          }
        }
      }

      // Scroll to and focus the first problematic field
      if (!allValid && firstInvalid) {
        if (firstInvalid.el) {
          firstInvalid.el.scrollIntoView({ behavior: smoothScroll, block: "center" });
        }
        if (firstInvalid.focusEl && typeof firstInvalid.focusEl.focus === "function") {
          try {
            firstInvalid.focusEl.focus({ preventScroll: true });
          } catch (ignore) {}
        }
        return;
      }

      var activeCfToken = turnstileToken || (window.turnstile && turnstileWidgetId !== null ? window.turnstile.getResponse(turnstileWidgetId) : "");
      if (!activeCfToken && (!window.turnstile || window.location.protocol === "file:")) {
        activeCfToken = "1x00000000000000000000AA";
      }

      var interests = selectedOf(interestPills);
      var cookie = selectedOf(cookiePills);

      var backendBase = (typeof BACKEND !== "undefined" && BACKEND) ? BACKEND : "http://localhost:3000";
      var payload = {
        fullName: nameInput.value.trim(),
        collegeId: collegeIdInput.value.trim(),
        section: form.section.value,
        house: form.house.value,
        interests: interests.map(function (btn) { return btn.textContent.trim(); }),
        likeCookies: cookie[0].textContent.trim() === "Yes",
        prevClub: prevClubInput.value === "true",
        joinedClubs: joinedClubsInput.value === "true",
        nameOfClubs: joinedClubsInput.value === "true" ? nameOfClubsInput.value.trim() : null,
        wpNumber: wpInput.value.trim(),
        fbID: fbInput.value.trim(),
        cf_token: activeCfToken
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Registering...";
      }

      fetch(backendBase.replace(/\/$/, "") + "/api/public/registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
        .then(function (response) {
          if (response.ok && response.status === 200) {
            success.querySelector(".join-success-name").textContent = payload.fullName;
            form.classList.add("hidden-form");
            success.classList.add("show");
            card.scrollIntoView({ behavior: smoothScroll, block: "center" });
            setTimeout(function () {
              window.location.href = "/";
            }, 2000);
          } else if (response.status === 409) {
            if (duplicateIdError) {
              duplicateIdError.classList.add("show");
            }
            collegeIdInput.classList.add("invalid");
            var idField = document.getElementById("field-id") || collegeIdInput;
            idField.scrollIntoView({ behavior: smoothScroll, block: "center" });
            collegeIdInput.focus({ preventScroll: true });

            if (window.turnstile && turnstileWidgetId !== null) {
              try {
                window.turnstile.reset(turnstileWidgetId);
                turnstileToken = "";
              } catch (ignore) {}
            }
          } else {
            throw new Error("Registration failed with status " + response.status);
          }
        })
        .catch(function (err) {
          console.error("Submission error:", err);
          if (generalError) {
            generalError.textContent = "Registration could not be completed. Please try again.";
            generalError.classList.add("show");
            generalError.scrollIntoView({ behavior: smoothScroll, block: "center" });
          }
          if (window.turnstile && turnstileWidgetId !== null) {
            try {
              window.turnstile.reset(turnstileWidgetId);
              turnstileToken = "";
            } catch (ignore) {}
          }
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Register";
          }
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();