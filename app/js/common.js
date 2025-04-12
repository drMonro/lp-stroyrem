// $(document).ready(function() {
//
// });
//
//

// $(function() {
// 	//Preloader
// 	$(window).on('load', function() {
// 		$('.preloader').delay(1000).fadeOut('slow');
// 	});
// 	/*Плавный скрол до id*/
// 	// $("a[href*='#']").mPageScroll2id({ scrollSpeed: 1500 });
//
//
//
//
// 	const api = $("#my-menu").data("mmenu");
// 	api.bind("open:finish", function() {
// 		$(".hamburger").addClass( "is-active" );
// 	}).bind("close:finish", function() {
// 		$(".hamburger").removeClass( "is-active" );
// 	});



//
// 	$('.popup-with-form').magnificPopup({
// 		type: 'inline',
// 		preloader: false,
// 		focus: '#name',
//
// 		// When elemened is focused, some mobile browsers in some cases zoom in
// 		// It looks not nice, so we disable it:
// 		callbacks: {
// 			beforeOpen: function() {
// 				if($(window).width() < 700) {
// 					this.st.focus = false;
// 				} else {
// 					this.st.focus = '#name';
// 				}
// 			}
// 		}
// 	});
//
// 	$('.carousel-services').on('initialized.owl.carousel', function() {
// 		setTimeout(function() {
// 			carouselService();
// 		}, 50);
// 	});
//
// 	$('.carousel-services').owlCarousel({
// 		loop:true,
// 		nav:true,
// 		smartSpeed: 700,
// 		navText: ['<i class="fa fa-angle-double-left"></i>', '<i class="fa fa-angle-double-right"></i>'],
// 		responsiveClass: true,
// 		dots: false,
// 		responsive: {
// 			0: {
// 				items: 1
// 			},
// 			800: {
// 				items: 2
// 			},
// 			1100: {
// 				items: 3
// 			}
// 		}
// 	}).on('changed.owl.carousel', function() {
// 		carouselService();
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
// /*	$('.carousel-services-composition h3').each(function() {
// 		var ths = $(this);
// 		ths.html(ths.html().replace(/(\S+)\s*$/, '<span>$1</span>'));
// 	});	*/
//
// 	$('select').selectize();
//
// 	/*Слайдер в секции партнеры*/
// 	$('.partners').owlCarousel({
// 		loop:true,
// 		smartSpeed: 700,
// 		dots:false,
// 		nav:true,
// 		navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
// 		responsiveClass: true,
// 		responsive: {
// 			0: {
// 				items: 1
// 			},
// 			768: {
// 				items: 2
// 			},
// 			992: {
// 				items: 3
// 			},
// 			1200: {
// 				items: 4
// 			}
// 		}
//
// 	});
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
//
//
// })
// import MmenuLight from 'mmenu-light/dist/mmenu-light.js';


document.addEventListener('DOMContentLoaded', () => {
	// Preloader
	window.addEventListener('load', () => {
		const preloader = document.querySelector('.preloader');
		if (preloader) {
			setTimeout(() => {
				preloader.style.opacity = '0';
				setTimeout(() => preloader.style.display = 'none', 600);
			}, 1000);
		}
	});

	// mmenu init
	const menuElement = document.querySelector('#my-menu');

	if (menuElement) {
		const menu = new MmenuLight(menuElement, "all");

		const navigator = menu.navigation({
			theme: 'dark',
			title: ''
		});

		const titleElement = menuElement.querySelector('#my-menu');
		if (menuElement) {
			const img = document.createElement('img');
			img.style.display = 'block';
			img.style.height = '40px';
			img.style.margin = '5px auto';
			img.src = '/img/logo.svg';
			img.alt = 'Магазин Строительных Материалов СтройРемонт24';
			menuElement.appendChild(img);
		}

		const drawer = menu.offcanvas({
			position: 'right'
		});

		//	Open the menu.
		document
			.querySelector('.hamburger')
			.addEventListener("click", (event) => {
				event.preventDefault();
				drawer.open();
			});

		// navigator.openPanel(
		// 	document.querySelector( "#ul" )
		// );

	} else {
		console.warn('Меню не найдено в DOM.');
	}



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

	const swiper = new Swiper('.swiper-container', {
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
		document.querySelectorAll('.carousel-services-item').forEach(item => {
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
		elements.forEach(el => {
			el.style.height = 'auto';
		});

		// Найдём максимальную высоту
		elements.forEach(el => {
			if (el.offsetHeight > maxHeight) {
				maxHeight = el.offsetHeight;
			}
		});

		// Применим максимальную высоту ко всем
		elements.forEach(el => {
			el.style.height = `${maxHeight}px`;
		});
	};

	const onResize = () => {
		equalHeights('.carousel-services-content');
	};

	onResize();
	window.addEventListener('resize', onResize);


});
