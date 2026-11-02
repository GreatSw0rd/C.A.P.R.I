import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// Sphere phosphore de C.A.P.R.I : filaments lumineux vert et violet (rayons) qui s'emballent
// quand quelqu'un parle. En option (oeil) : anneau vert et pupille qui suit la souris.
// Shader d'apres "Phosphor 3" de XorDev (licence non precisee : a confirmer avant diffusion).

const SOMMETS = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform float uTime;
uniform float uAct;
uniform vec2 uRegard;
uniform float uOeil;
const vec3 LIME = vec3(0.769, 0.918, 0.667);
const vec3 ENCRE = vec3(0.118, 0.094, 0.188);

void main() {
  vec2 r = uRes;
  float t = uTime;
  vec3 dir = normalize(vec3(gl_FragCoord.xy * 2.0 - r, -r.y));
  vec3 o = vec3(0.0);
  float s = 0.0, z = 0.0, d = 0.0;
  float agitation = 1.0 + 0.7 * uAct;
  for (float i = 0.0; i < 80.0; i++) {
    vec3 p = z * dir;
    vec3 a = normalize(cos(vec3(5.0, 0.0, 1.0) + t - d * 4.0));
    p.z += 5.0;
    a = a * dot(a, p) - cross(a, p);
    for (float k = 2.0; k < 10.0; k++) a -= agitation * sin(a * k + t).zxy / k;
    s = a.y;
    d = 0.1 * abs(length(p) - 3.0) + 0.07 * abs(cos(s));
    z += d;
    o += mix(vec3(0.50, 0.18, 1.0), vec3(0.55, 1.0, 0.32), smoothstep(-0.35, 0.35, cos(s * 1.3))) * 1.5 / d;
  }
  vec3 col = tanh(o / (5e3 * (1.0 - 0.35 * uAct)));

  // Retire le voile diffus des rayons qui manquent la sphere (sinon un carre gris apparait
  // autour de l'orbe) et fond le bord du cadre.
  vec2 uv = (gl_FragCoord.xy * 2.0 - r) / r.y;
  const float VOILE = 0.14;
  col = min(max(col - VOILE, 0.0) / (1.0 - VOILE) * 1.15, 1.0);
  col *= smoothstep(1.0, 0.86, length(uv));

  if (uOeil > 0.5) {
    float rr = length(uv);
    col += LIME * 0.010 / (abs(rr - 0.80) + 0.010) * 0.6;
    float rp = 0.16 * (1.0 + 0.3 * uAct);
    float dp = length(uv - uRegard);
    float pupille = smoothstep(rp + 0.02, rp - 0.02, dp);
    float bord = smoothstep(rp + 0.05, rp, dp) * (1.0 - pupille);
    col = mix(col, ENCRE, bord * 0.85);
    col = mix(col, vec3(0.957, 0.941, 1.0), pupille);
    col += 0.25 * smoothstep(0.05, 0.0, length(uv - uRegard - vec2(-0.05, 0.06))) * pupille;
  }
  // Fond transparent : l'opacite suit la luminosite (couleurs premultipliees).
  float alpha = clamp(max(col.r, max(col.g, col.b)) * 1.15, 0.0, 1.0);
  fragColor = vec4(col, alpha);
}`;

export const Phosphore = ({
  className,
  activity,
  oeil = false,
  suivreSouris = true,
  resolutionMax = 320,
}: {
  className?: string;
  /** Intensite d'activite (0 a 1) lue a chaque image (voix, reponse). */
  activity?: () => number;
  /** Anneau vert et pupille (l'iris de Capri). */
  oeil?: boolean;
  /** La pupille suit le curseur. */
  suivreSouris?: boolean;
  /** Plus grand cote du rendu, en pixels : le shader est couteux, on le plafonne. */
  resolutionMax?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reglages = useRef({ activity, oeil, suivreSouris, resolutionMax });
  reglages.current = { activity, oeil, suivreSouris, resolutionMax };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!canvas || !gl) return;

    const compiler = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return sh;
      console.error(gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    };
    const vs = compiler(gl.VERTEX_SHADER, SOMMETS);
    const fs = compiler(gl.FRAGMENT_SHADER, FRAGMENT);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, "aPos");
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(prog));
      gl.deleteProgram(prog);
      return;
    }
    gl.useProgram(prog);

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uAct = gl.getUniformLocation(prog, "uAct");
    const uRegard = gl.getUniformLocation(prog, "uRegard");
    const uOeil = gl.getUniformLocation(prog, "uOeil");

    // Pause quand l'orbe n'est pas visible (onglet masque, hors ecran).
    let visible = true;
    const observateur = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    observateur.observe(canvas);

    // Regard : la pupille se tourne vers le curseur, avec douceur.
    const cible = { x: 0, y: 0 };
    const regard = { x: 0, y: 0 };
    const surSouris = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect();
      const h = b.height || 1;
      cible.x = Math.max(-1, Math.min(1, ((e.clientX - b.left) * 2 - b.width) / h)) * 0.08;
      cible.y = Math.max(-1, Math.min(1, -((e.clientY - b.top) * 2 - b.height) / h)) * 0.08;
    };
    window.addEventListener("pointermove", surSouris);

    const reduit = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let temps = 3;
    let avant = performance.now();
    let raf = 0;

    const image = (maintenant: number) => {
      raf = requestAnimationFrame(image);
      const dt = Math.min(0.05, (maintenant - avant) / 1000);
      avant = maintenant;
      if (!visible || document.hidden) return;

      const r = reglages.current;
      const act = Math.max(0, Math.min(1, r.activity?.() ?? 0));
      // Le temps avance plus vite quand quelqu'un parle : les filaments s'emballent.
      if (!reduit) temps += dt * (1 + 1.4 * act);

      const largeur = canvas.clientWidth || 1;
      const hauteur = canvas.clientHeight || 1;
      const echelle = Math.min(
        window.devicePixelRatio || 1,
        r.resolutionMax / Math.max(largeur, hauteur)
      );
      const w = Math.max(1, Math.round(largeur * echelle));
      const h = Math.max(1, Math.round(hauteur * echelle));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      if (!r.suivreSouris) {
        cible.x = 0;
        cible.y = 0;
      }
      regard.x += (cible.x - regard.x) * 0.12;
      regard.y += (cible.y - regard.y) * 0.12;

      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uTime, temps);
      gl.uniform1f(uAct, act);
      gl.uniform2f(uRegard, regard.x, regard.y);
      gl.uniform1f(uOeil, r.oeil ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(image);

    return () => {
      cancelAnimationFrame(raf);
      observateur.disconnect();
      window.removeEventListener("pointermove", surSouris);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("block h-full w-full", className)}
    />
  );
};
