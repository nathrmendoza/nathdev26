'use client';

import { useEffect, useRef } from 'react';
import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  Group,
  Mesh,
  ExtrudeGeometry,
  ShaderMaterial,
  Box3,
  Vector3,
} from 'three';
import { getBayerMatrix } from '@/lib/ordered-noise';
import { layoutLine, HERO_UNITS_PER_EM } from '@/lib/hero-glyphs';

const MAX_ROTATION_DEG = 15;
const EASE = 0.07;

// INTRO_DELAY_FIRST waits out SplashCurtain, so the intro plays on a clear screen.
const INTRO_DELAY_FIRST = 1400;
const INTRO_DELAY_ROUTE = 150;
const INTRO_MS = 1400;
/** Fraction of the intro the dither develop takes. */
const DEVELOP_END = 0.8;
/** Fraction of the intro at which `onLanded` fires. */
const LANDED_AT = 0.75;
// Kept modest so the mid-swing silhouette stays inside the camera fit.
const INTRO_ROT_X_DEG = 20;
const INTRO_ROT_Y_DEG = -30;
const INTRO_MIN_DEPTH = 0.04;
/** CSS pixels per develop cell -- chunky like the rest of the kit's dither. */
const DEVELOP_CELL_PX = 3;

// Set when the intro actually starts, so Strict Mode's double mount
// isn't mistaken for a revisit.
let introPlayed = false;

