/*
const originalAddEventListener = EventTarget.prototype.addEventListener;

EventTarget.prototype.addEventListener = function(type, listener, options) {
  // Only proceed for actual HTML elements
  if (this instanceof HTMLElement) {
    const tag = this.tagName;
    const isButton = tag === 'BUTTON' || (tag === 'INPUT' && this.type === 'submit');
    const hasPreventClass = this.classList?.contains('prevent-multiple');
    const isSubmitLike = this.textContent?.trim().toUpperCase() === 'SUBMIT' ||
                         this.value?.trim().toUpperCase() === 'SUBMIT';

    if (isButton && (hasPreventClass || isSubmitLike)) {
    let isClicked = false;
    const wrappedListener = async function (e) {
      if (isClicked) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      isClicked = true;
      try {
        await listener.call(this, e);
          console.log("Preventing multiple clicks");
      } finally {
        setTimeout(() => (isClicked = false), 3000);
      }
    };

      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
  }

  // For everything else (window, document, etc.)
  return originalAddEventListener.call(this, type, listener, options);
};

*/
