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

const adjustSwiperImageHeights = () => {
  adjustCarouselImageHeights();
  equalHeights('.carousel-services-content');

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      adjustCarouselImageHeights();
      equalHeights('.carousel-services-content');
    }, 200);
  });
};

export default adjustSwiperImageHeights;
