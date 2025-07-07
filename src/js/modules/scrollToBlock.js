const scrollToBlock = (drawer) => {
    const menu = document.querySelector('#mm-menu');
    if (!menu || !drawer) return;

    const links = menu.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const id = link.getAttribute('href').slice(1);
            const target = document.getElementById(id);

            if (target) {
                e.preventDefault();
                drawer.close();
                setTimeout(() => {
                    const top = target.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({ top, behavior: 'smooth' });
                    history.pushState(null, '', '#' + id);
                }, 300);
            }
        });
    });
};

export default scrollToBlock;
