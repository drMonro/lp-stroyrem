import MmenuLight from 'mmenu-light';


const initMmenu = () => {
    const menuElement = document.querySelector('#mm-menu');
    if (!menuElement) {
        console.warn('Меню не найдено в DOM.');
        return;
    }

    const menu = new MmenuLight(menuElement, 'all');
    menu.navigation({ theme: 'dark', title: 'МЕНЮ:' });
    const drawer = menu.offcanvas({ position: 'right' });

    document.querySelector('.hamburger')?.addEventListener('click', (e) => {
        e.preventDefault();
        drawer.open();
    });
};

export default initMmenu;
