import Choices from 'choices.js';
import IMask from 'imask';
import loadHCaptcha from './loadHCaptcha';

const formValidation = () => {
    const selectElement = document.querySelector('.submit__select');
    new Choices(selectElement, {
        searchEnabled: false,
        itemSelectText: '',
    });

    document.querySelectorAll('form.submit').forEach((form) => {
        const phoneInput = form.querySelector('#phone');
        const errorDiv = form.querySelector('#phone-error');
        const errorCaptchaDiv = form.querySelector('#captcha-error');
        const hcaptchaDiv = form.querySelector('.h-captcha');
        const placeholder = form.querySelector('.hcaptcha-placeholder');

        const mask = IMask(phoneInput, {
            mask: [{ mask: '+{7} (000) 000-00-00' }],
            lazy: false,
        });

        let hcaptchaRendered = false;
        let hcaptchaWidgetId = null;
        let hcaptchaStartedLoading = false;

        // ==== 🔹 ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====

        const isPhoneValid = () => mask.unmaskedValue.length === 11;

        const toggleElement = (el, visible, display = 'block') => {
            if (!el) return;
            el.style.display = visible ? display : 'none';
        };

        const resetErrors = () => {
            errorDiv.textContent = '';
            phoneInput.classList.remove('invalid');
            form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
            form.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
        };

        const renderHCaptcha = () => {
            if (hcaptchaRendered || !window.hcaptcha || !hcaptchaDiv) return;

            hcaptchaWidgetId = window.hcaptcha.render(hcaptchaDiv, {
                sitekey: hcaptchaDiv.dataset.sitekey,
                size: 'compact',
                callback: () => errorCaptchaDiv.textContent = '',
            });

            hcaptchaRendered = true;
            toggleElement(placeholder, false);
            toggleElement(hcaptchaDiv, true);
        };

        const tryLoadHCaptcha = () => {
            if (hcaptchaStartedLoading) return;

            hcaptchaStartedLoading = true;
            toggleElement(placeholder, true, 'flex');
            toggleElement(hcaptchaDiv, false);

            loadHCaptcha()
                .then(renderHCaptcha)
                .catch((err) => {
                    throw new Error(`Не удалось загрузить hCaptcha: ${err}`);
                });
        };

        const attachCaptchaTriggers = () => {
            form.querySelectorAll('input, textarea, select').forEach((field) => {
                field.addEventListener('input', tryLoadHCaptcha, { once: true });
                field.addEventListener('change', tryLoadHCaptcha, { once: true });
            });
        };

        const resetHCaptcha = () => {
            if (hcaptchaRendered && window.hcaptcha) {
                window.hcaptcha.reset(hcaptchaWidgetId);
                hcaptchaRendered = false;
                hcaptchaWidgetId = null;
            }

            hcaptchaStartedLoading = false;
            toggleElement(placeholder, false);
            toggleElement(hcaptchaDiv, false);

            // 🔄 Повторная инициализация событий после сброса
            attachCaptchaTriggers();
        };

        // ==== 🔹 ИНИЦИАЛИЗАЦИЯ ====

        toggleElement(placeholder, false);
        toggleElement(hcaptchaDiv, false);
        attachCaptchaTriggers();

        phoneInput.addEventListener('input', () => {
            resetErrors();
            if (!isPhoneValid()) resetHCaptcha();
        });

        form.addEventListener('invalid', (e) => {
            e.preventDefault();
            if (e.target === phoneInput) {
                errorDiv.textContent = 'Поле обязательно для заполнения';
                phoneInput.classList.add('invalid');
            }
        }, true);

        // ==== 🔹 ОТПРАВКА ====

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const phoneOk = isPhoneValid();
            const hCaptchaToken = form.querySelector('[name="h-captcha-response"]')?.value;

            if (!phoneOk || !hCaptchaToken) {
                if (!hCaptchaToken) {
                    errorCaptchaDiv.textContent = 'Нужно решить капчу перед отправкой';
                }
                return;
            }
            /** @type {FormData} */

            const formData = new FormData(form);
            formData.append('h-captcha-response', hCaptchaToken);
            const formStatusMsg = form.querySelector('.form__status');
            const statusSpan = formStatusMsg?.querySelector('span');
            if (statusSpan && !formStatusMsg.querySelector('.pulse')) {
                const pulseDiv = document.createElement('div');
                pulseDiv.className = 'pulse';
                statusSpan.insertAdjacentElement('afterend', pulseDiv);
            }
            statusSpan.textContent = 'Отправка формы';
            formStatusMsg.classList.add('active');

            fetch('/mail.php', {
                method: 'POST',
                body: formData,
            })
                .then((response) => {
                    if (!response.ok) throw new Error('Ошибка отправки формы: сервер вернул ошибку');
                    const pulse = formStatusMsg.querySelector('.pulse');
                    pulse.remove();
                    statusSpan.textContent = 'Спасибо за заявку!';
                    setTimeout(() => formStatusMsg.classList.remove('active'), 2000);

                    form.reset();
                    mask.value = '';
                    resetErrors();
                    resetHCaptcha();
                })
                .catch((err) => {
                    alert(err.message || 'Произошла ошибка при отправке формы');
                });
        });
    });
};

export default formValidation;
