(() => {
  const $ = s => document.querySelector(s);
  $('#yr').textContent = new Date().getFullYear();

  // header border once scrolled
  const hdr = $('header');
  const onScroll = () => hdr.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // theme: same stored choice as the homepage
  const root = document.documentElement, tBtn = $('#theme');
  const paint = () => {
    const dark = root.dataset.theme === 'dark';
    tBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    $('meta[name=theme-color]').content = dark ? '#13150e' : '#f6f3ec';
  };
  tBtn.addEventListener('click', () => {
    if (root.dataset.theme === 'dark') delete root.dataset.theme; else root.dataset.theme = 'dark';
    try { localStorage.setItem('ct-theme', root.dataset.theme || 'light'); } catch (e) {}
    paint();
  });
  paint();

  // mobile menu
  const burger = $('#burger'), panel = $('#mpanel');
  const setMenu = open => {
    panel.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    burger.querySelector('.b1').setAttribute('d', open ? 'M6 6l12 12' : 'M4 8h16');
    burger.querySelector('.b2').setAttribute('d', open ? 'M6 18L18 6' : 'M4 16h16');
  };
  burger.addEventListener('click', () => setMenu(!panel.classList.contains('open')));
  panel.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  // contact links and social, as on the homepage
  const CONTACT = { whatsapp: "919425903134", email: "hello@cracktech.app" };
  const waLink = text => `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
  const mailLink = subject => `mailto:${CONTACT.email}?subject=${encodeURIComponent(subject)}`;
  const waFooter = $('[data-contact="whatsapp"]'), mailFooter = $('[data-contact="email"]');
  waFooter.hidden = false; waFooter.querySelector('a').href = waLink("Hi Crack Tech, I have a question about coaching.");
  const fab = $('#wa-fab'); fab.href = waLink("Hi Crack Tech, I'd like to know more about interview coaching."); fab.hidden = false;
  mailFooter.hidden = false; const m = mailFooter.querySelector('a'); m.href = mailLink('Crack Tech enquiry'); m.textContent = CONTACT.email;
  const mf = $('#mail-fab'); mf.href = mailLink('Crack Tech enquiry'); mf.hidden = false;
  const medium = $('[data-social="medium"]');
  medium.href = 'https://medium.com/@cracktech.app'; medium.hidden = false; $('#social').hidden = false;

  // category filter on the blog list
  const filters = [...document.querySelectorAll('.filter')];
  const cards = [...document.querySelectorAll('.post-card')];
  filters.forEach(f => f.addEventListener('click', () => {
    filters.forEach(x => x.setAttribute('aria-pressed', x === f));
    cards.forEach(c => { c.hidden = f.dataset.filter !== 'all' && c.dataset.category !== f.dataset.filter; });
  }));
})();
