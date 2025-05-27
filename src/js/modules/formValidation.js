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
            const isValid = raw.length === 11;

            // if (!isValid) {
            //     showError('Введите номер полностью');
            // }

            return isValid;
        };

        form.addEventListener('submit', async(e) => {
            e.preventDefault();

            const phoneOk = isPhoneValid();
            const hCaptchaToken = form.querySelector(
                '[name="h-captcha-response"]'
            )?.value;

            if (!phoneOk || !hCaptchaToken) {
                if (!hCaptchaToken) {
                    alert('Пожалуйста, подтвердите, что вы не робот.');
                }
                return;
            }

            /** @type {FormData} */
            const formData = new FormData(form);
            formData.append('h-captcha-response', hCaptchaToken);
            try {
                const response = await fetch('/mail.php', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    console.error(
                        'Ошибка отправки формы: сервер вернул ошибку'
                    );
                    return;
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
            } catch (err) {
                console.error('Ошибка при отправке формы:', err);
            }
        });
    });
};
export default formValidation;
