/* =========================================================
   CloudWithKushagra — Core Script
   Handles: mobile nav, scroll reveal, counters, back-to-top,
            skill bars, contact form
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  /* ---------- Active nav link ---------- */
  var current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll('[data-counter]');
  var countersDone = false;
  function runCounters() {
    if (countersDone) return;
    countersDone = true;
    counters.forEach(function (el) {
      var target = el.getAttribute('data-counter');
      var suffix = el.getAttribute('data-suffix') || '';
      var isDecimal = target.indexOf('.') !== -1;
      var end = parseFloat(target);
      var current = 0;
      var duration = 1600;
      var startTime = null;

      function step(ts) {
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        current = eased * end;
        el.textContent = (isDecimal ? current.toFixed(2) : Math.floor(current)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = (isDecimal ? end.toFixed(2) : end) + suffix;
      }
      requestAnimationFrame(step);
    });
  }
  var statsSection = document.querySelector('.stats-grid');
  if (statsSection && 'IntersectionObserver' in window) {
    var statObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounters(); statObs.disconnect(); }
      });
    }, { threshold: 0.3 });
    statObs.observe(statsSection);
  } else if (statsSection) {
    runCounters();
  }

  /* ---------- Skill bars (About page) ---------- */
  var skillBars = document.querySelectorAll('.skill-fill');
  if (skillBars.length && 'IntersectionObserver' in window) {
    var skillObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.width = entry.target.getAttribute('data-level') + '%';
        }
      });
    }, { threshold: 0.4 });
    skillBars.forEach(function (b) { skillObs.observe(b); });
  } else {
    skillBars.forEach(function (b) { b.style.width = b.getAttribute('data-level') + '%'; });
  }

  /* ---------- Back to top ---------- */
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 500) toTop.classList.add('show');
      else toTop.classList.remove('show');
    });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Navbar shrink/solid on scroll ---------- */
  var nav = document.querySelector('.navbar');
  if (nav) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20) nav.style.boxShadow = '0 8px 30px rgba(0,0,0,0.35)';
      else nav.style.boxShadow = 'none';
    });
  }

  /* ---------- Contact form (front-end only demo) ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = document.getElementById('form-msg');
      msg.textContent = 'Thanks — your message has been captured locally. Connect a backend (e.g. SNS + Lambda + SES on AWS) to deliver it to an inbox.';
      msg.classList.add('show', 'success');
      form.reset();
    });
  }

  /* ---------- Floating hero icons: randomize animation delay ---------- */
  document.querySelectorAll('.floater').forEach(function (f, i) {
    f.style.animationDelay = (i * 0.6) + 's';
  });

});
