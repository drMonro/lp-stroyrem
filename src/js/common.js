// 	const api = $("#my-menu").data("mmenu");
// 	api.bind("open:finish", function() {
// 		$(".hamburger").addClass( "is-active" );
// 	}).bind("close:finish", function() {
// 		$(".hamburger").removeClass( "is-active" );
// 	});

//
// 	$('select').selectize();
//
//
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
// 	//E-mail Ajax Send
// 	$("form.callback").submit(function() { //Change
// 		const th = $(this);
// 		$.ajax({
// 			type: "POST",
// 			url: "/mail.php", //Change
// 			data: th.serialize()
// 		}).done(function() {
// 			$(th).find('.success').addClass('active').css("display", "flex").hide().fadeIn();
// 			setTimeout(function() {
// 				$(th).find('.success').removeClass('active').fadeOut();
// 				th.trigger("reset");
// 			}, 1000);
// 		});
// 		return false;
// 	});
//
// 	function carouselService() {
// 		$('.carousel-services-item').each(function() {
// 			const ths = $(this);
// 			const thing = ths.find('.carousel-services-content').outerHeight();
// 			ths.find('.carousel-services-image').css('min-height', thing);
// 		});
// 	}
// 	carouselService();
//
// 	//Resize Window
// 	function onResize() {
// 		$('.carousel-services-content').equalHeights();
// 	} onResize();
// 	window.onresize = function() { onResize();};
//
// 	//Text collapsing
// 	$('.text-collapser').click(function(){
// 		$(this).parent().children('div.collapser-content').toggle('slow');
// 		return false;
// 	});
//

document.addEventListener('DOMContentLoaded', () => {
  // Preloader
  window.addEventListener('load', () => {
    const preloader = document.querySelector('.preloader');
    if (preloader) {
      setTimeout(() => {
        preloader.style.opacity = '0';
        setTimeout(() => (preloader.style.display = 'none'), 600);
      }, 1000);
    }
  });

  // mmenu init
  const menuElement = document.querySelector('#mm-menu');

  if (menuElement) {
    const menu = new MmenuLight(menuElement, 'all');
    menu.navigation({
      theme: 'dark',
      title: 'МЕНЮ:',
    });

    const drawer = menu.offcanvas({
      position: 'right',
    });

    //	Open the menu.
    document.querySelector('.hamburger').addEventListener('click', (event) => {
      event.preventDefault();
      drawer.open();
    });
  } else {
    console.warn('Меню не найдено в DOM.');
  }

  const modal = document.getElementById('modal');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const nameInput = document.getElementById('name');

  openBtn.addEventListener('click', () => {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // блокировка прокрутки
    setTimeout(() => nameInput.focus(), 100); // фокус на поле
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });

  //E-mail Ajax Send
  const forms = document.querySelectorAll('form.submit');

  forms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      /** @type {FormData} */
      const formData = new FormData(form);
      try {
        const response = await fetch('./mail.php', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const successMsg = form.querySelector('.success');
          if (successMsg) {
            successMsg.classList.add('active');
            successMsg.style.display = 'flex';
            successMsg.style.opacity = 0;
            setTimeout(() => {
              successMsg.style.opacity = 1;
            }, 50);

            setTimeout(() => {
              successMsg.classList.remove('active');
              successMsg.style.display = 'none';
              form.reset();
            }, 2000);
          }
        } else {
          console.error('Ошибка отправки формы');
        }
      } catch (error) {
        console.error('Ошибка:', error);
      }
    });
  });

  // Плавный скролл до id (раскомментировать при необходимости)
  // document.querySelectorAll("a[href*='#']").forEach(anchor => {
  //     anchor.addEventListener('click', (event) => {
  //         event.preventDefault();
  //         const targetId = anchor.getAttribute('href').substring(1);
  //         const targetElement = document.getElementById(targetId);
  //         if (targetElement) {
  //             window.scrollTo({ top: targetElement.offsetTop, behavior: 'smooth' });
  //         }
  //     });
  // });

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

  const carouselService = () => {
    document.querySelectorAll('.carousel-services-item').forEach((item) => {
      const content = item.querySelector('.carousel-services-content');
      const image = item.querySelector('.carousel-services-image');

      if (content && image) {
        const contentHeight = content.offsetHeight;
        image.style.minHeight = `${contentHeight}px`;
      }
    });
  };

  carouselService();

  const equalHeights = (selector) => {
    const elements = document.querySelectorAll(selector);
    let maxHeight = 0;

    // Сбросим текущие высоты
    elements.forEach((el) => {
      el.style.height = 'auto';
    });

    // Найдём максимальную высоту
    elements.forEach((el) => {
      if (el.offsetHeight > maxHeight) {
        maxHeight = el.offsetHeight;
      }
    });

    // Применим максимальную высоту ко всем
    elements.forEach((el) => {
      el.style.height = `${maxHeight}px`;
    });
  };

  const onResize = () => {
    equalHeights('.carousel-services-content');
  };

  onResize();
  window.addEventListener('resize', onResize);
});
