document.addEventListener('DOMContentLoaded', () => {
  document.body.addEventListener('click', function (e) {
    const target = e.target.closest('button, input[type="submit"]');
    if (!target) return;

    const tag = target.tagName.toUpperCase();
    const isSubmit =
        (tag === 'BUTTON' && target.textContent?.trim().toUpperCase() === 'SUBMIT') ||
        (tag === 'INPUT' && target.value?.trim().toUpperCase() === 'SUBMIT');

    const hasPreventClass = target.classList.contains('prevent-multiple');
    const delay = parseInt(target.dataset.preventDelay || '3000', 10);

    if ((isSubmit || hasPreventClass) && !target.disabled) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          target.disabled = true;
          setTimeout(() => {
            target.disabled = false;
          }, delay);
        }, 0);
      });
    }
  });
});
