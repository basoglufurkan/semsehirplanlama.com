import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

const $ = (s) => document.querySelector(s);
const $$ = (s) => gsap.utils.toArray(s);
const formatTR = (n) => Math.round(n).toLocaleString('tr-TR');

export function initScroll({ reduced, zoomPlan }) {
  if (reduced) {
    $$('[data-count]').forEach((el) => (el.textContent = formatTR(el.dataset.count)));
    showStaticZoom(zoomPlan);
    return;
  }

  headings();
  reveals();
  statement();
  counters();
  marquee();
  heroParallax();
  scales(zoomPlan);
  cards();
  projects();
  process();
  contact();
}

function headings() {
  $$('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'split-line',
      autoSplit: true,
      onSplit: (self) =>
        gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.1,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        }),
    });
  });
}

function reveals() {
  gsap.set('[data-reveal]', { y: 46, opacity: 0 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 90%',
    once: true,
    onEnter: (els) =>
      gsap.to(els, { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', stagger: 0.1, overwrite: true }),
  });
}

function statement() {
  const el = $('[data-scrub-text]');
  const split = SplitText.create(el, { type: 'words' });
  gsap.fromTo(
    split.words,
    { opacity: 0.12 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.1,
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true },
    },
  );
}

function counters() {
  $$('[data-count]').forEach((el) => {
    const obj = { v: 0 };
    gsap.to(obj, {
      v: Number(el.dataset.count),
      duration: 2.2,
      ease: 'power3.out',
      onUpdate: () => (el.textContent = formatTR(obj.v)),
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
}

function marquee() {
  const track = $('.marquee__track');
  track.innerHTML += track.innerHTML;
  const loop = gsap.to(track, { xPercent: -50, duration: 30, ease: 'none', repeat: -1 });

  let boost = 0;
  ScrollTrigger.create({
    trigger: '.marquee',
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => (boost = Math.min(Math.abs(self.getVelocity()) / 250, 6)),
  });
  gsap.ticker.add(() => {
    loop.timeScale(1 + boost);
    boost *= 0.93;
  });

  gsap.fromTo(
    '.marquee',
    { rotate: -4 },
    { rotate: 1, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } },
  );
}

function heroParallax() {
  const st = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero__copy', { yPercent: -18, opacity: 0.15, ease: 'none', scrollTrigger: st });
  gsap.to('.hero__visual', { yPercent: 10, scale: 0.92, rotate: -3, ease: 'none', scrollTrigger: { ...st } });
}

// Ölçek kademeleri: plan, Çevre Düzeni'nden Kentsel Tasarım'a doğru yakınlaşır
const STAGE_SCALE = [1, 1.8, 3.2, 5.4];
const STAGE_RATIO = ['1/100.000', '1/5000', '1/1000', '1/500'];

function stageTransforms(plan) {
  const { size, plaza } = plan;
  const c = size / 2;
  // Son kademede meydanın hemen yanındaki yapı adalarına odaklan
  const target = { x: plaza.x + size * 0.07, y: plaza.y + size * 0.09 };
  const clamp = (v, s) => Math.min(0, Math.max(size - s * size, v));
  return STAGE_SCALE.map((s, i) => {
    const k = i / (STAGE_SCALE.length - 1);
    const fx = c + (target.x - c) * k;
    const fy = c + (target.y - c) * k;
    return { scale: s, x: clamp(c - s * fx, s), y: clamp(c - s * fy, s) };
  });
}

function showStaticZoom(plan) {
  const tf = stageTransforms(plan);
  gsap.set(plan.root, { svgOrigin: '0 0', ...tf[2] });
  gsap.set([plan.macro, plan.blocks, plan.buildings], { opacity: 0 });
}

function scales(plan) {
  const tf = stageTransforms(plan);
  const steps = $$('.scale-step');
  const bars = $$('.lens__bar span');
  const ratio = $('.lens__ratio');
  let current = 0;

  const setStage = (i) => {
    if (i === current) return;
    current = i;
    steps.forEach((s, n) => s.classList.toggle('is-active', n === i));
    bars.forEach((b, n) => b.classList.toggle('is-active', n <= i));
    ratio.textContent = STAGE_RATIO[i];
  };

  gsap.set(plan.root, { svgOrigin: '0 0', ...tf[0] });
  gsap.set([plan.blocks, plan.parcels, plan.labels, plan.buildings, plan.trees], { opacity: 0 });

  const tl = gsap.timeline({
    defaults: { duration: 1, ease: 'power2.inOut' },
    scrollTrigger: {
      trigger: '.scales',
      pin: true,
      start: 'top top',
      end: '+=340%',
      scrub: 1,
      onUpdate: (self) => {
        const t = self.progress * tl.duration();
        setStage(t < 0.75 ? 0 : t < 2 ? 1 : t < 3.25 ? 2 : 3);
      },
    },
  });

  tl.to(plan.root, tf[1], 0.25)
    .to(plan.macro, { opacity: 0 }, 0.25)
    .to(plan.blocks, { opacity: 1 }, 0.35)
    .to(plan.root, tf[2], 1.5)
    .to(plan.blocks, { opacity: 0 }, 1.6)
    .to([plan.parcels, plan.labels], { opacity: 1 }, 1.5)
    .to(plan.trees, { opacity: 0.6 }, 1.6)
    .to(plan.root, tf[3], 2.75)
    .to(plan.buildings, { opacity: 1 }, 2.85)
    .to(plan.trees, { opacity: 1 }, 2.85)
    .to(plan.labels, { opacity: 0.55 }, 2.85)
    .to({}, { duration: 0.25 });
}

function cards() {
  const list = $$('.card');
  const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;

  list.forEach((card, i) => {
    card.style.setProperty('--i', i);
    const next = list[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: 0.92,
      ease: 'none',
      scrollTrigger: {
        trigger: next,
        start: 'top bottom',
        end: () => `top ${headerH() + 16 + (i + 1) * 16}px`,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  });

  $$('.card__art').forEach((art) => {
    gsap.from(art.querySelectorAll(':scope > :not(.dash)'), {
      drawSVG: '0%',
      duration: 1.8,
      ease: 'power2.inOut',
      stagger: 0.12,
      scrollTrigger: { trigger: art, start: 'top 80%', once: true },
    });
  });
}

function projects() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 901px)', () => {
    const track = $('.projects__track');
    const items = $$('.project:not(.project--cta)');
    const counter = $('.projects__current');
    const distance = () => track.scrollWidth - window.innerWidth;

    const move = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: '.projects',
        pin: true,
        start: 'top top',
        end: () => `+=${distance()}`,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const n = Math.min(items.length, Math.round(self.progress * items.length) + 1);
          counter.textContent = String(n).padStart(2, '0');
        },
      },
    });

    $$('.project__media svg').forEach((svg) => {
      gsap.fromTo(
        svg,
        { xPercent: -6 },
        {
          xPercent: 6,
          ease: 'none',
          scrollTrigger: { trigger: svg.parentNode, containerAnimation: move, start: 'left right', end: 'right left', scrub: true },
        },
      );
    });
  });
}

function process() {
  gsap.to('.steps__line i', {
    scaleY: 1,
    ease: 'none',
    scrollTrigger: { trigger: '.steps', start: 'top 60%', end: 'bottom 60%', scrub: true },
  });
  $$('.step').forEach((step) => {
    ScrollTrigger.create({ trigger: step, start: 'top 62%', toggleClass: 'is-done' });
    gsap.from(step.querySelectorAll('h3, p'), {
      x: 40,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: step, start: 'top 85%', once: true },
    });
  });
}

function contact() {
  const split = SplitText.create('.contact__title .line', { type: 'words,chars' });
  gsap.from(split.chars, {
    yPercent: 115,
    duration: 1.3,
    ease: 'expo.out',
    stagger: 0.03,
    scrollTrigger: { trigger: '.contact__title', start: 'top 85%', once: true },
  });

  gsap.from('.footer__word', {
    yPercent: 60,
    opacity: 0,
    ease: 'none',
    scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
}
