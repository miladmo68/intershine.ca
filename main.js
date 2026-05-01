/**
 * Intershine Website - main.js
 * Handles: sticky nav, hamburger menu, hero slider,
 *          testimonials slider, smooth scroll, form, animations
 */

(function () {
  'use strict';

  // ============================================================
  // UTILITY
  // ============================================================
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return (ctx || document).querySelectorAll(sel); }

  // ============================================================
  // STICKY NAVBAR ON SCROLL
  // ============================================================
  var navbar = qs('#navbar');

  function handleNavbarScroll() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleNavbarScroll, { passive: true });
  handleNavbarScroll();

  // ============================================================
  // ACTIVE NAV LINK (highlight section in viewport)
  // ============================================================
  var sections = qsa('section[id], footer[id]');
  var navLinks = qsa('.nav-menu a');

  function setActiveNavLink() {
    var scrollPos = window.scrollY + 100;
    var currentSection = '';

    sections.forEach(function (sec) {
      if (sec.offsetTop <= scrollPos) {
        currentSection = sec.id;
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove('active');
      var href = link.getAttribute('href');
      if (href === '#' + currentSection) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', setActiveNavLink, { passive: true });
  setActiveNavLink();

  // ============================================================
  // HAMBURGER MENU TOGGLE
  // ============================================================
  var hamburger = qs('#hamburger');
  var navMenu = qs('#navMenu');
  var menuOverlay;

  function createOverlay() {
    menuOverlay = document.createElement('div');
    menuOverlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:998;display:none;';
    document.body.appendChild(menuOverlay);
    menuOverlay.addEventListener('click', closeMenu);
  }

  function openMenu() {
    hamburger.classList.add('open');
    navMenu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    menuOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    navMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    menuOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  // Close menu on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navMenu && navMenu.classList.contains('open')) {
      closeMenu();
    }
  });

  if (hamburger && navMenu) {
    createOverlay();
    hamburger.addEventListener('click', function () {
      if (navMenu.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    // Close menu when any nav link is clicked
    navLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  // ============================================================
  // SMOOTH SCROLLING
  // ============================================================
  document.addEventListener('click', function (e) {
    var target = e.target.closest('a[href^="#"]');
    if (!target) return;

    var href = target.getAttribute('href');
    if (!href || href === '#') return;

    var dest = qs(href);
    if (!dest) return;

    e.preventDefault();

    var navHeight = navbar ? navbar.offsetHeight : 0;
    var top = dest.getBoundingClientRect().top + window.scrollY - navHeight - 5;

    window.scrollTo({ top: top, behavior: 'smooth' });
  });

  // ============================================================
  // HERO IMAGE SLIDER
  // ============================================================
  var heroSlides = qsa('#heroSlider .slide');
  var heroDots = qsa('.hero .dot');
  var heroCurrentIndex = 0;
  var heroTimer;

  function showHeroSlide(index) {
    heroSlides.forEach(function (s) { s.classList.remove('active'); });
    heroDots.forEach(function (d) { d.classList.remove('active'); });

    heroCurrentIndex = (index + heroSlides.length) % heroSlides.length;
    heroSlides[heroCurrentIndex].classList.add('active');
    if (heroDots[heroCurrentIndex]) {
      heroDots[heroCurrentIndex].classList.add('active');
    }
  }

  function nextHeroSlide() {
    showHeroSlide(heroCurrentIndex + 1);
  }

  function startHeroAutoplay() {
    heroTimer = setInterval(nextHeroSlide, 5000);
  }

  function stopHeroAutoplay() {
    clearInterval(heroTimer);
  }

  if (heroSlides.length > 1) {
    // Hero dot clicks
    heroDots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        stopHeroAutoplay();
        showHeroSlide(parseInt(this.dataset.index, 10));
        startHeroAutoplay();
      });
    });

    showHeroSlide(0);
    startHeroAutoplay();

    // Pause on hover
    var heroSection = qs('#home');
    if (heroSection) {
      heroSection.addEventListener('mouseenter', stopHeroAutoplay);
      heroSection.addEventListener('mouseleave', startHeroAutoplay);
    }
  }

  // ============================================================
  // TESTIMONIALS SLIDER  (1-up mobile / 3-up desktop)
  // ============================================================
  var testimonialsTrack = qs('#testimonialsTrack');
  var testimonialCards = qsa('.testimonial-card');
  var sliderDots = qsa('#sliderDots .dot');
  var prevBtn = qs('#prevBtn');
  var nextBtn = qs('#nextBtn');
  var testimonialCurrentIndex = 0;
  var testimonialTimer;
  var testimonialTotal = testimonialCards.length;

  function getVisibleCount() {
    return window.innerWidth >= 860 ? 3 : 1;
  }

  function getMaxIndex() {
    return Math.max(0, testimonialTotal - getVisibleCount());
  }

  function syncDots() {
    var maxIdx = getMaxIndex();
    sliderDots.forEach(function (d, i) {
      d.style.display = i <= maxIdx ? 'inline-block' : 'none';
      d.classList.toggle('active', i === testimonialCurrentIndex);
    });
  }

  function showTestimonial(index) {
    var maxIdx = getMaxIndex();
    // wrap
    if (index < 0) index = maxIdx;
    if (index > maxIdx) index = 0;
    testimonialCurrentIndex = index;

    var visCount = getVisibleCount();
    var cardWidth = testimonialsTrack.parentElement.offsetWidth / visCount;
    testimonialsTrack.style.transform = 'translateX(-' + (testimonialCurrentIndex * cardWidth) + 'px)';
    syncDots();
  }

  function startTestimonialAutoplay() {
    testimonialTimer = setInterval(function () {
      showTestimonial(testimonialCurrentIndex + 1);
    }, 6000);
  }

  function stopTestimonialAutoplay() {
    clearInterval(testimonialTimer);
  }

  if (testimonialsTrack && testimonialTotal > 0) {
    showTestimonial(0);
    startTestimonialAutoplay();

    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        stopTestimonialAutoplay();
        showTestimonial(testimonialCurrentIndex - 1);
        startTestimonialAutoplay();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        stopTestimonialAutoplay();
        showTestimonial(testimonialCurrentIndex + 1);
        startTestimonialAutoplay();
      });
    }

    sliderDots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        stopTestimonialAutoplay();
        showTestimonial(parseInt(this.dataset.index, 10));
        startTestimonialAutoplay();
      });
    });

    // Touch/swipe
    var touchStartX = 0;
    testimonialsTrack.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    testimonialsTrack.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        stopTestimonialAutoplay();
        showTestimonial(testimonialCurrentIndex + (diff > 0 ? 1 : -1));
        startTestimonialAutoplay();
      }
    }, { passive: true });

    // Reposition + re-sync on resize (no animation flash)
    window.addEventListener('resize', function () {
      var prev = testimonialsTrack.style.transition;
      testimonialsTrack.style.transition = 'none';
      // clamp index to new maxIndex
      testimonialCurrentIndex = Math.min(testimonialCurrentIndex, getMaxIndex());
      var cardWidth = testimonialsTrack.parentElement.offsetWidth / getVisibleCount();
      testimonialsTrack.style.transform = 'translateX(-' + (testimonialCurrentIndex * cardWidth) + 'px)';
      testimonialsTrack.offsetHeight; // force reflow
      testimonialsTrack.style.transition = prev;
      syncDots();
    }, { passive: true });

    // Pause on hover
    var testimonialSection = qs('#testimonials');
    if (testimonialSection) {
      testimonialSection.addEventListener('mouseenter', stopTestimonialAutoplay);
      testimonialSection.addEventListener('mouseleave', startTestimonialAutoplay);
    }
  }

  // ============================================================
  // BOOKING FORM — VALIDATION & REAL SUBMISSION
  // ============================================================
  var bookingForm = qs('#bookingForm');
  var formWrapper = qs('.booking-form-wrapper');

  if (bookingForm && formWrapper) {

    // --- Set today as min date ---
    var dateInput = qs('#date');
    if (dateInput) {
      var today = new Date();
      dateInput.min = today.toISOString().split('T')[0];
    }

    // --- Inject error spans under every input/select/textarea ---
    bookingForm.querySelectorAll('input, select, textarea').forEach(function (field) {
      if (field.type === 'checkbox') return;
      if (!field.parentElement.querySelector('.field-error')) {
        var errSpan = document.createElement('span');
        errSpan.className = 'field-error';
        errSpan.setAttribute('aria-live', 'polite');
        errSpan.setAttribute('role', 'alert');
        field.parentElement.appendChild(errSpan);
      }
    });

    // --- Wrap submit button text + add spinner ---
    var submitBtn = bookingForm.querySelector('[type="submit"]');
    submitBtn.classList.add('btn-submit');
    var btnText = document.createElement('span');
    btnText.className = 'btn-text';
    btnText.textContent = submitBtn.textContent.trim();
    submitBtn.textContent = '';
    submitBtn.appendChild(btnText);
    var spinner = document.createElement('span');
    spinner.className = 'btn-spinner';
    submitBtn.appendChild(spinner);

    // --- Inject success overlay (hidden by default) ---
    var successOverlay = document.createElement('div');
    successOverlay.className = 'form-success-overlay';
    successOverlay.innerHTML =
      '<div class="success-icon">' +
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
          '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>' +
        '</svg>' +
      '</div>' +
      '<h3>Request Sent!</h3>' +
      '<p>Thank you for reaching out. We\u2019ll review your booking request and contact you within 24\u00a0hours.</p>';
    formWrapper.appendChild(successOverlay);

    // --- Validation helpers ---
    function fieldError(field, msg) {
      field.classList.add('is-invalid');
      field.classList.remove('is-valid');
      var el = field.parentElement.querySelector('.field-error');
      if (el) el.textContent = msg;
    }

    function fieldClear(field) {
      field.classList.remove('is-invalid', 'is-valid');
      var el = field.parentElement.querySelector('.field-error');
      if (el) el.textContent = '';
    }

    function fieldOk(field) {
      field.classList.remove('is-invalid');
      if (field.type !== 'date' && field.tagName !== 'SELECT') {
        field.classList.add('is-valid');
      }
      var el = field.parentElement.querySelector('.field-error');
      if (el) el.textContent = '';
    }

    function validateField(field) {
      var val = field.value.trim();

      if (field.required && !val) {
        fieldError(field, 'This field is required.');
        return false;
      }
      if (field.type === 'email' && val) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          fieldError(field, 'Please enter a valid email address.');
          return false;
        }
      }
      if (field.type === 'tel' && val) {
        if (!/^[\d\s\+\-\(\)\.]{7,20}$/.test(val)) {
          fieldError(field, 'Please enter a valid phone number.');
          return false;
        }
      }
      if (field.type === 'date' && val) {
        var todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
        if (new Date(val) < todayMidnight) {
          fieldError(field, 'Please select today or a future date.');
          return false;
        }
      }

      if (field.required || val) fieldOk(field);
      return true;
    }

    // --- Real-time validation on blur / re-validate on input after error ---
    bookingForm.querySelectorAll('input[required], select[required], textarea[required]').forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () {
        if (field.classList.contains('is-invalid')) validateField(field);
      });
    });

    // --- Loading state ---
    function setLoading(on) {
      submitBtn.disabled = on;
      submitBtn.classList.toggle('loading', on);
      var t = submitBtn.querySelector('.btn-text');
      if (t) t.textContent = on ? 'Sending\u2026' : 'Send Booking Request';
    }

    // --- Error banner ---
    var formMessage = qs('#formMessage');
    function showError(msg) {
      if (!formMessage) return;
      formMessage.textContent = msg;
      formMessage.className = 'form-message error';
      formMessage.style.display = 'block';
      setTimeout(function () {
        formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
    function hideError() {
      if (formMessage) formMessage.style.display = 'none';
    }

    // --- Submit ---
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideError();

      // Validate all required fields
      var allValid = true;
      bookingForm.querySelectorAll('input[required], select[required], textarea[required]').forEach(function (field) {
        if (!validateField(field)) allValid = false;
      });

      if (!allValid) {
        var first = bookingForm.querySelector('.is-invalid');
        if (first) { first.focus(); }
        return;
      }

      setLoading(true);

      // Build a plain object so the server receives JSON. Multi-value
      // checkbox names (days) are collected into an array.
      var fd = new FormData(bookingForm);
      var payload = {};
      fd.forEach(function (value, key) {
        if (key.endsWith('[]')) key = key.slice(0, -2);
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          if (!Array.isArray(payload[key])) payload[key] = [payload[key]];
          payload[key].push(value);
        } else {
          payload[key] = value;
        }
      });
      // Ensure `days` is always an array (FormData omits unchecked boxes)
      var allDays = [];
      bookingForm.querySelectorAll('input[name="days"]:checked').forEach(function (el) {
        allDays.push(el.value);
      });
      payload.days = allDays;

      var endpoint = bookingForm.getAttribute('action') || '/api/booking';

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (data) {
          return { ok: response.ok, status: response.status, data: data };
        });
      })
      .then(function (result) {
        setLoading(false);

        if (result.ok && result.data && result.data.success) {
          // Only clear/hide the form on confirmed success
          bookingForm.reset();
          bookingForm.style.display = 'none';
          successOverlay.classList.add('visible');
          successOverlay.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return;
        }

        // Field-level errors from the server (HTTP 422)
        if (result.status === 422 && result.data && result.data.errors) {
          var firstField = null;
          Object.keys(result.data.errors).forEach(function (name) {
            var field = bookingForm.querySelector('[name="' + name + '"]');
            if (field) {
              fieldError(field, result.data.errors[name]);
              if (!firstField) firstField = field;
            }
          });
          if (firstField) firstField.focus();
          showError(result.data.message || 'Please correct the highlighted fields.');
          return;
        }

        showError(
          (result.data && result.data.message) ||
          'Something went wrong submitting your request. Please try again or call us directly.'
        );
      })
      .catch(function () {
        setLoading(false);
        showError(
          'We could not reach our booking service. ' +
          'Please check your connection and try again, or call us directly.'
        );
      });
    });
  }

  // ============================================================
  // SCROLL-REVEAL ANIMATIONS (with group stagger)
  // ============================================================
  var animatedEls = qsa('.feature-box, .step-box, .service-card, .pricing-card');

  animatedEls.forEach(function (el) {
    el.classList.add('fade-in');
  });

  // Track which parent groups have already been triggered
  var triggeredGroups = new WeakSet();

  function checkAnimations() {
    var viewBottom = window.scrollY + window.innerHeight;

    qsa('.fade-in:not(.visible)').forEach(function (el) {
      var top = el.getBoundingClientRect().top + window.scrollY;
      if (top >= viewBottom - 80) return;

      var parent = el.parentElement;
      // If the element is in a grid group, trigger all siblings together
      var siblings = parent ? parent.querySelectorAll('.fade-in') : null;

      if (siblings && siblings.length > 1 && !triggeredGroups.has(parent)) {
        triggeredGroups.add(parent);
        siblings.forEach(function (sib, i) {
          // CSS nth-child delays handle the visual stagger
          sib.classList.add('visible');
        });
      } else if (!parent || siblings.length <= 1) {
        el.classList.add('visible');
      }
    });
  }

  window.addEventListener('scroll', checkAnimations, { passive: true });
  window.addEventListener('resize', checkAnimations, { passive: true });
  checkAnimations();

  // ============================================================
  // SCROLL TO TOP BUTTON
  // ============================================================
  var scrollTopBtn = document.createElement('button');
  scrollTopBtn.className = 'scroll-top';
  scrollTopBtn.setAttribute('aria-label', 'Scroll to top');
  scrollTopBtn.innerHTML = '&#8679;';
  document.body.appendChild(scrollTopBtn);

  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }, { passive: true });

  scrollTopBtn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ============================================================
  // MOBILE STICKY CTA — hide when booking form / footer in view
  // ============================================================
  var mobileCta = qs('#mobileCta');
  if (mobileCta) {
    document.body.classList.add('has-mobile-cta');

    var hideTargets = [qs('#booking'), qs('#contact')].filter(Boolean);

    if ('IntersectionObserver' in window && hideTargets.length) {
      var visibleCount = 0;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) visibleCount++;
          else visibleCount = Math.max(0, visibleCount - 1);
        });
        if (visibleCount > 0) mobileCta.classList.add('is-hidden');
        else                  mobileCta.classList.remove('is-hidden');
      }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });

      hideTargets.forEach(function (el) { io.observe(el); });
    }
  }

  // ============================================================
  // AUTO YEAR (footer)
  // ============================================================
  var yearEl = qs('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

})();
