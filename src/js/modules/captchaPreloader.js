/* global hcaptcha */

const initCaptchaPreloader = () => {
    window.onHCaptchaLoad = () => {
        const container = document.querySelector('.h-captcha');

        if (container) {
            hcaptcha.render(container, {
                sitekey: container.getAttribute('data-sitekey'),
                callback: token => {
                    console.log('hCaptcha passed. Token:', token);
                },
            });

            const placeholder = document.querySelector('.hcaptcha-placeholder');
            if (placeholder) placeholder.remove();

            container.style.display = 'block';
        }
    };
};

export default initCaptchaPreloader;
