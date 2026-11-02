"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import type * as T from "three";
import { prefersReducedMotion } from "@/lib/utils";

export type IgnitionKeyHandle = {
  /** Run the whole insert, turn and crank sequence, as if the rider had tapped the key. */
  turn: () => void;
};

/** Where the rider is in the sequence: key out, key in, ignition on, cranking, engine caught, pulling away. */
export type KeyStage = "idle" | "in" | "on" | "crank" | "live" | "ride";

type Props = {
  /** The engine has caught. */
  onStart?: () => void;
  /** The engine has revved and the camera is diving in: time to leave. Gets the key's centre on screen. */
  onRide: (origin: { x: number; y: number }) => void;
  /** The sequence moved on (for a caption that follows along). */
  onStage?: (stage: KeyStage) => void;
  /** three.js and WebGL are up (true) or unavailable (false). */
  onReady: (ok: boolean) => void;
  ref?: Ref<IgnitionKeyHandle>;
  className?: string;
};

const LIME = 0xcedb28;
const RED = 0xff0000;
const AMBER = 0xffa500;
const TURN = Math.PI / 2; // OFF to ON is a quarter turn, clockwise; START is a little past it
const START_AT = 1.12; // key angle (in quarter turns) past which the starter runs
const ARC = (Math.PI * 3) / 4; // the tach runs ±135° about twelve o'clock
const SEGS = 54;
const R_IN = 1.62;
const R_OUT = 1.9;
const POD = 2.42;
const SWEEP = 0.75; // bulb-check sweep of the tach at ON
const CRANK = 0.5; // how long the starter turns before it catches
const LIVE = 0.8; // how long it idles before pulling away

type Spring = { x: number; v: number };
const spring = (s: Spring, target: number, dt: number, k: number, c: number) => {
  s.v += ((target - s.x) * k - s.v * c) * dt;
  s.x += s.v * dt;
};
const polar = (a: number, r: number) => [Math.sin(a) * r, Math.cos(a) * r] as const;
const canvas = (size: number) => {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  return [c, c.getContext("2d")!] as const;
};

/**
 * The cover's START control as a motorcycle's instrument pod in 3D: a black tach with a chrome
 * bezel, and in its middle a knurled ignition barrel with a black-and-lime key on a charm. It idles
 * with a tease (the key nudges in, a light chases round the tach) and tilts toward the pointer.
 * Tap it, or grab the key and turn it, and it does what a real bike does: the key slides in, ON
 * sweeps the tach for a bulb check (neutral and oil lamps stay lit), START
 * cranks with a shudder, the engine catches in a shockwave and a rev blip, settles to idle, then
 * revs as the camera dives into the pod and onRide fires.
 * three.js is loaded on mount; with reduced motion it renders once and a tap goes straight to onRide.
 */
