"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import type * as T from "three";
import { prefersReducedMotion } from "@/lib/utils";

export type IgnitionKeyHandle = {
  /** Run the whole insert, turn and crank sequence, as if the rider had tapped the key. */
  turn: () => void;
};

/** Where the rider is in the sequence: key out, sliding in, turned to ON, cranking, engine caught. */
export type KeyStage = "idle" | "in" | "on" | "crank" | "live";

type Props = {
  /** The engine has caught: the key is at ON, the burst is going off. */
  onStart: () => void;
  /** The sequence moved on (for a caption that follows along). */
  onStage?: (stage: KeyStage) => void;
  /** three.js and WebGL are up (true) or unavailable (false). */
  onReady: (ok: boolean) => void;
  ref?: Ref<IgnitionKeyHandle>;
  className?: string;
};

const LIME = 0xcedb28;
const TURN = Math.PI / 2; // OFF to ON is a quarter turn, clockwise
const LEDS = 48;

type Spring = { x: number; v: number };
const spring = (s: Spring, target: number, dt: number, k: number, c: number) => {
  s.v += ((target - s.x) * k - s.v * c) * dt;
  s.x += s.v * dt;
};

/**
 * The cover's START control as a 3D motorcycle ignition: a chrome barrel with a ring of LEDs and a
 * black-and-lime key on a charm. It idles with a little tease (the key nudges in and out) and tilts
 * toward the pointer. Tap it, or grab the key and turn it: it slides in, turns to ON (the LED ring
 * fills), cranks to START with a shudder, then lets go in a shockwave and a spray of sparks.
 * Same colours as the rest of the form. three.js is loaded on mount; with reduced motion it renders
 * once and a tap fires onStart straight away.
 */
