import Swiper from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/autoplay';

const initAboutSwiper = () => {
    new Swiper('.swiper-about', {
        loop: true,
        modules: [Autoplay, Navigation],
        slidesPerView: 1,
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
};

export default initAboutSwiper;
