import React, { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 v_uv;
  uniform float u_time;
  uniform float u_heat;
  uniform vec3 u_tint;
  uniform float u_tintMix;

  void main() {
    vec2 uv = v_uv - vec2(0.5, 0.5);
    float dist = length(uv);
    float speed = 0.25 + u_heat * 0.14;
    float t = u_time * speed;

    float angle = 2.4 * (0.45 - dist) + t * 0.25;
    float s = sin(angle);
    float c = cos(angle);
    vec2 p = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c) * 2.6;

    for (int i = 0; i < 3; i++) {
      float fi = float(i + 1);
      p += vec2(
        sin(p.y * (1.35 * fi) + t * (1.1 + 0.2 * fi)),
        cos(p.x * (1.35 * fi) - t * (0.9 + 0.25 * fi))
      ) * (0.48 / fi);
    }

    float wave = 0.5 + 0.5 * sin(p.x * 1.4 + p.y * 1.2 + t * 0.6);
    float secondary = 0.5 + 0.5 * cos(length(p) * 1.8 - t * 0.5);
    float blend_val = mix(wave, secondary, 0.45);

    vec3 c1 = vec3(0.1059, 0.1294, 0.1176);
    vec3 c2 = vec3(0.1451, 0.2000, 0.1725);
    vec3 c3 = vec3(0.0667, 0.0824, 0.0745);

    // Subtle boss atmosphere tint
    c2 = mix(c2, u_tint * 0.34, u_tintMix);
    c1 = mix(c1, u_tint * 0.20, u_tintMix * 0.7);

    // Warm ember glow on Hot Dice / high multiplier
    vec3 heatCol = vec3(0.32, 0.16, 0.06);
    c2 = mix(c2, heatCol, u_heat * 0.65);
    c1 = mix(c1, heatCol * 0.6, u_heat * 0.4);

    vec3 col = mix(c3, c1, smoothstep(0.15, 0.58, blend_val));
    col = mix(col, c2, smoothstep(0.52, 0.92, blend_val));

    float vignette = smoothstep(0.88, 0.14, dist);
    col = mix(c3 * 0.85, col, mix(0.42, 1.0, vignette));

    gl_FragColor = vec4(col, 1.0);
  }
`;

function hexToRgbNorm(hex?: string): [number, number, number] {
  if (!hex) return [0.1451, 0.2, 0.1725];
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return [0.1451, 0.2, 0.1725];
  const n = parseInt(clean, 16);
  if (Number.isNaN(n)) return [0.1451, 0.2, 0.1725];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

interface SwirlBackgroundProps {
  heat?: number;
  accentHex?: string;
}

export const SwirlBackground: React.FC<SwirlBackgroundProps> = ({ heat = 0, accentHex }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetRef = useRef({ heat: 0, tint: [0.1451, 0.2, 0.1725] as [number, number, number], tintMix: 0 });

  targetRef.current.heat = Math.max(0, Math.min(1, heat));
  targetRef.current.tint = hexToRgbNorm(accentHex);
  targetRef.current.tintMix = accentHex ? 0.55 : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const timeLoc = gl.getUniformLocation(prog, 'u_time');
    const heatLoc = gl.getUniformLocation(prog, 'u_heat');
    const tintLoc = gl.getUniformLocation(prog, 'u_tint');
    const tintMixLoc = gl.getUniformLocation(prog, 'u_tintMix');

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    let rafId = 0;
    const start = performance.now();
    let curHeat = 0;
    let curTintMix = 0;
    const curTint: [number, number, number] = [0.1451, 0.2, 0.1725];

    const render = (now: number) => {
      const target = targetRef.current;
      curHeat += (target.heat - curHeat) * 0.04;
      curTintMix += (target.tintMix - curTintMix) * 0.04;
      curTint[0] += (target.tint[0] - curTint[0]) * 0.04;
      curTint[1] += (target.tint[1] - curTint[1]) * 0.04;
      curTint[2] += (target.tint[2] - curTint[2]) * 0.04;

      gl.uniform1f(timeLoc, (now - start) * 0.001);
      gl.uniform1f(heatLoc, curHeat);
      gl.uniform3f(tintLoc, curTint[0], curTint[1], curTint[2]);
      gl.uniform1f(tintMixLoc, curTintMix);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="swirl-bg" aria-hidden="true" />;
};
