$(document).ready(function() {

});



$(function() {

	/*Плавный скрол до id*/
	// $("a[href*='#']").mPageScroll2id({ scrollSpeed: 1500 });


	$("#my-menu").mmenu({
		pageScroll: true,
		extensions: [ 'theme-black', 'fx-menu-slide', 'pagedim-black' ],
		navbar: {
			title: '<img src="img/logo.svg" alt="Магазин Строительных Материалов СтройРемонт24">'
		},
		offCanvas: {
			position: 'right'
		},
	});


	var api = $("#my-menu").data( "mmenu" );
	api.bind("open:finish", function() {
		$(".hamburger").addClass( "is-active" );
	}).bind("close:finish", function() {
		$(".hamburger").removeClass( "is-active" );
	});

	// $('.popup-with-form').magnificPopup({
	// 	type: 'inline',
	// 	preloader: false,
	// 	focus: '#name',
	//
	// 	// When elemened is focused, some mobile browsers in some cases zoom in
	// 	// It looks not nice, so we disable it:
	// 	callbacks: {
	// 		beforeOpen: function() {
	// 			if($(window).width() < 700) {
	// 				this.st.focus = false;
	// 			} else {
	// 				this.st.focus = '#name';
	// 			}
	// 		}
	// 	}
	// });

	$('.carousel-services').on('initialized.owl.carousel', function() {
		setTimeout(function() {
			carouselService();
		}, 50);
	});

	$('.carousel-services').owlCarousel({
		loop:true,
		nav:true,
		smartSpeed: 700,
		navText: ['<i class="fa fa-angle-double-left"></i>', '<i class="fa fa-angle-double-right"></i>'],
		responsiveClass: true,
		dots: false,
		responsive: {
			0: {
				items: 1
			},
			800: {
				items: 2
			},
			1100: {
				items: 3
			}
		}
	}).on('changed.owl.carousel', function() {
		carouselService();
	});

	function carouselService() {
		$('.carousel-services-item').each(function() {
			var ths = $(this);
			var thsh = ths.find('.carousel-services-content').outerHeight();
			ths.find('.carousel-services-image').css('min-height', thsh);
		});
	}carouselService();

/*	$('.carousel-services-composition h3').each(function() {
		var ths = $(this);
		ths.html(ths.html().replace(/(\S+)\s*$/, '<span>$1</span>'));
	});	*/

	$('select').selectize();

	/*Слайдер в секции партнеры*/
	$('.partners').owlCarousel({
		loop:true,
		smartSpeed: 700,
		dots:false,
		nav:true,
		navText: ['<i class="fa fa-angle-left"></i>', '<i class="fa fa-angle-right"></i>'],
		responsiveClass: true,
		responsive: {
			0: {
				items: 1
			},
			768: {
				items: 2
			},
			992: {
				items: 3
			},
			1200: {
				items: 4
			}
		}

	});

	//Кнопка наверх
	$(window).scroll(function() {
		if ($(this).scrollTop() > $(this).height()) {
			$('.top').addClass('active');
		}	else {
			$('.top').removeClass('active');
		}
	});
	$('.top').click(function() {
		$('html, body').stop().animate({scrollTop: 0}, 'slow', 'swing');
	});

	//E-mail Ajax Send
	$("form.callback").submit(function() { //Change
		var th = $(this);
		$.ajax({
			type: "POST",
			url: "/mail.php", //Change
			data: th.serialize()
		}).done(function() {
			$(th).find('.success').addClass('active').css("display", "flex").hide().fadeIn();
			setTimeout(function() {
				$(th).find('.success').removeClass('active').fadeOut();
				th.trigger("reset");
			}, 1000);
		});
		return false;
	});




	//Resize Window
	function onResize() {
		$('.carousel-services-content').equalHeights();
	} onResize();
	window.onresize = function() { onResize();};

	//Text collapsing
	$('.text-collapser').click(function(){
		$(this).parent().children('div.collapser-content').toggle('slow');
		return false;
	});

	//Preloader
	$(window).on('load', function() {
		$('.preloader').delay(1000).fadeOut('slow');
	});

});
