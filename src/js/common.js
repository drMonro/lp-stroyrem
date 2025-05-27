import initPreloader from './modules/initPreloader';
import initMmenu from './modules/initMmenu';
import initModal from './modules/initModal';
import initSwiper from './modules/initSwiper';
import initFormValidation from './modules/formValidation';
import adjustSwiperImageHeights from './modules/adjustSwiperImageHeights.js';

document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initMmenu();
    initModal();
    initSwiper();
    initFormValidation();
    adjustSwiperImageHeights();
});


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
