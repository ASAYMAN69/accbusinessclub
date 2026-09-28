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

    function bindToggle(btn, single) {
      btn.addEventListener("click", function () {
        if (single) {
          cookiePills.forEach(function (other) {
            other.classList.remove("selected");
            other.setAttribute("aria-pressed", "false");
          });
          btn.classList.add("selected");
          btn.setAttribute("aria-pressed", "true");
          validateCookies(true);
        } else {
          var now = btn.classList.toggle("selected");
          btn.setAttribute("aria-pressed", String(now));
          validateInterests(true);
        }
      });
    }

    interestPills.forEach(function (btn) { bindToggle(btn, false); });
    cookiePills.forEach(function (btn) { bindToggle(btn, true); });

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
        validateCookies(true),
        validateTurnstile(true)
      ];

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