import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Açılış ekranı + hero giriş animasyonu
export async function runIntro({ lenis, reduced, heroPlan }) {
  const html = document.documentElement;
  const loader = document.querySelector('.loader');

  if (reduced) {
    loader.remove();
    return;
  }

  html.classList.add('is-loading');
  lenis?.stop();

  const heroIn = prepareHero(heroPlan);

  const brand = SplitText.create('.loader__brand', { type: 'chars', mask: 'chars' });
  const countEl = loader.querySelector('.loader__count');
  const counter = { v: 0 };

  const tl = gsap.timeline();
  tl.from('.loader__grid span:nth-child(-n+3)', { scaleX: 0, duration: 1.4, ease: 'expo.inOut', stagger: 0.08 }, 0)
    .from('.loader__grid span:nth-child(n+4)', { scaleY: 0, duration: 1.4, ease: 'expo.inOut', stagger: 0.08 }, 0.1)
    .from(brand.chars, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.025 }, 0.25)
    .from('.loader__meta', { opacity: 0, duration: 0.6 }, 0.4)
    .to(counter, {
      v: 100,
      duration: 1.7,
      ease: 'power2.inOut',
      onUpdate: () => (countEl.textContent = String(Math.round(counter.v)).padStart(3, '0')),
    }, 0.2)
    .to('.loader__bar span', { scaleX: 1, duration: 1.7, ease: 'power2.inOut' }, 0.2);

  await Promise.all([tl.then(), document.fonts.ready]);

  gsap
    .timeline({
      onComplete: () => {
        loader.remove();
        html.classList.remove('is-loading');
        lenis?.start();
        ScrollTrigger.refresh();
      },
    })
    .to('.loader__inner', { yPercent: -40, opacity: 0, duration: 0.6, ease: 'power3.in' })
    .fromTo(
      loader,
      { clipPath: 'inset(0% 0% 0% 0%)' },
      { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' },
      '-=0.25',
    )
    .add(heroIn.play(), '-=0.6');
}

function prepareHero(plan) {
  const title = SplitText.create('.hero__title .line', { type: 'words,chars' });
  const parcels = plan.parcelList.map((p) => p.node);
  const buildings = plan.buildings.querySelectorAll('.bldg');
  const lines = plan.roads.querySelectorAll('.bank, .road-edge');
  const plaza = plan.roads.querySelectorAll('circle');
  const trees = plan.trees.querySelectorAll('.tree');

  const tl = gsap.timeline({ paused: true });
  tl.from('.header__inner', { yPercent: -100, duration: 1.1, ease: 'expo.out' }, 0.2)
    .from(title.chars, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.024 }, 0)
    .from(
      ['.hero__eyebrow', '.hero__lead', '.hero__actions', '.hero__foot'],
      { y: 30, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 },
      0.35,
    )
    .from('.hero__visual', { y: 80, opacity: 0, duration: 1.4, ease: 'expo.out' }, 0.1)
    .from(plan.water.children, { opacity: 0, duration: 1.2, ease: 'power2.out', clearProps: 'opacity' }, 0.4)
    .from(lines, { drawSVG: '0%', duration: 1.6, ease: 'power2.inOut', stagger: 0.05 }, 0.35)
    .from(plan.roads.querySelectorAll('.road-axis'), { opacity: 0, duration: 1, clearProps: 'opacity' }, 1.2)
    .from(plan.roads.querySelector('.avenue'), { drawSVG: '50% 50%', duration: 1.2, ease: 'expo.inOut' }, 0.5)
    .from(
      parcels,
      {
        scale: 0,
        transformOrigin: '50% 50%',
        duration: 0.8,
        ease: 'back.out(1.6)',
        stagger: (i, el) => 0.05 + el.__d * 2.1,
      },
      0.45,
    )
    .from(
      buildings,
      { opacity: 0, duration: 0.6, ease: 'power2.out', stagger: (i, el) => el.__d * 2.1, clearProps: 'opacity' },
      0.9,
    )
    .from(plaza, { scale: 0, transformOrigin: '50% 50%', duration: 1, ease: 'expo.out', stagger: 0.12 }, 0.9)
    .from(trees, { scale: 0, transformOrigin: '50% 50%', duration: 0.5, ease: 'back.out(2)', stagger: { amount: 1.2, from: 'random' } }, 1.1)
    .from('.legend li', { y: 16, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.07 }, 1.2)
    .from(['.sheet__north', '.sheet__antet'], { opacity: 0, y: 12, duration: 0.8, ease: 'expo.out', stagger: 0.1 }, 1.4)
    .from('.sheet__corner', { scale: 0, duration: 0.6, ease: 'back.out(2)', stagger: 0.05 }, 1.2);

  return tl;
}
