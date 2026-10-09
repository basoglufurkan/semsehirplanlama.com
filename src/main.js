import '@fontsource-variable/fraunces';
import '@fontsource-variable/fraunces/wght-italic.css';
import '@fontsource-variable/manrope';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import 'lenis/dist/lenis.css';
import './styles/base.css';
import './styles/plan.css';
import './styles/sections.css';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import Lenis from 'lenis';

import { buildPlan, buildContours } from './js/plan.js';
import { initUI } from './js/ui.js';
import { initScroll } from './js/scroll.js';
import { runIntro } from './js/intro.js';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
document.documentElement.classList.toggle('reduced', reduced);

// Yumuşak kaydırma
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.1, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

// Prosedürel plan çizimleri
const heroPlan = buildPlan(document.getElementById('hero-plan'), { seed: 7, cols: 6 });
const zoomPlan = buildPlan(document.getElementById('zoom-plan'), {
  seed: 19,
  cols: 9,
  labels: true,
  macro: true,
  blockFill: true,
});

const variants = {
  coast: { cols: 5 },
  dense: { cols: 8, river: false },
  historic: { cols: 7, avenue: false },
};
document.querySelectorAll('[data-plan-seed]').forEach((svg) => {
  buildPlan(svg, {
    seed: Number(svg.dataset.planSeed),
    cols: 6,
    ...variants[svg.dataset.planVariant],
  });
});

buildContours(document.getElementById('portrait-contours'), { seed: 5 });

initUI({ lenis, heroPlan });
initScroll({ reduced, zoomPlan });
runIntro({ lenis, reduced, heroPlan });
