// === Carousel content height matching ===
const adjustCarouselImageHeights = () => {
    document.querySelectorAll('.swiper-slide').forEach((item) => {
        const content = item.querySelector('.swiper-products-info');
        const image = item.querySelector('.swiper-products-image');
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

const adjustSwiperImageHeights = () => {
    adjustCarouselImageHeights();
    equalHeights('.swiper-products-info');

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            adjustCarouselImageHeights();
            equalHeights('.swiper-products-info');
        }, 200);
    });
};

export default adjustSwiperImageHeights;
