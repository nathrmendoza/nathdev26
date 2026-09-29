'use client';

/**
 * Hero3DText.tsx
 *
 * The hero headline, rendered as real extruded 3D geometry (not a CSS
 * illusion) from the actual Archivo glyph outlines -- see lib/hero-glyphs.ts
 * for where those come from. Orthographic camera, so it reads as flat
 * "signage" rather than perspective-receding type. The whole object faces
 * toward the cursor with a small, eased rotation (a few degrees, never a
 * full turn) and holds still otherwise -- one calm interaction, not a scene
 * competing with DitherBackground's own ambient movement.
 *
 * Shading is deliberately not smooth Lambertian: a fixed light direction's
 * intensity per face is quantized through the same Bayer ordered-dither
 * threshold as the rest of the kit (lib/ordered-noise.ts), so the letters'
 * flat and bevelled faces pick up the site's halftone shading instead of a
 * generic 3D-software gradient.
 */

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

const TEXT = '200 / OK';

const MAX_ROTATION_DEG = 15;
const EASE = 0.07;

const INK = [217 / 255, 220 / 255, 214 / 255];
const GROUND = [13 / 255, 15 / 255, 16 / 255];
const ACCENT = [111 / 255, 211 / 255, 196 / 255];

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function degToRad(d: number) {
  return (d * Math.PI) / 180;
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

  void main() {
    vec3 n = normalize(vNormal);
    vec3 lightDir = normalize(vec3(-0.45, 0.55, 0.75));
    // Half-lambert, not a hard clamp to 0 -- faces angled away from the
    // light still land mid-band instead of flattening into solid black,
    // so the dither texture shows on every face, not just the lit ones.
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

export default function Hero3DText() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new Scene();
    const camera = new OrthographicCamera();
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Layout size is owned by this CSS, independent of the drawing-buffer
    // resolution setSize() below manages -- otherwise, with updateStyle
    // false, the canvas's box defaults to its (pixelRatio-multiplied)
    // intrinsic width/height attributes instead of the container's size.
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
      },
    });

    const group = new Group();
    const line = layoutLine(TEXT);
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

    // Fit the camera to the silhouette across the full rotation range, not
    // just the resting pose -- a rotated object's on-screen extent is wider
    // than at rest, so sizing off rotation.set(0,0,0) alone clips the edges
    // the moment it tilts toward the cursor.
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

    let frameId = 0;
    let running = true;
    const animate = () => {
      if (!running) return;
      if (!reduced) {
        current.x += (target.x - current.x) * EASE;
        current.y += (target.y - current.y) * EASE;
        group.rotation.x = current.x;
        group.rotation.y = current.y;
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
  }, []);

  return (
    <div ref={containerRef} className="h-[34vh] min-h-[220px] w-full sm:h-[42vh]">
      {/* Real heading for screen readers/SEO -- the 3D text is decorative, not semantic. */}
      <h1 className="sr-only">Nathan Mendoza — Web Developer, Christchurch NZ</h1>
    </div>
  );
}
