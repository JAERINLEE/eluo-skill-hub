/**
 * clipboard.js — Copy-to-Clipboard + Toast
 */

(function () {
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('is-visible');
    }, 2000);
  }

  function copyToClipboard(text, btn) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        onCopySuccess(btn);
      }).catch(function () {
        fallbackCopy(text, btn);
      });
    } else {
      fallbackCopy(text, btn);
    }
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      onCopySuccess(btn);
    } catch (e) {
      showToast('복사 실패');
    }
    document.body.removeChild(ta);
  }

  function onCopySuccess(btn) {
    showToast('클립보드에 복사되었습니다');
    if (btn) {
      btn.classList.add('is-copied');
      var originalHTML = btn.innerHTML;
      btn.innerHTML = '<svg class="btn-copy__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> 복사됨';
      setTimeout(function () {
        btn.classList.remove('is-copied');
        btn.innerHTML = originalHTML;
      }, 2000);
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.btn-copy');
    if (!btn) return;
    var targetId = btn.getAttribute('data-copy-target');
    var el = targetId ? document.getElementById(targetId) : btn.closest('.code-block').querySelector('pre');
    if (el) {
      copyToClipboard(el.textContent, btn);
    }
  });
})();
