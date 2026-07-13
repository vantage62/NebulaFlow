'use client';

import { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Color } from 'ogl';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uStarSpeed;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uGlowIntensity;
uniform float uSaturation;
uniform bool uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationSpeed;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform bool uTransparent;

varying vec2 vUv;

#define NUM_LAYER 4.0
#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p){
  p = fract(p*vec2(123.34, 456.21));
  p += dot(p, p+45.32);
  return fract(p.x*p.y);
}

float tri(float x){ return abs(fract(x)*2.0-1.0); }
float tris(float x){ float t = fract(x); return 1.0-smoothstep(0.0, 1.0, abs(2.0*t-1.0)); }
float trisn(float x){ float t = fract(x); return 2.0*(1.0-smoothstep(0.0, 1.0, abs(2.0*t-1.0)))-1.0; }

vec3 hsv2rgb(vec3 c){
  vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz)*6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p-K.xxx, 0.0, 1.0), c.y);
}

vec3 rgb2hsv(vec3 c){
  vec4 K = vec4(0.0, -1.0/3.0, 2.0/3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0*d + e)), d / (q.x + e), q.x);
}

float Star(vec2 uv, float flare){
  float d = length(uv);
  float m = (0.05*uGlowIntensity)/d;
  float rays = max(0.0, 1.0 - abs(uv.x*uv.y*1000.0));
  m += rays*flare*uGlowIntensity;
  uv *= MAT45;
  rays = max(0.0, 1.0 - abs(uv.x*uv.y*1000.0));
  m += rays*0.3*flare*uGlowIntensity;
  m *= smoothstep(1.0, 0.2, d);
  return m;
}

vec3 StarLayer(vec2 uv){
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  for(int y=-1; y<=1; y++){
    for(int x=-1; x<=1; x++){
      vec2 offset = vec2(float(x), float(y));
      float n = Hash21(id+offset);
      float size = fract(n*345.32);
      float starX = offset.x + n - 0.5;
      float starY = offset.y + fract(n*34.0) - 0.5;
      float star = Star(gv - vec2(starX, starY), smoothstep(0.9, 1.0, size)*0.6);
      vec3 base = vec3(0.6+0.4*fract(n*2345.2), 0.6+0.4*fract(n*8532.1), 1.0);
      base = mix(vec3(1.0), base, uSaturation);
      float twinkle = mix(1.0, sin((uTime*uSpeed + n*6.2831))*0.5+0.5, uTwinkleIntensity);
      col += star*size*base*twinkle;
    }
  }
  return col;
}

void main(){
  vec2 uv = (vUv - 0.5) * vec2(uResolution.x/uResolution.y, 1.0);
  vec2 mouse = (uMouse - 0.5) * vec2(uResolution.x/uResolution.y, 1.0);

  float t = uTime * uRotationSpeed * 0.1;
  float ca = cos(t); float sa = sin(t);

  // Apply the same rotation to BOTH uv and mouse so repulsion stays locked to cursor
  uv = mat2(ca, -sa, sa, ca) * uv;
  mouse = mat2(ca, -sa, sa, ca) * mouse;

  if(uMouseRepulsion){
    vec2 diff = uv - mouse;
    float d = length(diff);
    float force = uRepulsionStrength * 0.05 / (d*d + 0.05);
    uv -= normalize(diff) * force * uMouseActiveFactor;
  }

  vec3 col = vec3(0.0);
  for(float i=0.0; i<1.0; i+=1.0/NUM_LAYER){
    float depth = fract(i + uTime*0.005*uStarSpeed);
    float scale = mix(20.0*uDensity, 0.5*uDensity, depth);
    float fade = depth*smoothstep(1.0, 0.9, depth);
    col += StarLayer(uv*scale + i*453.32) * fade;
  }

  vec3 hsv = rgb2hsv(col);
  hsv.x = fract(hsv.x + uHueShift/360.0);
  col = hsv2rgb(hsv);

  float alpha = uTransparent ? clamp(length(col), 0.0, 1.0) : 1.0;
  gl_FragColor = vec4(col, alpha);
}
`;

interface GalaxyProps {
  starSpeed?: number;
  density?: number;
  hueShift?: number;
  speed?: number;
  glowIntensity?: number;
  saturation?: number;
  mouseRepulsion?: boolean;
  repulsionStrength?: number;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  transparent?: boolean;
}

export default function Galaxy({
  starSpeed = 0.9,
  density = 3,
  hueShift = 140,
  speed = 1.9,
  glowIntensity = 0.5,
  saturation = 0,
  mouseRepulsion = true,
  repulsionStrength = 1.5,
  twinkleIntensity = 0.3,
  rotationSpeed = 0.1,
  transparent = true,
}: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new Renderer({
      alpha: transparent,
      premultipliedAlpha: false,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    const gl = renderer.gl;
    if (transparent) gl.clearColor(0, 0, 0, 0);
    else gl.clearColor(0, 0, 0, 1);
    container.appendChild(gl.canvas);
    gl.canvas.style.width = '100%';
    gl.canvas.style.height = '100%';
    gl.canvas.style.display = 'block';

    const geometry = new Triangle(gl);

    const mouse = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5, active: 0, targetActive: 0 };

    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Color(gl.canvas.width, gl.canvas.height, 1) },
        uFocal: { value: [0.5, 0.5] },
        uRotation: { value: [1, 0] },
        uStarSpeed: { value: starSpeed },
        uDensity: { value: density },
        uHueShift: { value: hueShift },
        uSpeed: { value: speed },
        uMouse: { value: [0.5, 0.5] },
        uGlowIntensity: { value: glowIntensity },
        uSaturation: { value: saturation },
        uMouseRepulsion: { value: mouseRepulsion },
        uTwinkleIntensity: { value: twinkleIntensity },
        uRotationSpeed: { value: rotationSpeed },
        uRepulsionStrength: { value: repulsionStrength },
        uMouseActiveFactor: { value: 0 },
        uAutoCenterRepulsion: { value: 0 },
        uTransparent: { value: transparent },
      },
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = new Color(gl.canvas.width, gl.canvas.height, 1);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = (e.clientX - rect.left) / rect.width;
      mouse.targetY = 1.0 - (e.clientY - rect.top) / rect.height;
      mouse.targetActive = 1;
    };
    const onLeave = () => { mouse.targetActive = 0; };
    window.addEventListener('mousemove', onMove);
    container.addEventListener('mouseleave', onLeave);

    let raf: number;
    const start = performance.now();
    const loop = () => {
      const now = performance.now();
      program.uniforms.uTime.value = (now - start) * 0.001;
      // Fast lerp for snappy, accurate cursor tracking
      mouse.x += (mouse.targetX - mouse.x) * 0.2;
      mouse.y += (mouse.targetY - mouse.y) * 0.2;
      mouse.active += (mouse.targetActive - mouse.active) * 0.08;
      program.uniforms.uMouse.value = [mouse.x, mouse.y];
      program.uniforms.uMouseActiveFactor.value = mouse.active;
      renderer.render({ scene: mesh });
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      container.removeEventListener('mouseleave', onLeave);
      if (gl.canvas.parentNode === container) container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [starSpeed, density, hueShift, speed, glowIntensity, saturation, mouseRepulsion, repulsionStrength, twinkleIntensity, rotationSpeed, transparent]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
