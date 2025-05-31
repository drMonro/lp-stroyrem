import Choices from 'choices.js';
import IMask from 'imask';

const formValidation = () => {
    const selectElement = document.querySelector('.submit__select');
    new Choices(selectElement, {
        searchEnabled: false,
        itemSelectText: '',
    });

    // При отправке — кастомная валидация
    document.querySelectorAll('form.submit').forEach((form) => {
        const phoneInput = form.querySelector('#phone');
        const errorDiv = form.querySelector('#phone-error');

        const mask = IMask(phoneInput, {
            mask: [{ mask: '+{7} (000) 000-00-00' }],
            lazy: false,
        });

        // Удаляем ошибку при вводе
        phoneInput.addEventListener('input', () => {
            errorDiv.textContent = '';
            phoneInput.classList.remove('invalid');
        });

        // ⚠️ Отключаем нативные тултипы браузера
        form.addEventListener(
            'invalid',
            (e) => {
                e.preventDefault();
                const field = e.target;
                if (field) {
                    errorDiv.textContent = 'Поле обязательно для заполнения';
                    phoneInput.classList.add('invalid');
                }
            },
            true
        );

        // Кастомная валидация телефона
        const isPhoneValid = () => {
            const raw = mask.unmaskedValue;
            // if (!isValid) {
            //     showError('Введите номер полностью');
            // }

            return raw.length === 11;
        };

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const phoneOk = isPhoneValid();
            const hCaptchaToken = form.querySelector('[name="h-captcha-response"]')?.value;

            if (!phoneOk || !hCaptchaToken) {
                if (!hCaptchaToken) {
                    alert('Пожалуйста, подтвердите, что вы не робот.');
                }
                return;
            }

            /** @type {FormData} */
            const formData = new FormData(form);
            formData.append('h-captcha-response', hCaptchaToken);

            fetch('/mail.php', {
                method: 'POST',
                body: formData,
            })
                .then((response) => {
                    if (!response.ok) {
                        throw new Error('Ошибка отправки формы: сервер вернул ошибку');
                    }

                    const successMsg = form.querySelector('.success');
                    if (successMsg) {
                        successMsg.classList.add('active');

                        setTimeout(() => {
                            successMsg.classList.remove('active');
                            form.reset();
                        }, 2000);
                    }

                    form.reset();
                    mask.value = '';
                    phoneInput.classList.remove('invalid');
                    errorDiv.textContent = '';
                    form.querySelectorAll('.error-message').forEach(
                        (el) => (el.textContent = '')
                    );
                    form.querySelectorAll('.invalid').forEach((el) =>
                        el.classList.remove('invalid')
                    );
                })
                .catch((err) => {
                    alert(err.message || 'Произошла ошибка при отправке формы');
                });
        });
    });
};
export default formValidation;
