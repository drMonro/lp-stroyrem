import Choices from 'choices.js';
import IMask from 'imask';
import loadHCaptcha from './loadHCaptcha';
import 'choices.js/public/assets/styles/choices.css';

const formValidation = () => {
    document.querySelectorAll('form.submit').forEach((form) => {
        const selectElement = form.querySelector('.submit__select');
        if (selectElement) {
            new Choices(selectElement, {
                searchEnabled: false,
                itemSelectText: '',
            });
        }

        const phoneInput = form.querySelector('#phone');
        const errorDiv = form.querySelector('#phone-error');
        const errorCaptchaDiv = form.querySelector('#captcha-error');
        const hcaptchaDiv = form.querySelector('.h-captcha');
        const placeholder = form.querySelector('.hcaptcha-placeholder');
        const submitButton = form.querySelector('[type="submit"]');

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

            if (!hcaptchaDiv.dataset.sitekey) {
                errorCaptchaDiv.textContent = 'Капча не настроена. Попробуйте позже';
                toggleElement(placeholder, false);
                return;
            }

            hcaptchaWidgetId = window.hcaptcha.render(hcaptchaDiv, {
                sitekey: hcaptchaDiv.dataset.sitekey,
                size: 'compact',
                callback: () => errorCaptchaDiv.textContent = '',
                recaptchacompat: 'off',
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

            if (!form.dataset.endpoint) {
                alert('Адрес обработчика формы не настроен');
                return;
            }

            const phoneOk = isPhoneValid();
            const hCaptchaToken = form.querySelector('[name="h-captcha-response"]')?.value;

            if (!phoneOk || !hCaptchaToken) {
                if (!hCaptchaToken) {
                    errorCaptchaDiv.textContent = 'Нужно решить капчу перед отправкой';
                }
                return;
            }

            const formData = new FormData(form);
            const payload = Object.fromEntries(formData.entries());
            payload['h-captcha-response'] = hCaptchaToken;
            const formStatusMsg = form.querySelector('.form__status');
            const statusSpan = formStatusMsg?.querySelector('span');

            if (!formStatusMsg || !statusSpan) return;

            if (statusSpan && !formStatusMsg.querySelector('.pulse')) {
                const pulseDiv = document.createElement('div');
                pulseDiv.className = 'pulse';
                statusSpan.insertAdjacentElement('afterend', pulseDiv);
            }
            statusSpan.textContent = 'Отправка формы';
            formStatusMsg.classList.add('active');
            submitButton?.setAttribute('disabled', 'disabled');

            fetch(form.dataset.endpoint, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })
                .then((response) => {
                    if (!response.ok) throw new Error('Ошибка отправки формы: сервер вернул ошибку');

                    const pulse = formStatusMsg.querySelector('.pulse');
                    pulse?.remove();
                    statusSpan.textContent = 'Спасибо за заявку!';
                    setTimeout(() => formStatusMsg.classList.remove('active'), 2000);

                    form.reset();
                    mask.value = '';
                    resetErrors();
                    resetHCaptcha();
                })
                .catch((err) => {
                    alert(err.message || 'Произошла ошибка при отправке формы');
                })
                .finally(() => {
                    submitButton?.removeAttribute('disabled');
                });
        });
    });
};

export default formValidation;