export default function IgnitionKey3D({ onStart, onReady, onStage, ref, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const api = useRef({ turn: () => {}, onStart, onReady, onStage });

  useEffect(() => {
    api.current.onStart = onStart;
    api.current.onReady = onReady;
    api.current.onStage = onStage;
  }, [onStart, onReady, onStage]);

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
      const CAM_Z = 7.2;
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 1;
      scene.add(new THREE.AmbientLight(0xffffff, 0.5));
      const keyLight = new THREE.DirectionalLight(0xffffff, 2);
      keyLight.position.set(-3, 4, 6);
      scene.add(keyLight);
      const rim = new THREE.PointLight(0xff0000, 6, 9);
      rim.position.set(3, -2, 2);
      scene.add(rim);
      const limeLight = new THREE.PointLight(LIME, 0, 8);
      limeLight.position.set(0, 0, 2.2);
      scene.add(limeLight);

      const chrome = new THREE.MeshStandardMaterial({ color: 0xd0d4dc, metalness: 1, roughness: 0.18 });
      const dark = new THREE.MeshStandardMaterial({ color: 0x141414, metalness: 0.6, roughness: 0.35 });
      const rubber = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, metalness: 0.15, roughness: 0.55 });
      const limeMat = new THREE.MeshStandardMaterial({ color: LIME, emissive: LIME, emissiveIntensity: 0.35, metalness: 0.2, roughness: 0.4 });
      const geos: { dispose: () => void }[] = [];
      const mats: { dispose: () => void }[] = [chrome, dark, rubber, limeMat];
      const add = (g: T.BufferGeometry, m: T.Material, parent: T.Object3D, x = 0, y = 0, z = 0) => {
        geos.push(g);
        const o = new THREE.Mesh(g, m);
        o.position.set(x, y, z);
        parent.add(o);
        return o;
      };

      // Soft lime halo behind the barrel that brightens as the key turns
      const haloCanvas = document.createElement("canvas");
      haloCanvas.width = haloCanvas.height = 128;
      const hc = haloCanvas.getContext("2d")!;
      const grad = hc.createRadialGradient(64, 64, 8, 64, 64, 64);
      grad.addColorStop(0, "rgba(206,219,40,.9)");
      grad.addColorStop(0.5, "rgba(206,219,40,.28)");
      grad.addColorStop(1, "rgba(206,219,40,0)");
      hc.fillStyle = grad;
      hc.fillRect(0, 0, 128, 128);
      const haloTex = new THREE.CanvasTexture(haloCanvas);
      const haloMat = new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0.15, depthWrite: false });
      mats.push(haloMat, haloTex);
      const halo = add(new THREE.PlaneGeometry(4.6, 4.6), haloMat, scene, 0, 0, -1);

      // ---- The barrel
      const barrel = new THREE.Group();
      scene.add(barrel);
      const housing = add(new THREE.CylinderGeometry(1.5, 1.5, 0.9, 64), dark, barrel, 0, 0, -0.45);
      housing.rotation.x = Math.PI / 2;
      const bezel = add(new THREE.TorusGeometry(1.46, 0.075, 20, 96), chrome, barrel, 0, 0, 0.02);
      const cap = add(new THREE.CylinderGeometry(0.95, 0.95, 0.08, 64), chrome, barrel, 0, 0, 0.03);
      cap.rotation.x = Math.PI / 2;
      add(new THREE.TorusGeometry(1.0, 0.03, 12, 64), dark, barrel, 0, 0, 0.07);
      const slot = add(new THREE.BoxGeometry(0.17, 0.3, 0.03), new THREE.MeshBasicMaterial({ color: 0x000000 }), barrel, 0, 0, 0.075);
      void bezel;

      // LED ring: a chase while idle, a progress arc while the key turns
      const ledGeo = new THREE.BoxGeometry(0.07, 0.17, 0.05);
      const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      geos.push(ledGeo);
      mats.push(ledMat);
      const leds = new THREE.InstancedMesh(ledGeo, ledMat, LEDS);
      const m4 = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      for (let i = 0; i < LEDS; i++) {
        const a = (i / LEDS) * Math.PI * 2;
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -a);
        m4.compose(new THREE.Vector3(Math.sin(a) * 1.23, Math.cos(a) * 1.23, 0.04), q, new THREE.Vector3(1, 1, 1));
        leds.setMatrixAt(i, m4);
        leds.setColorAt(i, new THREE.Color(0x3a3a3a));
      }
      barrel.add(leds);

      // ---- The key
      const tilt = new THREE.Group(); // slides in and out, tilts toward the pointer
      const spin = new THREE.Group(); // turns about the barrel axis
      tilt.add(spin);
      scene.add(tilt);

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
      const head = add(new THREE.ExtrudeGeometry(bow(0), { depth: 0.16, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3, curveSegments: 24 }), rubber, spin, 0, 0, 0.2);
      const inset = add(new THREE.ExtrudeGeometry(bow(0.09), { depth: 0.04, bevelEnabled: false, curveSegments: 24 }), limeMat, spin, 0, 0, 0.4);
      void head;
      void inset;
      // Blade with cut teeth
      add(new THREE.BoxGeometry(0.2, 0.36, 0.95), chrome, spin, 0, 0, -0.27);
      for (let i = 0; i < 4; i++) add(new THREE.BoxGeometry(0.12, 0.08, 0.1), chrome, spin, 0, i % 2 ? 0.2 : -0.2, -0.55 - i * 0.04 + i * 0.06 - 0.05);
      // Rider's mark on the bow: a chevron arrow pointing at where the key turns to
      const mark = new THREE.Shape();
      mark.moveTo(0, 1.0);
      mark.lineTo(0.17, 0.62);
      mark.lineTo(0, 0.7);
      mark.lineTo(-0.17, 0.62);
      mark.closePath();
      add(new THREE.ExtrudeGeometry(mark, { depth: 0.03, bevelEnabled: false }), new THREE.MeshBasicMaterial({ color: 0x000000 }), spin, 0, 0, 0.445);
      mats.push(limeMat);

      // Keyring and a swinging charm
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

      // ---- Effects: a shockwave ring and a spray of sparks
      const waveMat = new THREE.MeshBasicMaterial({ color: LIME, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
      mats.push(waveMat);
      const wave = add(new THREE.RingGeometry(0.97, 1.0, 96), waveMat, scene, 0, 0, 0.1);
      wave.scale.setScalar(0.01);
      const wave2Mat = waveMat.clone();
      mats.push(wave2Mat);
      const wave2 = add(new THREE.RingGeometry(0.97, 1.0, 96), wave2Mat, scene, 0, 0, 0.1);
      wave2Mat.color.set(0xff0000);
      wave2.scale.setScalar(0.01);

      const SPARKS = 90;
      const sparkPos = new Float32Array(SPARKS * 3);
      const sparkCol = new Float32Array(SPARKS * 3);
      const sparkVel = new Float32Array(SPARKS * 3);
      const palette = [0xcedb28, 0xcedb28, 0xff0000, 0xffa500, 0x111111].map((c) => new THREE.Color(c));
      for (let i = 0; i < SPARKS; i++) {
        const c = palette[i % palette.length];
        sparkCol.set([c.r, c.g, c.b], i * 3);
      }
      const sparkGeo = new THREE.BufferGeometry();
      sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
      sparkGeo.setAttribute("color", new THREE.BufferAttribute(sparkCol, 3));
      const sparkMat = new THREE.PointsMaterial({ size: 0.11, vertexColors: true, transparent: true, opacity: 0, depthWrite: false });
      geos.push(sparkGeo);
      mats.push(sparkMat);
      const sparks = new THREE.Points(sparkGeo, sparkMat);
      sparks.frustumCulled = false;
      scene.add(sparks);

      // ---- State
      const ins: Spring = { x: 0, v: 0 }; // 0 key out .. 1 key in
      const ang: Spring = { x: 0, v: 0 }; // 0 OFF .. 1 ON .. ~1.3 START
      const psi: Spring = { x: 0, v: 0 }; // charm swing, relative to the key
      let mode: "idle" | "drag" | "auto" | "done" = "idle";
      let autoT = 0;
      let stage = 0; // 0 insert, 1 turn, 2 crank, 3 released
      let burstT = -1;
      let shake = 0;
      let hover = false;
      const point = { x: 0, y: 0, sx: 0, sy: 0 };
      const reduced = prefersReducedMotion();

      const burst = () => {
        burstT = 0;
        for (let i = 0; i < SPARKS; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 2.2 + Math.random() * 4.5;
          sparkPos.set([Math.sin(a) * 1.25, Math.cos(a) * 1.25, 0.3], i * 3);
          sparkVel.set([Math.sin(a) * sp, Math.cos(a) * sp, 0.5 + Math.random() * 2.5], i * 3);
        }
        navigator.vibrate?.([30, 40, 80]);
      };

      api.current.turn = () => {
        if (mode !== "idle") return;
        if (reduced) {
          mode = "done";
          api.current.onStart();
          return;
        }
        mode = "auto";
        autoT = 0;
        stage = 0;
        navigator.vibrate?.(12);
      };

      const colorOff = new THREE.Color(0x3a3a3a);
      const colorLime = new THREE.Color(LIME);
      const colorRed = new THREE.Color(0xff0000);
      const tmp = new THREE.Color();

      let lastStage: KeyStage = "idle";
      const update = (dt: number, t: number) => {
        const now: KeyStage = mode === "idle" ? "idle" : mode === "done" ? "live" : mode === "drag" ? (ang.x > 0.9 ? "crank" : "on") : stage === 0 ? "in" : stage === 1 ? "on" : "crank";
        if (now !== lastStage) {
          lastStage = now;
          api.current.onStage?.(now);
        }
        // Sequence
        if (mode === "auto") {
          autoT += dt;
          if (stage === 0 && autoT > 0.34) stage = 1;
          if (stage === 1 && autoT > 0.9) {
            stage = 2;
            shake = 1;
            navigator.vibrate?.([25, 20, 25, 20, 25]);
          }
          if (stage === 2 && autoT > 1.2) {
            stage = 3;
            burst();
            shake = 1.6;
            mode = "done";
            api.current.onStart();
          }
        }

        // Targets
        let insT = 0;
        let angT = 0;
        const tease = t % 4.8 < 0.9 ? Math.sin(((t % 4.8) / 0.9) * Math.PI) : 0;
        if (mode === "idle") {
          insT = (hover ? 0.22 : 0) + 0.3 * tease;
          angT = 0.05 * tease + Math.sin(t * 1.1) * 0.015;
        } else if (mode === "drag") {
          insT = 1;
        } else {
          insT = 1;
          angT = stage >= 3 ? 1 : stage === 2 ? 1.3 + Math.sin(autoT * 95) * 0.012 : stage === 1 ? 1 : 0;
        }
        spring(ins, insT, dt, 170, 17);
        if (mode === "drag") {
          // angle is set by the pointer; keep velocity for the charm's sake
        } else if (mode === "idle" && ang.x > 0.01) {
          spring(ang, angT, dt, 110, 12); // snaps back to OFF if let go
        } else if (stage === 2 && mode === "auto") {
          spring(ang, angT, dt, 420, 26);
        } else {
          spring(ang, angT, dt, 150, 11);
        }
        if (mode === "idle" && Math.abs(ang.x - angT) < 0.003 && Math.abs(ang.v) < 0.02) ang.x = angT;

        const rz = -ang.x * TURN;
        spin.rotation.z = rz;
        slot.rotation.z = rz * Math.min(1, ins.x * 1.5); // the cylinder turns with the key once it is in
        spring(psi, -rz, dt, 70, 3.2);
        charm.rotation.z = psi.x;
        // Out: key hovers well in front of the barrel. In: head sits just proud of the face.
        tilt.position.set(0, Math.sin(t * 1.6) * 0.03 * (1 - ins.x), 1.15 * (1 - ins.x) + (mode === "done" ? 0.05 * Math.sin(t * 40) * Math.max(0, 1 - burstT) : 0));
        point.x += (point.sx - point.x) * Math.min(1, dt * 6);
        point.y += (point.sy - point.y) * Math.min(1, dt * 6);
        const idleSway = mode === "idle" ? Math.sin(t * 0.9) * 0.1 : 0;
        tilt.rotation.set(-point.y * 0.18 + (1 - ins.x) * 0.22, point.x * 0.3 + idleSway * (1 - ins.x), 0);
        barrel.rotation.set(-point.y * 0.12, point.x * 0.16, 0);
        leds.rotation.copy(barrel.rotation);
        bezel.rotation.copy(barrel.rotation);

        // LEDs
        const lit = ang.x * TURN;
        const chase = Math.floor(t * 12) % LEDS;
        for (let i = 0; i < LEDS; i++) {
          const a = (i / LEDS) * Math.PI * 2;
          const on = ang.x > 0.03 && a <= lit + 0.04;
          if (on) tmp.copy(a > TURN + 0.05 ? colorRed : colorLime);
          else tmp.copy(colorOff);
          if (!on && mode === "idle" && ang.x < 0.03) {
            const d = (chase - i + LEDS) % LEDS;
            if (d < 6) tmp.lerp(colorLime, (1 - d / 6) * 0.9);
          }
          if (mode === "done") tmp.lerp(colorLime, 0.5 + 0.5 * Math.sin(t * 8 - i * 0.3));
          leds.setColorAt(i, tmp);
        }
        if (leds.instanceColor) leds.instanceColor.needsUpdate = true;

        const glow = Math.min(1, Math.max(0, ang.x)) * 0.6 + (mode === "done" ? 0.4 : 0);
        haloMat.opacity = 0.14 + glow * 0.55;
        halo.scale.setScalar(1 + glow * 0.2 + Math.sin(t * 2) * 0.02);
        limeLight.intensity = glow * 14;
        limeMat.emissiveIntensity = 0.3 + glow * 0.9;

        // Burst
        if (burstT >= 0) {
          burstT += dt;
          const life = burstT / 1;
          const w = Math.min(1, burstT / 0.7);
          wave.scale.setScalar(0.5 + w * 3.4);
          waveMat.opacity = (1 - w) * 0.9;
          const w2 = Math.min(1, Math.max(0, (burstT - 0.12) / 0.7));
          wave2.scale.setScalar(0.5 + w2 * 3.4);
          wave2Mat.opacity = w2 > 0 ? (1 - w2) * 0.7 : 0;
          for (let i = 0; i < SPARKS; i++) {
            sparkVel[i * 3 + 1] -= 4 * dt;
            for (let k = 0; k < 3; k++) sparkPos[i * 3 + k] += sparkVel[i * 3 + k] * dt;
          }
          sparkGeo.attributes.position.needsUpdate = true;
          sparkMat.opacity = Math.max(0, 1 - life * 1.1);
          if (life > 1) {
            burstT = -1;
            sparkMat.opacity = 0;
            waveMat.opacity = wave2Mat.opacity = 0;
          }
        }

        // Camera, with a shudder while cranking
        shake = Math.max(0, shake - dt * (stage === 2 ? 0 : 3));
        const s = shake * 0.05;
        camera.position.set((Math.random() - 0.5) * s, (Math.random() - 0.5) * s, CAM_Z);
        camera.lookAt(0, 0, 0);
      };

      // ---- Input: tap to run it, or grab the key and turn it
      let down: { id: number; x: number; y: number; t: number; a0: number; moved: boolean; rotary: boolean } | null = null;
      const rotAngle = (e: PointerEvent) => {
        const r = host.getBoundingClientRect();
        return Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2)));
      };
      const onDown = (e: PointerEvent) => {
        if (mode !== "idle") return;
        const r = host.getBoundingClientRect();
        const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        down = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), a0: rotAngle(e), moved: false, rotary: dist > r.width * 0.12 };
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
        }
      };
      const onUp = (e: PointerEvent) => {
        if (!down || e.pointerId !== down.id) return;
        const wasDrag = mode === "drag";
        down = null;
        if (wasDrag) {
          if (ang.x >= 0.6) {
            mode = "auto";
            stage = 1;
            autoT = 0.34;
          } else {
            mode = "idle";
          }
        } else {
          api.current.turn();
        }
      };
      const onCancel = () => {
        down = null;
        if (mode === "drag") mode = "idle";
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
        leds.dispose();
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
