/**
 * main.js — GNB, Scroll Animation, Tabs, Smooth Scroll
 */

(function () {
  /* ── Mobile GNB Toggle ── */
  var toggle = document.querySelector('.gnb__toggle');
  var mobileNav = document.querySelector('.mobile-nav');

  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      toggle.classList.toggle('is-open');
      mobileNav.classList.toggle('is-open');
    });

    // 모바일 네비 링크 클릭 시 닫기
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.classList.remove('is-open');
        mobileNav.classList.remove('is-open');
      });
    });
  }

  /* ── Scroll Fade-In (IntersectionObserver) ── */
  var fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length > 0 && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ── Tabs ── */
  document.querySelectorAll('[data-tabs]').forEach(function (tabGroup) {
    var tabs = tabGroup.querySelectorAll('.tabs__item');
    var panels = tabGroup.querySelectorAll('.tab-panel');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-tab');

        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        panels.forEach(function (p) { p.classList.remove('is-active'); });

        tab.classList.add('is-active');
        var panel = tabGroup.querySelector('[data-panel="' + target + '"]');
        if (panel) panel.classList.add('is-active');
      });
    });
  });

  /* ── GNB Active State on Scroll ── */
  var gnbLinks = document.querySelectorAll('.gnb__link[href^="#"]');
  if (gnbLinks.length > 0) {
    var sections = [];
    gnbLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) sections.push({ el: section, link: link });
    });

    if (sections.length > 0) {
      var scrollHandler = function () {
        var scrollPos = window.scrollY + 100;
        var current = null;
        sections.forEach(function (s) {
          if (s.el.offsetTop <= scrollPos) current = s;
        });
        gnbLinks.forEach(function (l) { l.classList.remove('is-active'); });
        if (current) current.link.classList.add('is-active');
      };

      window.addEventListener('scroll', scrollHandler, { passive: true });
      scrollHandler();
    }
  }
})();
