let hcaptchaLoaded = false;
let hcaptchaLoadingPromise = null;

const loadHCaptcha = () => {
    if (hcaptchaLoaded) return Promise.resolve();
    if (hcaptchaLoadingPromise) return hcaptchaLoadingPromise;

    hcaptchaLoadingPromise = new Promise((resolve, reject) => {
        // Глобальная функция, которую вызовет hCaptcha по onload
        window.__onHCaptchaLoad = () => {
            hcaptchaLoaded = true;
            resolve();
        };

        const script = document.createElement('script');
        script.src = 'https://js.hcaptcha.com/1/api.js?render=explicit&onload=__onHCaptchaLoad';
        script.async = true;
        script.defer = true;
        script.onerror = reject;
        document.head.appendChild(script);
    });

    return hcaptchaLoadingPromise;
};

export default loadHCaptcha;
