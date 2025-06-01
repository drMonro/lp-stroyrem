import MmenuLight from 'mmenu-light';


const initMmenu = () => {
    const menuElement = document.querySelector('#mm-menu');
    if (!menuElement) {
        throw new Error('Меню не найдено в DOM.');
    }

    const menu = new MmenuLight(menuElement, 'all');
    menu.navigation({ theme: 'dark', title: 'МЕНЮ:' });
    const drawer = menu.offcanvas({ position: 'right' });

    const hamburgerButton = document.querySelector('.header__hamburger-button');
    if (hamburgerButton) {
        hamburgerButton.addEventListener('click', (e) => {
            e.preventDefault();
            drawer.open();
        });
    }
    // Сигнализируем, что меню готово, можно показывать
    document.documentElement.classList.add('js-menu-ready');
};

export default initMmenu;
