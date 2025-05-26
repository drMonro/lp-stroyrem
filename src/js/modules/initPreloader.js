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

export default initPreloader;