const INK = [217 / 255, 220 / 255, 214 / 255];
const GROUND = [13 / 255, 15 / 255, 16 / 255];
const ACCENT = [111 / 255, 211 / 255, 196 / 255];

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  varying vec3 vNormal;
  uniform vec3 uInk;
  uniform vec3 uGround;
  uniform vec3 uAccent;
  uniform float uBayer[64];
  uniform float uProgress;
  uniform float uCell;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }

  void main() {
    // Skipped at 1.0, so the resting render is untouched.
    if (uProgress < 1.0) {
      vec2 cell = floor(gl_FragCoord.xy / uCell);
      int cx = int(mod(cell.x, 8.0));
      int cy = int(mod(cell.y, 8.0));
      float field = vnoise(cell * 0.15) * 0.65 + uBayer[cy * 8 + cx] * 0.35;
      if (field >= uProgress) discard;
    }

    vec3 n = normalize(vNormal);
    vec3 lightDir = normalize(vec3(-0.45, 0.55, 0.75));
    // Half-lambert, so faces turned away still show dither instead of solid black.
    float ndl = dot(n, lightDir) * 0.5 + 0.5;

    int xi = int(mod(gl_FragCoord.x, 8.0));
    int yi = int(mod(gl_FragCoord.y, 8.0));
    float threshold = uBayer[yi * 8 + xi];

    float levels = 4.0;
    float scaled = ndl * levels;
    float lvl = floor(scaled);
    float frac = scaled - lvl;
    float dithered = (frac > threshold) ? (lvl + 1.0) : lvl;
    float shade = clamp(dithered / levels, 0.0, 1.0);

    vec3 color = mix(uGround, uInk, shade);
    color = mix(color, uAccent, smoothstep(0.82, 1.0, shade) * 0.22);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const EXTRUDE_SETTINGS = {
  depth: 300,
  bevelEnabled: true,
  bevelThickness: 38,
  bevelSize: 26,
  bevelSegments: 3,
  curveSegments: 10,
};

export interface Hero3DTextProps {
  /** Rendered in 3D. Limited to the glyphs baked into lib/data/hero-glyphs.json. */
  text?: string;
  /** The page's real <h1>, for screen readers and search -- the 3D text is decorative. */
  heading?: string;
  /** Fires once as the intro lands. Immediately under reduced motion. */
  onLanded?: () => void;
}

export default function Hero3DText({
  text = '200 / OK',
  heading = 'Nathan Mendoza — Web Developer, Christchurch NZ',
  onLanded,
}: Hero3DTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onLandedRef = useRef(onLanded);

  useEffect(() => {
    onLandedRef.current = onLanded;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new Scene();
    const camera = new OrthographicCamera();
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // CSS owns the layout size; setSize() below only manages the drawing buffer.
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);

    const bayer = getBayerMatrix(8);
    const material = new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uInk: { value: INK },
        uGround: { value: GROUND },
        uAccent: { value: ACCENT },
        uBayer: { value: Array.from(bayer.data) },
        uProgress: { value: 0 },
        uCell: { value: DEVELOP_CELL_PX * renderer.getPixelRatio() },
      },
    });

    const group = new Group();
    const line = layoutLine(text);
    for (const glyph of line.glyphs) {
      const geometry = new ExtrudeGeometry(glyph.shape, EXTRUDE_SETTINGS);
      geometry.translate(-line.width / 2 + glyph.x, 0, -EXTRUDE_SETTINGS.depth / 2);
      const mesh = new Mesh(geometry, material);
      group.add(mesh);
    }
    const scale = 1 / HERO_UNITS_PER_EM;
    group.scale.setScalar(scale);
    scene.add(group);

    const maxRotation = degToRad(MAX_ROTATION_DEG);

    // Fit across the full rotation range, not just the resting pose, so tilting never clips.
    const bounds = new Box3();
    for (const rx of [-maxRotation, 0, maxRotation]) {
      for (const ry of [-maxRotation, 0, maxRotation]) {
        group.rotation.set(rx, ry, 0);
        group.updateMatrixWorld(true);
        bounds.union(new Box3().setFromObject(group));
      }
    }
    group.rotation.set(0, 0, 0);
    group.updateMatrixWorld(true);

    const contentSize = new Vector3();
    bounds.getSize(contentSize);

    const updateCamera = () => {
      const width = container.clientWidth || 1;
      const height = container.clientHeight || 1;
      const aspect = width / height;
      const padding = 1.25;
      let viewWidth = contentSize.x * padding;
      let viewHeight = viewWidth / aspect;
      if (viewHeight < contentSize.y * padding) {
        viewHeight = contentSize.y * padding;
        viewWidth = viewHeight * aspect;
      }
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.near = -100;
      camera.far = 100;
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    updateCamera();

    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      target.y = Math.max(-1, Math.min(1, nx)) * maxRotation;
      target.x = Math.max(-1, Math.min(1, ny)) * maxRotation;
    };
    const onPointerLeave = () => {
      target.x = 0;
      target.y = 0;
    };

    const heroSection = container.closest('section');
    const reduced = reducedMotion();
    if (!reduced && heroSection) {
      heroSection.addEventListener('pointermove', onPointerMove);
      heroSection.addEventListener('pointerleave', onPointerLeave);
    }

    const introStart = performance.now() + (introPlayed ? INTRO_DELAY_ROUTE : INTRO_DELAY_FIRST);
    const introRotX = degToRad(INTRO_ROT_X_DEG);
    const introRotY = degToRad(INTRO_ROT_Y_DEG);
    let introDone = reduced;
    let landed = false;

    const land = () => {
      if (landed) return;
      landed = true;
      onLandedRef.current?.();
    };

    if (reduced) {
      material.uniforms.uProgress.value = 1;
      introPlayed = true;
      land();
    }

    let frameId = 0;
    let running = true;
    const animate = () => {
      if (!running) return;
      if (!reduced) {
        current.x += (target.x - current.x) * EASE;
        current.y += (target.y - current.y) * EASE;

        // Intro offsets add on top of the cursor easing, so there's no hand-off jump.
        let offX = 0;
        let offY = 0;
        let depth = 1;
        if (!introDone) {
          const t = Math.min(1, Math.max(0, (performance.now() - introStart) / INTRO_MS));
          if (t > 0) introPlayed = true;
          const settle = easeOutCubic(t);
          material.uniforms.uProgress.value = t >= DEVELOP_END ? 1 : easeOutCubic(t / DEVELOP_END);
          offX = introRotX * (1 - settle);
          offY = introRotY * (1 - settle);
          depth = INTRO_MIN_DEPTH + (1 - INTRO_MIN_DEPTH) * settle;
          if (t >= LANDED_AT) land();
          if (t >= 1) introDone = true;
        }

        group.rotation.x = current.x + offX;
        group.rotation.y = current.y + offY;
        group.scale.set(scale, scale, scale * depth);
      }
      renderer.render(scene, camera);
      if (!reduced) frameId = requestAnimationFrame(animate);
    };
    animate();

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frameId);
      } else if (!reduced) {
        running = true;
        animate();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const resizeObserver = new ResizeObserver(updateCamera);
    resizeObserver.observe(container);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      document.removeEventListener('visibilitychange', onVisibility);
      resizeObserver.disconnect();
      if (heroSection) {
        heroSection.removeEventListener('pointermove', onPointerMove);
        heroSection.removeEventListener('pointerleave', onPointerLeave);
      }
      scene.traverse((obj) => {
        if (obj instanceof Mesh) obj.geometry.dispose();
      });
      material.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [text]);

  return (
    <div ref={containerRef} className="h-[34vh] min-h-[220px] w-full sm:h-[42vh]">
      {/* Real heading for screen readers/SEO -- the 3D text is decorative, not semantic. */}
      <h1 className="sr-only">{heading}</h1>
    </div>
  );
}
