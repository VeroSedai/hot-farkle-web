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

  void main() {
    vec2 uv = v_uv - vec2(0.5, 0.5);
    float dist = length(uv);
    float t = u_time * 0.25;

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

    vec3 col = mix(c3, c1, smoothstep(0.15, 0.58, blend_val));
    col = mix(col, c2, smoothstep(0.52, 0.92, blend_val));

    float vignette = smoothstep(0.85, 0.15, dist);
    col = mix(c3, col, mix(0.45, 1.0, vignette));

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const SwirlBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    const render = (now: number) => {
      gl.uniform1f(timeLoc, (now - start) * 0.001);
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
