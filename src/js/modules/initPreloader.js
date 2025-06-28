const waitForHCaptcha = () => {
    const observer = new MutationObserver(() => {
        const iframe = document.querySelector('.h-captcha iframe');
        if (iframe) {
            const placeholder = document.querySelector('.hcaptcha-placeholder');
            const captcha = document.querySelector('.h-captcha');

            if (placeholder) placeholder.remove();
            if (captcha) captcha.style.display = 'block';

            observer.disconnect(); // больше не нужно отслеживать
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
};

// Вызываем когда показывается форма или попап
waitForHCaptcha();
