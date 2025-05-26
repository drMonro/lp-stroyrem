const initModal = () => {
  const modal = document.getElementById('modal');
  const openBtn = document.getElementById('openModalBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const nameInput = document.getElementById('name');

  if (!modal || !openBtn || !closeBtn || !nameInput) return;

  const closeModal = () => {
    modal.classList.remove('show');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', () => {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    setTimeout(() => nameInput.focus(), 100);
  });

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });
};

export default initModal;
