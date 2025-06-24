import Swiper from 'swiper';
import adjustSwiperImageHeights from './adjustSwiperImageHeights';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

const initAboutSwiper = () => {
    new Swiper('.swiper-about', {
        // speed: 5000,
        loop: true,
        // lazyPreloadPrevNext: 1,
        modules: [Autoplay, Navigation],
        // autoplay: {
        //     delay: 2500,
        //     disableOnInteraction: true,
        // },
        slidesPerView: 1,
        breakpoints: {
            320: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            },
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        // on: {
        //     init: () => adjustSwiperImageHeights(),
        //     resize: () => adjustSwiperImageHeights(),
        //     autoplayStart: (swiper) => swiper.params.speed = 300,
        //     navigationNext: (swiper) => swiper.params.speed = 300,
        //     navigationPrev: (swiper) => swiper.params.speed = 300,
        //     sliderMove: (swiper) => swiper.params.speed = 300,
        // },
    });
};

export default initAboutSwiper;