export default function IgnitionKey3D({ onStart, onRide, onReady, onStage, ref, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const api = useRef({ turn: () => {}, onStart, onRide, onReady, onStage });

  useEffect(() => {
    Object.assign(api.current, { onStart, onRide, onReady, onStage });
  }, [onStart, onRide, onReady, onStage]);

  useImperativeHandle(ref, () => ({ turn: () => api.current.turn() }), []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    Promise.all([import("three"), import("three/examples/jsm/environments/RoomEnvironment.js")]).then(([THREE, { RoomEnvironment }]) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        api.current.onReady(false);
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      host.appendChild(renderer.domElement);
      renderer.domElement.style.cssText = "width:100%;height:100%;display:block";

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
      const CAM_Z = 10.4;
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.add(new THREE.AmbientLight(0xffffff, 0.45));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(-3, 4, 6);
      scene.add(keyLight);
      const rim = new THREE.PointLight(RED, 7, 10);
      rim.position.set(3.2, -2.4, 2);
      scene.add(rim);
      const limeLight = new THREE.PointLight(LIME, 0, 7);
      limeLight.position.set(0, 0, 2.2);
      scene.add(limeLight);

      const geos: { dispose: () => void }[] = [];
      const mats: { dispose: () => void }[] = [];
      const own = <M extends { dispose: () => void }>(m: M) => (mats.push(m), m);
      const chrome = own(new THREE.MeshStandardMaterial({ color: 0xd4d8e0, metalness: 1, roughness: 0.16 }));
      const satin = own(new THREE.MeshStandardMaterial({ color: 0x9aa0aa, metalness: 1, roughness: 0.38 }));
      const dark = own(new THREE.MeshStandardMaterial({ color: 0x121212, metalness: 0.6, roughness: 0.35 }));
      const brushed = own(new THREE.MeshStandardMaterial({ color: 0x0e0e10, metalness: 0.7, roughness: 0.5 }));
      const rubber = own(new THREE.MeshPhysicalMaterial({ color: 0x0c0c0c, metalness: 0.1, roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.35 }));
      const limeMat = own(new THREE.MeshStandardMaterial({ color: LIME, emissive: LIME, emissiveIntensity: 0.15, metalness: 0.3, roughness: 0.32 }));
      const black = own(new THREE.MeshBasicMaterial({ color: 0x000000 }));
      const add = (g: T.BufferGeometry, m: T.Material, parent: T.Object3D, x = 0, y = 0, z = 0) => {
        geos.push(g);
        const o = new THREE.Mesh(g, m);
        o.position.set(x, y, z);
        parent.add(o);
        return o;
      };
      const tex = (c: HTMLCanvasElement) => {
        const t = own(new THREE.CanvasTexture(c));
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        return t;
      };

      // A soft radial glow, reused for the aura around the pod and the flare on the tach's tip
      const [gc, gx] = canvas(128);
      const grad = gx.createRadialGradient(64, 64, 4, 64, 64, 64);
      grad.addColorStop(0, "rgba(206,219,40,1)");
      grad.addColorStop(0.45, "rgba(206,219,40,.3)");
      grad.addColorStop(1, "rgba(206,219,40,0)");
      gx.fillStyle = grad;
      gx.fillRect(0, 0, 128, 128);
      const glowTex = tex(gc);
      const auraMat = own(new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false }));
      const aura = add(new THREE.PlaneGeometry(5.9, 5.9), auraMat, scene, 0, 0, -0.6); // fades out before the canvas edge

      // ---- The pod: everything that tilts together
      const cluster = new THREE.Group();
      scene.add(cluster);
      const back = add(new THREE.CylinderGeometry(POD, POD * 0.94, 0.5, 96), dark, cluster, 0, 0, -0.25);
      back.rotation.x = Math.PI / 2;
      add(new THREE.TorusGeometry(POD, 0.085, 24, 128), chrome, cluster, 0, 0, 0);

      // Dial face: numerals, ticks, the key positions and the units, drawn once
      const FACE = 1024;
      const px = FACE / (POD * 2);
      const [fc, fx] = canvas(FACE);
      const c0 = FACE / 2;
      const fg = fx.createRadialGradient(c0, c0 * 0.8, 0, c0, c0, c0);
      fg.addColorStop(0, "#202022");
      fg.addColorStop(0.65, "#0e0e0f");
      fg.addColorStop(1, "#040404");
      fx.fillStyle = fg;
      fx.fillRect(0, 0, FACE, FACE);
      const at = (a: number, r: number) => [c0 + Math.sin(a) * r * px, c0 - Math.cos(a) * r * px] as const;
      for (let k = 0; k <= 48; k++) {
        const a = -ARC + (k / 48) * ARC * 2;
        const major = k % 4 === 0;
        const [x1, y1] = at(a, R_OUT + 0.06);
        const [x2, y2] = at(a, R_OUT + (major ? 0.2 : 0.11));
        fx.strokeStyle = k >= 40 ? "#ff2a2a" : "#d9d9d9";
        fx.lineWidth = (major ? 0.035 : 0.016) * px;
        fx.beginPath();
        fx.moveTo(x1, y1);
        fx.lineTo(x2, y2);
        fx.stroke();
        if (major) {
          const [nx, ny] = at(a, R_OUT + 0.4);
          fx.fillStyle = k >= 40 ? "#ff2a2a" : "#f2f2f2";
          fx.font = `italic 700 ${0.24 * px}px system-ui, sans-serif`;
          fx.textAlign = "center";
          fx.textBaseline = "middle";
          fx.fillText(String(k / 4), nx, ny);
        }
      }
      // redline band inside the ticks
      fx.strokeStyle = "rgba(255,0,0,.55)";
      fx.lineWidth = 0.05 * px;
      fx.beginPath();
      fx.arc(c0, c0, (R_OUT + 0.03) * px, -Math.PI / 2 - ARC + (ARC * 2 * 40) / 48, -Math.PI / 2 + ARC);
      fx.stroke();
      fx.fillStyle = "#8a8a8a";
      fx.font = `600 ${0.115 * px}px system-ui, sans-serif`;
      fx.fillText("×1000 r/min", c0, c0 + 1.42 * px);
      // the key positions, around the barrel
      const marks: [string, number, string][] = [
        ["LOCK", -0.95, "#8a8a8a"],
        ["OFF", 0, "#f2f2f2"],
        ["ON", TURN, "#cedb28"],
        ["START", TURN * 1.36, "#ff3b3b"],
      ];
      // set along the arc, so they sit in the gap between the barrel and the tach
      fx.font = `700 ${0.13 * px}px system-ui, sans-serif`;
      for (const [label, a, col] of marks) {
        fx.fillStyle = col;
        const step = 0.085;
        [...label].forEach((ch, i) => {
          const ca = a + (i - (label.length - 1) / 2) * step;
          const [lx, ly] = at(ca, 1.42);
          fx.save();
          fx.translate(lx, ly);
          fx.rotate(ca);
          fx.fillText(ch, 0, 0);
          fx.restore();
        });
        const [dx, dy] = at(a, 1.26);
        fx.beginPath();
        fx.arc(dx, dy, 0.035 * px, 0, Math.PI * 2);
        fx.fill();
      }
      // START is spring-loaded: a little return arrow from START back to ON
      fx.strokeStyle = "rgba(255,59,59,.7)";
      fx.lineWidth = 0.02 * px;
      fx.beginPath();
      fx.arc(c0, c0, 1.26 * px, -Math.PI / 2 + TURN + 0.12, -Math.PI / 2 + TURN * 1.36 - 0.1);
      fx.stroke();
      const faceMat = own(new THREE.MeshBasicMaterial({ map: tex(fc) })); // unlit, so the dial stays black under the studio light
      add(new THREE.CircleGeometry(POD - 0.02, 96), faceMat, cluster, 0, 0, 0.005);

      // Tach: a segmented bar that lights up to the revs
      const segGeo = new THREE.BoxGeometry(((R_IN + R_OUT) / 2) * ((ARC * 2) / SEGS) * 0.62, R_OUT - R_IN, 0.04);
      geos.push(segGeo);
      const segMat = own(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
      const segs = new THREE.InstancedMesh(segGeo, segMat, SEGS);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const zAxis = new THREE.Vector3(0, 0, 1);
      const one = new THREE.Vector3(1, 1, 1);
      const segAngle = (i: number) => -ARC + ((i + 0.5) / SEGS) * ARC * 2;
      for (let i = 0; i < SEGS; i++) {
        const a = segAngle(i);
        const [x, y] = polar(a, (R_IN + R_OUT) / 2);
        q.setFromAxisAngle(zAxis, -a);
        m4.compose(new THREE.Vector3(x, y, 0.03), q, one);
        segs.setMatrixAt(i, m4);
        segs.setColorAt(i, new THREE.Color(0x1e1e1e));
      }
      cluster.add(segs);
      const flareMat = own(new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
      const flare = add(new THREE.PlaneGeometry(0.9, 0.9), flareMat, cluster, 0, 0, 0.07);

      // Warning lamps in the gap at the bottom: neutral, oil pressure, fuel injection
      const lamp = (draw: (g: CanvasRenderingContext2D) => void) => {
        const [c, g] = canvas(128);
        g.fillStyle = g.strokeStyle = "#fff";
        g.textAlign = "center";
        g.textBaseline = "middle";
        draw(g);
        return own(new THREE.MeshBasicMaterial({ map: tex(c), transparent: true, color: 0x2a2a2a, toneMapped: false, depthWrite: false }));
      };
      const lampN = lamp((g) => {
        g.font = "800 88px system-ui, sans-serif";
        g.fillText("N", 64, 68);
      });
      const lampOil = lamp((g) => {
        g.lineWidth = 9;
        g.lineJoin = "round";
        g.beginPath();
        g.moveTo(64, 16);
        g.lineTo(116, 108);
        g.lineTo(12, 108);
        g.closePath();
        g.stroke();
        g.font = "900 58px system-ui, sans-serif";
        g.fillText("!", 64, 76);
      });
      const lampFi = lamp((g) => {
        g.lineWidth = 8;
        g.strokeRect(14, 30, 100, 68);
        g.font = "800 46px system-ui, sans-serif";
        g.fillText("FI", 64, 66);
      });
      const lampGeo = new THREE.PlaneGeometry(0.34, 0.34);
      geos.push(lampGeo);
      [lampN, lampOil, lampFi].forEach((m, i) => {
        const o = new THREE.Mesh(lampGeo, m);
        o.position.set((i - 1) * 0.5, -1.86 + (i === 1 ? -0.06 : 0), 0.02);
        cluster.add(o);
      });

      // Glass over the dial: a soft diagonal glare
      const [lc, lx] = canvas(512);
      lx.beginPath();
      lx.arc(256, 256, 252, 0, Math.PI * 2);
      lx.clip();
      const lg = lx.createLinearGradient(60, 0, 380, 420);
      lg.addColorStop(0, "rgba(255,255,255,0)");
      lg.addColorStop(0.42, "rgba(255,255,255,0)");
      lg.addColorStop(0.5, "rgba(255,255,255,.16)");
      lg.addColorStop(0.62, "rgba(255,255,255,.04)");
      lg.addColorStop(0.7, "rgba(255,255,255,0)");
      lx.fillStyle = lg;
      lx.fillRect(0, 0, 512, 512);
      add(new THREE.PlaneGeometry(POD * 2 - 0.1, POD * 2 - 0.1), own(new THREE.MeshBasicMaterial({ map: tex(lc), transparent: true, depthWrite: false })), cluster, 0, 0, 0.08);

      // ---- The ignition barrel, standing proud of the dial
      const housing = add(new THREE.CylinderGeometry(1.16, 1.2, 0.3, 96), dark, cluster, 0, 0, 0.15);
      housing.rotation.x = Math.PI / 2;
      add(new THREE.TorusGeometry(1.12, 0.07, 20, 112), chrome, cluster, 0, 0, 0.3);
      const KNURL = 72;
      const knurlGeo = new THREE.BoxGeometry(0.045, 0.06, 0.24);
      geos.push(knurlGeo);
      const knurl = new THREE.InstancedMesh(knurlGeo, satin, KNURL);
      for (let i = 0; i < KNURL; i++) {
        const a = (i / KNURL) * Math.PI * 2;
        const [x, y] = polar(a, 1.19);
        q.setFromAxisAngle(zAxis, -a);
        m4.compose(new THREE.Vector3(x, y, 0.15), q, one);
        knurl.setMatrixAt(i, m4);
      }
      cluster.add(knurl);
      const inner = add(new THREE.CylinderGeometry(1.06, 1.06, 0.02, 96), brushed, cluster, 0, 0, 0.3);
      inner.rotation.x = Math.PI / 2;
      // The lock cylinder turns with the key once it is in
      const plug = new THREE.Group();
      plug.position.z = 0.31;
      cluster.add(plug);
      const plugCap = add(new THREE.CylinderGeometry(0.56, 0.56, 0.06, 64), chrome, plug, 0, 0, 0.02);
      plugCap.rotation.x = Math.PI / 2;
      add(new THREE.TorusGeometry(0.58, 0.025, 12, 64), dark, plug, 0, 0, 0.04);
      add(new THREE.BoxGeometry(0.15, 0.36, 0.03), black, plug, 0, 0, 0.05);
      add(new THREE.BoxGeometry(0.05, 0.05, 0.02), limeMat, plug, 0, 0.44, 0.05); // the plug's index dot

      // ---- The key
      const keyG = new THREE.Group(); // slides in and out
      const spin = new THREE.Group(); // turns about the barrel axis
      keyG.add(spin);
      cluster.add(keyG);
      spin.scale.setScalar(0.8);
      const bow = (pad: number) => {
        const s = new THREE.Shape();
        s.moveTo(-(0.3 - pad * 0.5), 0.2 + pad);
        s.lineTo(0.3 - pad * 0.5, 0.2 + pad);
        s.lineTo(0.5 - pad, 1.05);
        s.absarc(0, 1.05, 0.5 - pad, 0, Math.PI, false);
        s.lineTo(-(0.3 - pad * 0.5), 0.2 + pad);
        const hole = new THREE.Path();
        hole.absarc(0, 1.22, 0.12 + pad * 0.5, 0, Math.PI * 2, true);
        s.holes.push(hole);
        return s;
      };
      add(new THREE.ExtrudeGeometry(bow(0), { depth: 0.16, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 4, curveSegments: 28 }), rubber, spin, 0, 0, 0.2);
      add(new THREE.ExtrudeGeometry(bow(0.09), { depth: 0.04, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 28 }), limeMat, spin, 0, 0, 0.4);
      // Collar and blade with cut teeth and a milled groove
      const collar = add(new THREE.CylinderGeometry(0.2, 0.24, 0.12, 32), satin, spin, 0, 0, 0.16);
      collar.rotation.x = Math.PI / 2;
      add(new THREE.BoxGeometry(0.2, 0.36, 0.95), chrome, spin, 0, 0, -0.27);
      add(new THREE.BoxGeometry(0.21, 0.06, 0.9), satin, spin, 0, 0.04, -0.29);
      for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.12, 0.08, 0.1), chrome, spin, 0, i % 2 ? 0.2 : -0.2, -0.5 - i * 0.1);
      // Rider's mark on the bow: a chevron pointing at the position the key is in
      const mark = new THREE.Shape();
      mark.moveTo(0, 1.0);
      mark.lineTo(0.17, 0.62);
      mark.lineTo(0, 0.7);
      mark.lineTo(-0.17, 0.62);
      mark.closePath();
      add(new THREE.ExtrudeGeometry(mark, { depth: 0.03, bevelEnabled: false }), black, spin, 0, 0, 0.455);
      // Keyring and a swinging charm: a lime fob and a little chrome tag
      const ring = add(new THREE.TorusGeometry(0.16, 0.025, 10, 32), chrome, spin, 0, 1.33, 0.28);
      ring.rotation.y = Math.PI / 2;
      const charm = new THREE.Group();
      spin.add(charm);
      charm.position.set(0, 1.33, 0.46);
      const fob = add(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 32), limeMat, charm, 0, -0.62, 0);
      fob.rotation.x = Math.PI / 2;
      add(new THREE.TorusGeometry(0.2, 0.025, 8, 32), dark, charm, 0, -0.62, 0);
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.38, 6), chrome, charm, 0, -0.26, 0);
      add(new THREE.TorusGeometry(0.06, 0.015, 8, 16), chrome, charm, 0, -0.07, 0);
      const tag = new THREE.Group();
      charm.add(tag);
      tag.position.set(0, -0.07, -0.05);
      add(new THREE.BoxGeometry(0.16, 0.26, 0.025), satin, tag, 0, -0.2, 0);
      add(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 6), chrome, tag, 0, -0.05, 0);

      // ---- Effects: shockwave rings, a spray of sparks, and lime dust drifting in front
      const waveMat = own(new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      const wave = add(new THREE.RingGeometry(0.96, 1.0, 112), waveMat, scene, 0, 0, 0.5);
      const wave2Mat = own(waveMat.clone());
      wave2Mat.color.set(RED);
      const wave2 = add(new THREE.RingGeometry(0.96, 1.0, 112), wave2Mat, scene, 0, 0, 0.5);
      wave.scale.setScalar(0.01);
      wave2.scale.setScalar(0.01);

      const SPARKS = 110;
      const sparkPos = new Float32Array(SPARKS * 3);
      const sparkCol = new Float32Array(SPARKS * 3);
      const sparkVel = new Float32Array(SPARKS * 3);
      const palette = [LIME, LIME, RED, AMBER, 0xffffff].map((c) => new THREE.Color(c));
      for (let i = 0; i < SPARKS; i++) {
        const c = palette[i % palette.length];
        sparkCol.set([c.r, c.g, c.b], i * 3);
      }
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
      sparkGeo.setAttribute("color", new THREE.BufferAttribute(sparkCol, 3));
      geos.push(sparkGeo);
      const sparkMat = own(new THREE.PointsMaterial({ size: 0.12, vertexColors: true, transparent: true, opacity: 0, depthWrite: false }));
      const sparks = new THREE.Points(sparkGeo, sparkMat);
      sparks.frustumCulled = false;
      scene.add(sparks);

      const DUST = 36;
      const dustPos = new Float32Array(DUST * 3);
      const dustSeed = Array.from({ length: DUST }, () => [Math.random() * Math.PI * 2, 1.3 + Math.random() * 1.6, 0.6 + Math.random() * 1.8, 0.2 + Math.random() * 0.5]);
      const dustGeo = new THREE.BufferGeometry();
      dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
      geos.push(dustGeo);
      const dustMat = own(new THREE.PointsMaterial({ color: LIME, size: 0.05, transparent: true, opacity: 0.5, depthWrite: false }));
      const dust = new THREE.Points(dustGeo, dustMat);
      dust.frustumCulled = false;
      scene.add(dust);

      // ---- State
      const ins: Spring = { x: 0, v: 0 }; // 0 key out .. 1 key in
      const ang: Spring = { x: 0, v: 0 }; // 0 OFF .. 1 ON .. ~1.3 START
      const psi: Spring = { x: 0, v: 0 }; // charm swing, relative to the key
      const tagSw: Spring = { x: 0, v: 0 };
      const rev: Spring = { x: 0, v: 0 }; // revs, 0 .. 12k
      let mode: "idle" | "drag" | "auto" | "live" | "ride" = "idle";
      let autoT = 0;
      let ignT = -1; // seconds since the ignition came on
      let crankT = -1; // seconds of starter
      let cranking = false;
      let liveT = 0;
      let rideT = 0;
      let burstT = -1;
      let shake = 0;
      let hover = false;
      const point = { x: 0, y: 0, sx: 0, sy: 0 };
      const reduced = prefersReducedMotion();

      const origin = () => {
        const r = host.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      };
      const burst = () => {
        burstT = 0;
        for (let i = 0; i < SPARKS; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 2.4 + Math.random() * 5;
          sparkPos.set([Math.sin(a) * 1.25, Math.cos(a) * 1.25, 0.5], i * 3);
          sparkVel.set([Math.sin(a) * sp, Math.cos(a) * sp, 0.5 + Math.random() * 3], i * 3);
        }
      };
      const ignitionOn = () => {
        ignT = 0;
        navigator.vibrate?.(10);
      };
      const ignitionOff = () => {
        ignT = -1;
        crankT = -1;
        setCrank(false);
      };
      const setCrank = (on: boolean) => {
        if (on === cranking) return;
        cranking = on;
        if (on) {
          if (crankT < 0) crankT = 0;
          navigator.vibrate?.([25, 20, 25, 20, 25, 20, 25]);
        }
      };
      const caught = () => {
        setCrank(false);
        mode = "live";
        liveT = 0;
        burst();
        shake = 1.6;
        navigator.vibrate?.([30, 40, 80]);
        api.current.onStart?.();
      };
      const ride = () => {
        if (mode === "ride") return;
        mode = "ride";
        rideT = 0;
        api.current.onRide(origin());
      };

      api.current.turn = () => {
        if (mode === "live") return ride();
        if (mode !== "idle") return;
        if (reduced) return api.current.onRide(origin());
        mode = "auto";
        autoT = 0;
        navigator.vibrate?.(12);
      };

      const colorOff = new THREE.Color(0x171717);
      const zone = (i: number) => (i / SEGS >= 10 / 12 ? RED : i / SEGS >= 9 / 12 ? AMBER : LIME);
      const zoneCol = Array.from({ length: SEGS }, (_, i) => new THREE.Color(zone(i)));
      const lampOff = new THREE.Color(0x2a2a2a);
      const white = new THREE.Color(0xffffff);
      const tmp = new THREE.Color();
      const setLamp = (m: T.MeshBasicMaterial, on: boolean, c: number) => m.color.copy(on ? tmp.set(c) : lampOff);

      let lastStage: KeyStage = "idle";
      const update = (dt: number, t: number) => {
        // ---- The sequence
        if (mode === "auto") {
          autoT += dt;
          if (ignT >= SWEEP + 0.1 && crankT < 0) setCrank(true);
        }
        if (mode === "drag" && ignT >= 0) setCrank(ang.x > START_AT);
        if (ignT < 0 && ang.x > 0.95 && (mode === "auto" || mode === "drag")) ignitionOn();
        if (ignT >= 0) ignT += dt;
        if (cranking) {
          crankT += dt;
          if (crankT >= CRANK) caught();
        }
        if (mode === "live") {
          liveT += dt;
          if (liveT >= LIVE) ride();
        }
        if (mode === "ride") rideT += dt;

        const now: KeyStage =
          mode === "idle" ? "idle" : mode === "ride" ? "ride" : mode === "live" ? "live" : cranking ? "crank" : ignT >= 0 ? "on" : "in";
        if (now !== lastStage) {
          lastStage = now;
          api.current.onStage?.(now);
        }

        // ---- Key targets
        let insT = 1;
        let angT = 1;
        const tease = t % 4.8 < 0.9 ? Math.sin(((t % 4.8) / 0.9) * Math.PI) : 0;
        if (mode === "idle") {
          insT = (hover ? 0.22 : 0) + 0.3 * tease;
          angT = 0.05 * tease + Math.sin(t * 1.1) * 0.015;
        } else if (mode === "auto") {
          angT = autoT < 0.3 ? 0 : cranking ? 1.3 + Math.sin(t * 95) * 0.012 : 1;
        }
        spring(ins, insT, dt, 170, 17);
        if (mode === "drag") {
          // the angle follows the pointer
        } else if (cranking) {
          spring(ang, angT, dt, 420, 26);
        } else if (mode === "idle") {
          spring(ang, angT, dt, 110, 12); // snaps back to OFF if let go
          if (Math.abs(ang.x - angT) < 0.003 && Math.abs(ang.v) < 0.02) ang.x = angT;
        } else {
          spring(ang, angT, dt, 150, 11); // START springs back to ON, as on a real switch
        }

        const rz = -ang.x * TURN;
        spin.rotation.z = rz;
        plug.rotation.z = rz * Math.min(1, ins.x * 1.5);
        spring(psi, -rz, dt, 70, 3.2);
        charm.rotation.z = psi.x;
        spring(tagSw, psi.x * 0.6, dt, 120, 4);
        tag.rotation.z = tagSw.x - psi.x;
        const engine = mode === "live" || mode === "ride";
        const idleShake = engine ? Math.sin(t * 74) * 0.006 : 0;
        keyG.position.set(idleShake * 2, Math.sin(t * 1.6) * 0.03 * (1 - ins.x), 0.34 + 1.15 * (1 - ins.x));
        keyG.rotation.set((1 - ins.x) * 0.22, (mode === "idle" ? Math.sin(t * 0.9) * 0.1 : 0) * (1 - ins.x), 0);

        point.x += (point.sx - point.x) * Math.min(1, dt * 6);
        point.y += (point.sy - point.y) * Math.min(1, dt * 6);
        const rideP = mode === "ride" ? Math.min(1, rideT / 0.75) : 0;
        cluster.rotation.set(-point.y * 0.16 * (1 - rideP), point.x * 0.22 * (1 - rideP), -rideP * rideP * 0.5);
        cluster.position.set(idleShake, Math.sin(t * 1.3) * 0.04 * (mode === "idle" ? 1 : 0) + idleShake * 0.6, 0);

        // ---- Revs: the bulb-check sweep at ON, the starter's flicker, the catch's blip, the idle, the launch
        const sweep = ignT >= 0 && ignT < SWEEP && !cranking && !engine;
        if (sweep) {
          rev.x = Math.sin((ignT / SWEEP) * Math.PI) ** 0.7;
          rev.v = 0;
        } else {
          const target =
            mode === "ride" ? 0.82 : mode === "live" ? (liveT < 0.16 ? 0.62 : 0.11 + Math.sin(t * 9) * 0.004) : cranking ? 0.025 + Math.random() * 0.02 : 0;
          spring(rev, target, dt, mode === "ride" ? 40 : 110, 14);
        }
        rev.x = Math.max(0, Math.min(1, rev.x));

        const lit = rev.x * SEGS;
        const head = (t * 22) % (SEGS + 30);
        for (let i = 0; i < SEGS; i++) {
          if (i < lit) {
            tmp.copy(zoneCol[i]);
            if (i > lit - 1.5) tmp.lerp(white, 0.5);
          } else {
            tmp.copy(colorOff).lerp(zoneCol[i], 0.05);
            if (mode === "idle") {
              const d = head - i;
              if (d >= 0 && d < 9) tmp.lerp(zoneCol[i], (1 - d / 9) * 0.85);
            }
          }
          segs.setColorAt(i, tmp);
        }
        if (segs.instanceColor) segs.instanceColor.needsUpdate = true;
        const tipA = -ARC + rev.x * ARC * 2;
        const [fxp, fyp] = polar(tipA, (R_IN + R_OUT) / 2);
        flare.position.set(fxp, fyp, 0.07);
        flareMat.opacity = rev.x > 0.01 ? 0.5 + rev.x * 0.5 : 0;
        flareMat.color.set(rev.x > 10 / 12 ? RED : rev.x > 9 / 12 ? AMBER : LIME);

        // Lamps: all on for the bulb check; neutral stays on; oil until the engine catches
        const on = ignT >= 0;
        setLamp(lampN, on && mode !== "ride", LIME);
        setLamp(lampOil, on && !engine, RED);
        setLamp(lampFi, on && ignT < SWEEP + 0.1, AMBER);

        const glow = engine ? 1 : on ? 0.45 : 0;
        auraMat.opacity += ((glow * 0.75 + (mode === "idle" ? 0.08 + tease * 0.12 : 0)) - auraMat.opacity) * Math.min(1, dt * 5);
        aura.scale.setScalar(1 + Math.sin(t * (engine ? 10 : 2)) * (engine ? 0.015 : 0.02));
        limeLight.intensity = glow * 12;
        limeMat.emissiveIntensity = 0.12 + glow * 0.8;

        // ---- Burst
        if (burstT >= 0) {
          burstT += dt;
          const w = Math.min(1, burstT / 0.7);
          wave.scale.setScalar(0.6 + w * 3.6);
          waveMat.opacity = (1 - w) * 0.9;
          const w2 = Math.min(1, Math.max(0, (burstT - 0.12) / 0.7));
          wave2.scale.setScalar(0.6 + w2 * 3.6);
          wave2Mat.opacity = w2 > 0 ? (1 - w2) * 0.7 : 0;
          for (let i = 0; i < SPARKS; i++) {
            sparkVel[i * 3 + 1] -= 5 * dt;
            for (let k = 0; k < 3; k++) sparkPos[i * 3 + k] += sparkVel[i * 3 + k] * dt;
          }
          sparkGeo.attributes.position.needsUpdate = true;
          sparkMat.opacity = Math.max(0, 1 - burstT * 1.1);
          if (burstT > 1) {
            burstT = -1;
            sparkMat.opacity = waveMat.opacity = wave2Mat.opacity = 0;
          }
        }

        // Dust drifts slowly round the pod; it streaks outward on the launch
        for (let i = 0; i < DUST; i++) {
          const [a0, r0, z0, s] = dustSeed[i];
          const a = a0 + t * s * 0.15;
          const r = r0 + Math.sin(t * s + i) * 0.1 + rideP * rideP * 4;
          dustPos.set([Math.sin(a) * r, Math.cos(a) * r, z0 + rideP * 3], i * 3);
        }
        dustGeo.attributes.position.needsUpdate = true;
        dustMat.opacity = 0.35 + glow * 0.4;

        // ---- Camera: a shudder while cranking, a dive into the pod on the launch
        shake = Math.max(cranking ? 1 : 0, shake - dt * 3);
        const s = shake * 0.05;
        const dive = rideP * rideP * rideP;
        camera.position.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, CAM_Z - dive * 8.8);
        camera.lookAt(0, 0, 0);
      };

      // ---- Input: tap to run it, or grab the key and turn it
      let down: { id: number; x: number; y: number; a0: number; moved: boolean; rotary: boolean } | null = null;
      const rotAngle = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2)));
      };
      const onDown = (e: PointerEvent) => {
        if (mode === "live") return ride();
        if (mode !== "idle") return;
        const r = host.getBoundingClientRect();
        const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        down = { id: e.pointerId, x: e.clientX, y: e.clientY, a0: rotAngle(e), moved: false, rotary: dist > r.width * 0.08 };
        host.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        point.sx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
        point.sy = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
        if (!down || e.pointerId !== down.id) return;
        if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10 && down.rotary && !reduced) {
          down.moved = true;
          mode = "drag";
          navigator.vibrate?.(8);
        }
        if (mode === "drag") {
          let d = rotAngle(e) - down.a0;
          if (d < -Math.PI) d += Math.PI * 2;
          if (d > Math.PI) d -= Math.PI * 2;
          const next = Math.max(0, Math.min(1.3, d / TURN));
          ang.v = (next - ang.x) / 0.016;
          ang.x = next;
          if (ang.x < 0.6 && ignT >= 0) ignitionOff();
        }
      };
      const onUp = (e: PointerEvent) => {
        if (!down || e.pointerId !== down.id) return;
        const wasDrag = mode === "drag";
        down = null;
        if (!wasDrag) return api.current.turn();
        // Let go at ON or past it and the bike carries on by itself; short of ON the key springs back out
        if (ang.x >= 0.6) {
          mode = "auto";
          autoT = 1;
          if (crankT >= 0) setCrank(true);
        } else {
          ignitionOff();
          mode = "idle";
        }
      };
      const onCancel = () => {
        down = null;
        if (mode === "drag") {
          ignitionOff();
          mode = "idle";
        }
      };
      const onEnter = (e: PointerEvent) => {
        if (e.pointerType === "mouse") hover = true;
      };
      const onLeave = () => {
        hover = false;
        point.sx = point.sy = 0;
      };
      host.addEventListener("pointerdown", onDown);
      host.addEventListener("pointermove", onMove);
      host.addEventListener("pointerup", onUp);
      host.addEventListener("pointercancel", onCancel);
      host.addEventListener("pointerenter", onEnter);
      host.addEventListener("pointerleave", onLeave);

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.fov = w >= h ? 30 : (2 * Math.atan(Math.tan((15 * Math.PI) / 180) / camera.aspect) * 180) / Math.PI;
        camera.updateProjectionMatrix();
        if (reduced) draw();
      };
      const draw = () => {
        update(0.016, 0);
        renderer.render(scene, camera);
      };
      const ro = new ResizeObserver(resize);
      ro.observe(host);
      resize();
      api.current.onReady(true);

      let last = performance.now();
      let elapsed = 0;
      let raf = 0;
      const frame = () => {
        const now = performance.now();
        const dt = Math.min((now - last) / 1000, 0.033);
        last = now;
        elapsed += dt;
        update(dt, elapsed);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      if (reduced) draw();
      else raf = requestAnimationFrame(frame);

      const onVisibility = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden && !reduced) {
          last = performance.now();
          raf = requestAnimationFrame(frame);
        }
      };
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        cancelAnimationFrame(raf);
        document.removeEventListener("visibilitychange", onVisibility);
        host.removeEventListener("pointerdown", onDown);
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerup", onUp);
        host.removeEventListener("pointercancel", onCancel);
        host.removeEventListener("pointerenter", onEnter);
        host.removeEventListener("pointerleave", onLeave);
        ro.disconnect();
        geos.forEach((g) => g.dispose());
        mats.forEach((m) => m.dispose());
        segs.dispose();
        knurl.dispose();
        pmrem.dispose();
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className={className} style={{ touchAction: "none" }} />;
}
