// 	//Кнопка наверх
// 	$(window).scroll(function() {
// 		if ($(this).scrollTop() > $(this).height()) {
// 			$('.top').addClass('active');
// 		}	else {
// 			$('.top').removeClass('active');
// 		}
// 	});
// 	$('.top').click(function() {
// 		$('html, body').stop().animate({scrollTop: 0}, 'slow', 'swing');
// 	});
//
//
// 	//Text collapsing
// 	$('.text-collapser').click(function(){
// 		$(this).parent().children('div.collapser-content').toggle('slow');
// 		return false;
// 	});
//

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initMmenu();
  initModal();
  // initForms();
  initSwiper();
  adjustCarouselImageHeights();
  equalHeights('.carousel-services-content');

  window.addEventListener('resize', () => {
    adjustCarouselImageHeights();
    equalHeights('.carousel-services-content');
  });

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
      mask: [{ mask: '+{7} (000) 000-00-00' }, { mask: '8 (000) 000-00-00' }],
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
      true,
    );

    // Кастомная валидация телефона
    const isPhoneValid = () => {
      const raw = mask.unmaskedValue;
      if (raw.length !== 11) {
        errorDiv.textContent = 'Введите номер полностью';
        phoneInput.classList.add('invalid');
        return false;
      }

      return true;
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const phoneOk = isPhoneValid();
      const hCaptchaToken = form.querySelector(
        '[name="h-captcha-response"]',
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
        const response = await fetch('./mail.php', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          console.error('Ошибка отправки формы: сервер вернул ошибку');
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
        form
          .querySelectorAll('.error-message')
          .forEach((el) => (el.textContent = ''));
        form
          .querySelectorAll('.invalid')
          .forEach((el) => el.classList.remove('invalid'));
      } catch (err) {
        console.error('Ошибка при отправке формы:', err);
      }
    });
  });
});

// === Preloader ===
const initPreloader = () => {
  window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    if (!preloader) return;

    setTimeout(() => {
      preloader.style.opacity = '0';
      setTimeout(() => {
        preloader.style.display = 'none';
      }, 600);
    }, 1000);
  });
};

// === Mmenu init ===
const initMmenu = () => {
  const menuElement = document.querySelector('#mm-menu');
  if (!menuElement) {
    console.warn('Меню не найдено в DOM.');
    return;
  }

  const menu = new MmenuLight(menuElement, 'all');
  menu.navigation({ theme: 'dark', title: 'МЕНЮ:' });
  const drawer = menu.offcanvas({ position: 'right' });

  document.querySelector('.hamburger')?.addEventListener('click', (e) => {
    e.preventDefault();
    drawer.open();
  });
};

// === Modal ===
const initModal = () => {
  const modal = document.getElementById('modal');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const nameInput = document.getElementById('name');

  if (!modal || !openBtn || !closeBtn || !nameInput) return;

  const closeModal = () => {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', () => {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    setTimeout(() => nameInput.focus(), 100);
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });
};

// // === Form submission ===
// const initForms = () => {
//   document.querySelectorAll('form.submit').forEach((form) => {
//     form.addEventListener('submit', async (e) => {
//       e.preventDefault();
//       // Если форма невалидна — не отправлять
//       console.log('form.checkValidity()', form.checkValidity());
//       if (!form.checkValidity()) {
//         // Принудительно вызвать событие invalid (чтобы подсказки сработали)
//         // form.reportValidity(); // Покажет нативные браузерные ошибки, если они остались
//         return;
//       }
//
//       const formData = new FormData(form);
//
//       try {
//         const response = await fetch('./mail.php', {
//           method: 'POST',
//           body: formData,
//         });
//
//         if (!response.ok) {
//           console.error('Ошибка отправки формы: сервер вернул ошибку');
//           return;
//         }
//
//         const successMsg = form.querySelector('.success');
//         if (successMsg) showSuccessMessage(successMsg, form);
//       } catch (err) {
//         console.error('Ошибка при отправке формы:', err);
//       }
//     });
//   });
// };

// const showSuccessMessage = (msgEl, form) => {
//   msgEl.classList.add('active');
//   msgEl.style.display = 'flex';
//   msgEl.style.opacity = 0;
//
//   requestAnimationFrame(() => {
//     msgEl.style.opacity = 1;
//   });
//
//   setTimeout(() => {
//     msgEl.classList.remove('active');
//     msgEl.style.display = 'none';
//     form.reset();
//   }, 2000);
// };

// === Swiper init ===
const initSwiper = () => {
  new Swiper('.swiper-container', {
    direction: 'horizontal',
    loop: true,
    autoplay: {
      delay: 2500,
      disableOnInteraction: false,
    },
    slidesPerView: 3,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
  });
};

// === Carousel content height matching ===
const adjustCarouselImageHeights = () => {
  document.querySelectorAll('.carousel-services-item').forEach((item) => {
    const content = item.querySelector('.carousel-services-content');
    const image = item.querySelector('.carousel-services-image');
    if (content && image) {
      image.style.minHeight = `${content.offsetHeight}px`;
    }
  });
};

// === Equal Heights Utility ===
const equalHeights = (selector) => {
  const elements = document.querySelectorAll(selector);
  let maxHeight = 0;

  elements.forEach((el) => {
    el.style.height = 'auto';
    maxHeight = Math.max(maxHeight, el.offsetHeight);
  });

  elements.forEach((el) => {
    el.style.height = `${maxHeight}px`;
  });
};

/*
// Плавный скролл до id (раскомментировать при необходимости)
document.querySelectorAll("a[href*='#']").forEach(anchor => {
    anchor.addEventListener('click', (event) => {
        event.preventDefault();
        const targetId = anchor.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            window.scrollTo({ top: targetElement.offsetTop, behavior: 'smooth' });
        }
    });
});
*/
