import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const finePointer = () => window.matchMedia('(pointer: fine)').matches;

export function initUI({ lenis, heroPlan }) {
  $$('.year').forEach((el) => (el.textContent = new Date().getFullYear()));

  const menu = mobileMenu(lenis);
  header(menu);
  anchors(lenis, menu);
  legend(heroPlan);
  faq();
  contactForm();

  if (finePointer()) {
    cursor();
    magnetic();
    tilt();
  }
}

function header(menu) {
  const el = $('.header');
  gsap.to('.progress span', {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
  });
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      el.classList.toggle('is-scrolled', y > 20);
      el.classList.toggle('is-hidden', self.direction === 1 && y > 500 && !menu.isOpen());
    },
  });
}

function anchors(lenis, menu) {
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = id === '#' ? null : $(id);
      if (!target) return;
      e.preventDefault();
      menu.close();
      const top = id === '#anasayfa' ? 0 : target;
      if (lenis) lenis.scrollTo(top, { duration: 1.6 });
      else if (top === 0) window.scrollTo(0, 0);
      else target.scrollIntoView();
    });
  });

  $('.to-top')?.addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { duration: 2 });
    else window.scrollTo(0, 0);
  });
}

function mobileMenu(lenis) {
  const html = document.documentElement;
  const btn = $('.menu-toggle');
  const panel = $('#mobile-menu');
  let open = false;

  const set = (state) => {
    if (open === state) return;
    open = state;
    html.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    if (open) {
      panel.hidden = false;
      lenis?.stop();
      gsap.fromTo(panel, { clipPath: 'circle(0% at 92% 4%)' }, { clipPath: 'circle(150% at 92% 4%)', duration: 0.9, ease: 'expo.inOut' });
      gsap.fromTo($$('a', panel), { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'expo.out', stagger: 0.06, delay: 0.25 });
    } else {
      lenis?.start();
      gsap.to(panel, {
        clipPath: 'circle(0% at 92% 4%)',
        duration: 0.6,
        ease: 'expo.inOut',
        onComplete: () => {
          if (!open) panel.hidden = true;
        },
      });
    }
  };

  btn.addEventListener('click', () => set(!open));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && set(false));

  return { isOpen: () => open, close: () => set(false) };
}

function legend(plan) {
  const svg = plan.root.ownerSVGElement;
  const buttons = $$('.legend button');
  let locked = null;

  const focus = (zone) => {
    if (zone) svg.dataset.focus = zone;
    else delete svg.dataset.focus;
    buttons.forEach((b) => b.classList.toggle('is-active', b.dataset.zone === zone));
  };

  buttons.forEach((b) => {
    b.addEventListener('mouseenter', () => focus(b.dataset.zone));
    b.addEventListener('focus', () => focus(b.dataset.zone));
    b.addEventListener('mouseleave', () => focus(locked));
    b.addEventListener('blur', () => focus(locked));
    b.addEventListener('click', () => {
      locked = locked === b.dataset.zone ? null : b.dataset.zone;
      b.setAttribute('aria-pressed', String(locked === b.dataset.zone));
      focus(locked);
    });
  });
}

function faq() {
  const items = $$('.faq__q');
  items.forEach((q) => {
    q.addEventListener('click', () => {
      const open = q.getAttribute('aria-expanded') === 'true';
      items.forEach((other) => other.setAttribute('aria-expanded', 'false'));
      q.setAttribute('aria-expanded', String(!open));
      // Yükseklik değişiminden sonra kaydırma tetikleyicilerini güncelle
      setTimeout(() => ScrollTrigger.refresh(), 650);
    });
  });
}

function contactForm() {
  const form = $('.form');
  const note = $('.form__note', form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    $$('[required]', form).forEach((input) => {
      const ok = input.checkValidity();
      input.closest('.field').classList.toggle('is-invalid', !ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      note.textContent = 'Lütfen işaretli alanları doldurun.';
      return;
    }

    const data = new FormData(form);
    const to = $('.contact__info a[href^="mailto:"]').getAttribute('href').replace('mailto:', '');
    const subject = `Web sitesi: ${data.get('topic')} – ${data.get('name')}`;
    const body = [
      `Ad Soyad: ${data.get('name')}`,
      `E-posta: ${data.get('email')}`,
      `Telefon: ${data.get('phone') || '-'}`,
      `Konu: ${data.get('topic')}`,
      '',
      data.get('message'),
    ].join('\n');

    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    note.textContent = 'E-posta uygulamanız açılıyor. Teşekkürler!';
  });

  form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-invalid'));
}

// CAD artı imleci: imleç sayfa koordinatlarını gösterir,
// tıklanabilir öğelerde "nesne yakalama" köşelerine dönüşür.
function cursor() {
  const el = $('.cursor');
  const tag = $('.cursor-tag');
  const coord = $('.cursor__coord', el);
  document.documentElement.classList.add('has-cad-cursor');

  const x = gsap.quickTo(el, 'x', { duration: 0.08, ease: 'power3' });
  const y = gsap.quickTo(el, 'y', { duration: 0.08, ease: 'power3' });
  const tx = gsap.quickTo(tag, 'x', { duration: 0.4, ease: 'power3' });
  const ty = gsap.quickTo(tag, 'y', { duration: 0.4, ease: 'power3' });

  let cx = 0;
  let cy = 0;
  const pad = (n, len) => String(Math.max(0, Math.round(n))).padStart(len, '0');
  const updateCoord = () => {
    coord.textContent = `X ${pad(cx, 4)} · Y ${pad(cy + window.scrollY, 5)}`;
  };

  window.addEventListener('pointermove', (e) => {
    cx = e.clientX;
    cy = e.clientY;
    el.classList.add('is-visible');
    x(cx);
    y(cy);
    tx(cx);
    ty(cy);
    updateCoord();
  });
  window.addEventListener('scroll', updateCoord, { passive: true });
  document.addEventListener('pointerleave', () => {
    el.classList.remove('is-visible');
    tag.classList.remove('is-visible');
  });
  window.addEventListener('pointerdown', () => el.classList.add('is-down'));
  window.addEventListener('pointerup', () => el.classList.remove('is-down'));

  document.addEventListener('pointerover', (e) => {
    const text = e.target.closest('input:not([type="radio"]), textarea');
    const interactive = e.target.closest('a, button, label');
    const withLabel = e.target.closest('[data-cursor]');
    const showTag = !!withLabel && !interactive && !text;
    el.classList.toggle('is-text', !!text);
    el.classList.toggle('is-hover', !!interactive && !text);
    el.classList.toggle('has-label', showTag);
    tag.classList.toggle('is-visible', showTag);
    if (withLabel) tag.firstElementChild.textContent = withLabel.dataset.cursor;
  });
}

function magnetic() {
  $$('.magnetic').forEach((el) => {
    const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
    const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      x((e.clientX - r.left - r.width / 2) * 0.3);
      y((e.clientY - r.top - r.height / 2) * 0.4);
    });
    el.addEventListener('pointerleave', () => {
      x(0);
      y(0);
    });
  });
}

function tilt() {
  const hero = $('.hero');
  const sheet = $('.sheet');
  const rx = gsap.quickTo(sheet, 'rotationX', { duration: 1, ease: 'power3' });
  const ry = gsap.quickTo(sheet, 'rotationY', { duration: 1, ease: 'power3' });

  hero.addEventListener('pointermove', (e) => {
    const px = e.clientX / window.innerWidth - 0.5;
    const py = e.clientY / window.innerHeight - 0.5;
    ry(px * 10);
    rx(-py * 8);
  });
  hero.addEventListener('pointerleave', () => {
    rx(0);
    ry(0);
  });
}
