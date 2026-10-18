"use client";

import { useEffect, useRef } from "react";
import type * as T from "three";
import type { BikePart } from "@/lib/question-visuals";
import { cn, prefersReducedMotion } from "@/lib/utils";

export type PinState = "ok" | "flagged" | "unanswered";
export type BikePin = { key: string; number: number; label: string; part: BikePart; state: PinState };

type Props = {
  pins: BikePin[];
  activeKey?: string | null;
  onSelect?: (key: string) => void;
  className?: string;
};

/**
 * Where each part sits on the bike (bike space: +X front, +Z the rider's right side, which faces
 * the camera at rest) and the turntable angle that best shows it.
 */
const ANCHORS: Record<BikePart, { pos: [number, number, number]; yaw: number }> = {
  "tyre-front": { pos: [0.98, 0.4, 0.12], yaw: -0.45 },
  "tyre-rear": { pos: [-0.95, 0.4, 0.12], yaw: 0.45 },
  speedometer: { pos: [0.6, 1.36, 0], yaw: 1.15 },
  fuel: { pos: [0.28, 1.2, 0.04], yaw: 0.55 },
  mirror: { pos: [0.5, 1.5, 0.42], yaw: -0.5 },
  brakes: { pos: [0.98, 0.5, 0.1], yaw: -0.7 },
  horn: { pos: [0.9, 0.8, 0], yaw: -1.2 },
  starter: { pos: [0.56, 1.22, 0.36], yaw: 0.35 },
  key: { pos: [0.5, 1.02, 0.2], yaw: -0.25 },
  seat: { pos: [-0.5, 0.96, 0], yaw: 0.55 },
  stands: { pos: [-0.15, 0.16, 0.22], yaw: 0.1 },
  plate: { pos: [-1.4, 0.62, 0], yaw: 1.5 },
};

/** Resting pins are small status dots; the active one grows into a numbered marker. */
const PIN_STYLES: Record<PinState, string> = {
  unanswered: "bg-white ring-black",
  ok: "bg-neon ring-black",
  flagged: "bg-brake ring-white shadow-[0_0_14px_rgba(255,0,0,.95)]",
};

/**
 * The 3D walkaround for the Vehicle Assessment: a procedurally built motorcycle in the form's own
 * black and lime on a turntable. Every vehicle question is a numbered pin on its part; the bike
 * turns to face the active question and that part demonstrates itself (the wheel spins, the mirror
 * glows, the horn rings, the needle sweeps…). Drag to spin. three.js is loaded on mount; the
 * question list works without it.
 */
export default function WalkaroundBike({ pins, activeKey, onSelect, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const pinEls = useRef(new Map<string, HTMLButtonElement>());
  const live = useRef({ pins, activeKey, redraw: () => {} });

  useEffect(() => {
    Object.assign(live.current, { pins, activeKey });
    live.current.redraw();
  }, [pins, activeKey]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    Promise.all([import("three"), import("three/examples/jsm/environments/RoomEnvironment.js")]).then(([THREE, { RoomEnvironment }]) => {
      if (disposed) return;
      let renderer: T.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.className = "absolute inset-0 h-full w-full touch-pan-y";
      host.prepend(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
      camera.position.set(0, 2, 6.5);
      camera.lookAt(0, 0.7, 0);

      // Soft studio reflections so the chrome and the black paint read as metal, not flat black
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.9;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3a2a, 1.6));
      const fill = new THREE.DirectionalLight(0xffffff, 1.6);
      fill.position.set(-2, 3, 8);
      scene.add(fill);
      const key = new THREE.DirectionalLight(0xffffff, 3);
      key.position.set(4, 6, 6);
      scene.add(key);
      const red = new THREE.PointLight(0xff0000, 10, 8);
      red.position.set(3, 1.2, 2.5);
      scene.add(red);
      const lime = new THREE.PointLight(0xcedb28, 12, 9);
      lime.position.set(-3, 2, 2);
      scene.add(lime);

      const disposables: { dispose: () => void }[] = [];
      const std = (p: T.MeshStandardMaterialParameters) => {
        const m = new THREE.MeshStandardMaterial(p);
        disposables.push(m);
        return m;
      };
      const mesh = (g: T.BufferGeometry, m: T.Material, x = 0, y = 0, z = 0) => {
        disposables.push(g);
        const o = new THREE.Mesh(g, m);
        o.position.set(x, y, z);
        return o;
      };
      const box = (w: number, h: number, d: number, m: T.Material, x: number, y: number, z: number) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z);
      const cyl = (rt: number, rb: number, h: number, m: T.Material, x: number, y: number, z: number, axis: "x" | "y" | "z" = "y") => {
        const o = mesh(new THREE.CylinderGeometry(rt, rb, h, 20), m, x, y, z);
        if (axis === "x") o.rotation.z = Math.PI / 2;
        if (axis === "z") o.rotation.x = Math.PI / 2;
        return o;
      };
      /** A round bar between two points. */
      const tube = (a: [number, number, number], b: [number, number, number], r: number, m: T.Material) => {
        const va = new THREE.Vector3(...a);
        const vb = new THREE.Vector3(...b);
        const dir = vb.clone().sub(va);
        const o = mesh(new THREE.CylinderGeometry(r, r, dir.length(), 10), m);
        o.position.copy(va).add(vb).multiplyScalar(0.5);
        o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
        return o;
      };

      const paint = std({ color: 0x161616, metalness: 0.6, roughness: 0.28 });
      const frameMat = std({ color: 0x232323, metalness: 0.5, roughness: 0.45 });
      const engineMat = std({ color: 0x3a3a3a, metalness: 0.55, roughness: 0.4 });
      const chrome = std({ color: 0xc4c8d0, metalness: 0.92, roughness: 0.18 });
      const rubber = std({ color: 0x0f0f10, roughness: 0.9 });
      const seatMat = std({ color: 0x141414, roughness: 0.8 });
      const limeMat = std({ color: 0xcedb28, emissive: 0xcedb28, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.4 });
      const tailMat = std({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
      const amber = std({ color: 0xffa500, emissive: 0xffa500, emissiveIntensity: 0.3 });
      const plateMat = std({ color: 0xf6f6f0, emissive: 0xcedb28, emissiveIntensity: 0, roughness: 0.5 });
      const lensMat = std({ color: 0xfffff0, emissive: 0xfffbd0, emissiveIntensity: 0.9 });
      const dialMat = std({ color: 0x111111, emissive: 0xcedb28, emissiveIntensity: 0.25, roughness: 0.4 });
      const mirrorMat = std({ color: 0x6a6f78, emissive: 0xcedb28, emissiveIntensity: 0, metalness: 0.9, roughness: 0.15 });
      const hornMat = std({ color: 0xc4c8d0, emissive: 0xcedb28, emissiveIntensity: 0, metalness: 0.9, roughness: 0.2 });
      const caliperMat = std({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.25, metalness: 0.5, roughness: 0.4 });
      const standMat = std({ color: 0x222222, emissive: 0xcedb28, emissiveIntensity: 0, metalness: 0.6, roughness: 0.4 });
      const buttonMat = std({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.2 });
      const engineGlow = std({ color: 0x3a3a3a, emissive: 0xcedb28, emissiveIntensity: 0, metalness: 0.5, roughness: 0.45 });
      const stitch = std({ color: 0xcedb28, emissive: 0xcedb28, emissiveIntensity: 0.3 });
      const capMat = std({ color: 0xc4c8d0, emissive: 0xcedb28, emissiveIntensity: 0, metalness: 0.9, roughness: 0.2 });

      const bike = new THREE.Group();

      // ---- wheels: tyre, rim, spokes, hub (the wheel lies in the X-Y plane)
      const wheels: T.Group[] = [];
      const makeWheel = (x: number) => {
        const w = new THREE.Group();
        w.position.set(x, 0.4, 0);
        w.add(mesh(new THREE.TorusGeometry(0.34, 0.075, 14, 48), rubber));
        w.add(mesh(new THREE.TorusGeometry(0.27, 0.016, 8, 48), chrome));
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const z = i % 2 ? 0.025 : -0.025;
          w.add(tube([Math.cos(a) * 0.06, Math.sin(a) * 0.06, z], [Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0], 0.006, chrome));
        }
        w.add(cyl(0.06, 0.06, 0.16, chrome, 0, 0, 0, "z"));
        wheels.push(w);
        bike.add(w);
        return w;
      };
      const wheelFront = makeWheel(0.95);
      const wheelRear = makeWheel(-0.95);
      // Front disc with a red caliper; rear drum
      const disc = mesh(new THREE.RingGeometry(0.1, 0.19, 36), std({ color: 0x777b84, metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }), 0, 0, 0.065);
      wheelFront.add(disc);
      const caliper = box(0.1, 0.12, 0.05, caliperMat, 0.2, 0.12, 0.075);
      bike.add(caliper);
      caliper.position.set(0.95 + 0.17, 0.4 + 0.12, 0.075);
      wheelRear.add(cyl(0.16, 0.16, 0.14, engineMat, 0, 0, 0, "z"));

      // ---- front end: fork, steering head, handlebar, mirrors, headlight, pod
      for (const z of [-0.12, 0.12]) {
        bike.add(tube([0.95, 0.4, z], [0.78, 0.8, z], 0.028, chrome));
        bike.add(tube([0.78, 0.8, z], [0.6, 1.14, z], 0.034, frameMat));
      }
      bike.add(box(0.1, 0.05, 0.34, frameMat, 0.62, 1.12, 0)); // triple clamp
      bike.add(cyl(0.05, 0.05, 0.24, frameMat, 0.58, 1.08, 0)); // steering head
      // Handlebar with upswept ends
      const barPath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.52, 1.28, -0.46),
        new THREE.Vector3(0.56, 1.22, -0.3),
        new THREE.Vector3(0.6, 1.2, 0),
        new THREE.Vector3(0.56, 1.22, 0.3),
        new THREE.Vector3(0.52, 1.28, 0.46),
      ]);
      bike.add(mesh(new THREE.TubeGeometry(barPath, 24, 0.022, 8), chrome));
      const mirrors: T.Mesh[] = [];
      for (const s of [-1, 1]) {
        bike.add(cyl(0.032, 0.032, 0.3, rubber, 0.52, 1.28, s * 0.46, "z")); // grip
        bike.add(box(0.02, 0.02, 0.2, chrome, 0.62, 1.2, s * 0.4).rotateY(s * 0.18)); // lever
        // mirror: stalk, rim and glass
        bike.add(tube([0.5, 1.3, s * 0.5], [0.44, 1.52, s * 0.42], 0.011, chrome));
        const m = mesh(new THREE.CircleGeometry(0.1, 28), mirrorMat, 0.44, 1.56, s * 0.42);
        m.rotation.y = -Math.PI / 2 + s * 0.15;
        m.scale.set(1, 1.25, 1);
        mirrors.push(m);
        bike.add(m);
        const rim = mesh(new THREE.RingGeometry(0.1, 0.118, 28), limeMat, 0.443, 1.56, s * 0.42);
        rim.rotation.y = -Math.PI / 2 + s * 0.15;
        rim.scale.set(1, 1.25, 1);
        bike.add(rim);
      }
      // start button (right switch cube) and ignition key
      bike.add(box(0.09, 0.07, 0.1, frameMat, 0.54, 1.24, 0.3));
      const button = cyl(0.016, 0.016, 0.02, buttonMat, 0.54, 1.26, 0.3);
      bike.add(button);
      bike.add(cyl(0.05, 0.05, 0.08, chrome, 0.5, 1.02, 0.17, "z"));
      const keyGroup = new THREE.Group();
      keyGroup.position.set(0.5, 1.02, 0.23);
      keyGroup.add(box(0.015, 0.1, 0.04, limeMat, 0, 0.05, 0));
      keyGroup.add(cyl(0.02, 0.02, 0.05, chrome, 0, 0, 0.0, "z"));
      bike.add(keyGroup);
      // headlight and speedometer pod
      const lamp = mesh(new THREE.SphereGeometry(0.19, 28, 20), lensMat, 0.92, 1.0, 0);
      lamp.scale.set(0.6, 1, 1);
      bike.add(lamp);
      bike.add(cyl(0.2, 0.2, 0.06, chrome, 0.84, 1.0, 0, "x"));
      bike.add(cyl(0.2, 0.17, 0.12, frameMat, 0.62, 1.34, 0, "x")); // pod housing
      bike.add(mesh(new THREE.TorusGeometry(0.19, 0.014, 8, 40), limeMat, 0.555, 1.34, 0).rotateY(Math.PI / 2));
      const dial = mesh(new THREE.CircleGeometry(0.17, 36), dialMat, 0.553, 1.34, 0);
      dial.rotation.y = -Math.PI / 2;
      bike.add(dial);
      const needle = new THREE.Group();
      needle.position.set(0.548, 1.34, 0);
      needle.add(box(0.004, 0.14, 0.012, tailMat, 0, 0.07, 0));
      bike.add(needle);
      // horn under the headlight
      const horn = mesh(new THREE.ConeGeometry(0.07, 0.14, 20, 1, true), hornMat, 0.9, 0.78, 0);
      horn.rotation.z = -Math.PI / 2;
      (horn.material as T.MeshStandardMaterial).side = THREE.DoubleSide;
      bike.add(horn);
      // indicators
      const indicators: T.Mesh[] = [];
      for (const s of [-1, 1]) {
        for (const [x, y] of [[0.8, 1.08], [-1.32, 0.78]] as const) {
          const i = mesh(new THREE.SphereGeometry(0.04, 12, 10), amber, x, y, s * 0.3);
          indicators.push(i);
          bike.add(i);
        }
      }

      // ---- frame, tank, engine, seat
      for (const z of [-0.1, 0.1]) {
        bike.add(tube([0.6, 1.04, z], [-0.05, 0.8, z], 0.026, frameMat)); // top rail
        bike.add(tube([-0.05, 0.8, z], [-0.9, 0.82, z * 1.3], 0.022, frameMat)); // subframe
        bike.add(tube([0.58, 1.0, z], [0.2, 0.36, z], 0.026, frameMat)); // down tube
        bike.add(tube([0.2, 0.36, z], [-0.3, 0.36, z], 0.026, frameMat)); // cradle
        bike.add(tube([-0.3, 0.36, z * 1.4], [-0.95, 0.4, z * 1.4], 0.026, frameMat)); // swingarm
        bike.add(tube([-0.3, 0.36, z], [-0.1, 0.8, z], 0.024, frameMat));
        // rear shocks with lime springs
        bike.add(tube([-0.88, 0.42, z * 1.7], [-0.78, 0.82, z * 1.7], 0.022, chrome));
        bike.add(tube([-0.87, 0.5, z * 1.7], [-0.8, 0.76, z * 1.7], 0.034, limeMat));
      }
      const engineBlock = box(0.5, 0.4, 0.3, engineGlow, 0.1, 0.55, 0);
      bike.add(engineBlock);
      const finMat = engineGlow;
      for (let i = 0; i < 6; i++) bike.add(box(0.46, 0.015, 0.36, finMat, 0.1, 0.78 + i * 0.03, 0));
      bike.add(cyl(0.16, 0.16, 0.4, engineMat, -0.2, 0.45, 0, "z"));
      bike.add(cyl(0.07, 0.07, 0.42, chrome, -0.2, 0.45, 0, "z"));
      // tank with a lime stripe and a fuel cap
      const tank = mesh(new THREE.SphereGeometry(1, 32, 20), paint, 0.28, 1.0, 0);
      tank.scale.set(0.46, 0.2, 0.2);
      bike.add(tank);
      const stripe = box(0.6, 0.012, 0.05, limeMat, 0.28, 1.2, 0);
      stripe.rotation.z = -0.04;
      bike.add(stripe);
      const cap = cyl(0.06, 0.06, 0.035, capMat, 0.27, 1.215, 0);
      bike.add(cap);
      const fuelRing = mesh(new THREE.TorusGeometry(0.075, 0.008, 8, 32), limeMat, 0.27, 1.222, 0);
      fuelRing.rotation.x = Math.PI / 2;
      bike.add(fuelRing);
      // seat
      const seat = box(0.95, 0.09, 0.34, seatMat, -0.52, 0.9, 0);
      bike.add(seat);
      bike.add(box(0.28, 0.09, 0.3, seatMat, -0.12, 0.93, 0));
      const seatStitch = box(0.9, 0.006, 0.012, stitch, -0.52, 0.948, 0.12);
      const seatStitch2 = box(0.9, 0.006, 0.012, stitch, -0.52, 0.948, -0.12);
      bike.add(seatStitch, seatStitch2);
      // exhaust
      bike.add(tube([0.3, 0.3, 0.2], [-0.1, 0.27, 0.22], 0.03, chrome));
      bike.add(tube([-0.1, 0.27, 0.22], [-0.45, 0.3, 0.24], 0.04, chrome));
      const muffler = cyl(0.075, 0.06, 0.8, chrome, -0.95, 0.4, 0.25, "x");
      muffler.rotation.z = Math.PI / 2 + 0.07;
      bike.add(muffler);
      // fenders
      const fenderR = box(0.7, 0.025, 0.3, paint, -1.05, 0.78, 0);
      fenderR.rotation.z = 0.12;
      bike.add(fenderR);
      const fenderF = box(0.55, 0.025, 0.2, paint, 0.97, 0.78, 0);
      fenderF.rotation.z = -0.15;
      bike.add(fenderF);
      // rear: tail light and number plate
      const tailLight = box(0.05, 0.06, 0.2, tailMat, -1.38, 0.8, 0);
      bike.add(tailLight);
      const plate = box(0.02, 0.15, 0.34, plateMat, -1.4, 0.62, 0);
      bike.add(plate);
      bike.add(box(0.022, 0.012, 0.26, frameMat, -1.401, 0.62, 0));
      bike.add(box(0.022, 0.012, 0.18, frameMat, -1.401, 0.585, 0));
      // lime sill line along the tank/seat, like the cover's neon trim
      bike.add(box(0.8, 0.008, 0.008, limeMat, -0.1, 0.84, 0.095));

      // ---- stands
      const mainStand = new THREE.Group();
      mainStand.position.set(-0.3, 0.3, 0);
      for (const z of [-0.2, 0.2]) {
        mainStand.add(tube([0, 0, z], [-0.1, -0.28, z], 0.02, standMat));
        mainStand.add(box(0.14, 0.02, 0.05, standMat, -0.12, -0.285, z));
      }
      mainStand.add(tube([0, 0, -0.2], [0, 0, 0.2], 0.02, standMat));
      bike.add(mainStand);
      const sideStand = new THREE.Group();
      sideStand.position.set(0.05, 0.34, -0.15);
      sideStand.add(tube([0, 0, 0], [0.18, -0.32, -0.3], 0.02, standMat));
      sideStand.add(box(0.1, 0.02, 0.07, standMat, 0.19, -0.325, -0.3));
      bike.add(sideStand);

      // Horn sound-wave ring (in front of the headlight)
      const waveMat = new THREE.MeshBasicMaterial({ color: 0xcedb28, transparent: true, opacity: 0, side: THREE.DoubleSide });
      disposables.push(waveMat);
      const wave = mesh(new THREE.RingGeometry(0.22, 0.25, 48), waveMat, 1.08, 0.82, 0);
      wave.rotation.y = Math.PI / 2;
      bike.add(wave);

      // ---- turntable floor
      const floor = new THREE.Group();
      const discMat = new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.35, metalness: 0.5 });
      disposables.push(discMat);
      const stage = mesh(new THREE.CircleGeometry(2.2, 64), discMat);
      stage.rotation.x = -Math.PI / 2;
      floor.add(stage);
      for (const [r, op] of [[2.2, 0.9], [1.98, 0.25], [1.76, 0.12]] as const) {
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xcedb28, transparent: true, opacity: op });
        disposables.push(ringMat);
        const ring = mesh(new THREE.RingGeometry(r - 0.025, r, 96), ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.005;
        floor.add(ring);
      }
      const hexPts = Array.from({ length: 7 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return new THREE.Vector3(Math.cos(a) * 2.1, 0.01, Math.sin(a) * 2.1);
      });
      const hexGeo = new THREE.BufferGeometry().setFromPoints(hexPts);
      const hexMat = new THREE.LineBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.55 });
      disposables.push(hexGeo, hexMat);
      floor.add(new THREE.Line(hexGeo, hexMat));
      floor.add(bike);
      scene.add(floor);

      // Scan ring that hovers on the active part, always facing the camera
      const scanMat = new THREE.MeshBasicMaterial({ color: 0xcedb28, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthTest: false });
      disposables.push(scanMat);
      const scan = mesh(new THREE.RingGeometry(0.13, 0.16, 40), scanMat);
      scan.renderOrder = 10;
      scene.add(scan);

      // ---------- sizing, input, loop ----------
      let width = 1;
      let height = 1;
      const resize = () => {
        width = host.clientWidth;
        height = host.clientHeight;
        renderer.setSize(width, height, false);
        camera.aspect = width / Math.max(height, 1);
        // Distance that fits the bike (~3.5 units across at three-quarter view, with margin) at this aspect
        const halfFov = Math.tan(((camera.fov / 2) * Math.PI) / 180);
        const dist = Math.min(8.5, Math.max(4.2, 3.7 / (2 * Math.min(camera.aspect, 1.6) * halfFov)));
        camera.position.set(0, dist * 0.26, dist);
        camera.lookAt(0, 0.68, 0);
        camera.updateProjectionMatrix();
        live.current.redraw();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      let yaw = -0.5;
      let targetYaw = -0.5;
      let dragging = false;
      let lastX = 0;
      let lastActive: string | null | undefined;
      const canvas = renderer.domElement;
      const onDown = (e: PointerEvent) => {
        dragging = true;
        lastX = e.clientX;
        canvas.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!dragging) return;
        targetYaw += (e.clientX - lastX) * 0.012;
        lastX = e.clientX;
        live.current.redraw();
      };
      const onUp = () => (dragging = false);
      canvas.addEventListener("pointerdown", onDown);
      canvas.addEventListener("pointermove", onMove);
      canvas.addEventListener("pointerup", onUp);
      canvas.addEventListener("pointercancel", onUp);

      const v = new THREE.Vector3();
      const reduced = prefersReducedMotion();
      const clock = new THREE.Clock();
      let raf = 0;
      let visible = true;

      const draw = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        const t = clock.elapsedTime;
        const { pins: ps, activeKey: ak } = live.current;
        const activePart = ps.find((p) => p.key === ak)?.part;

        if (ak !== lastActive) {
          lastActive = ak;
          if (activePart) {
            // Turn the shortest way round to the part
            const want = ANCHORS[activePart].yaw;
            targetYaw = want + Math.round((targetYaw - want) / (Math.PI * 2)) * Math.PI * 2;
          }
        }
        yaw += (targetYaw - yaw) * (reduced ? 1 : Math.min(1, dt * 3));
        floor.rotation.y = yaw;

        // Part demos
        const on = (p: BikePart) => activePart === p;
        const blink = Math.sin(t * 9) > 0 ? 1 : 0;
        const pulse = (Math.sin(t * 5) + 1) / 2;
        mirrorMat.emissiveIntensity = on("mirror") ? 0.4 + pulse * 0.9 : 0;
        mirrors.forEach((m) => m.scale.set(1, 1.25, 1));
        lensMat.emissiveIntensity = 0.9;
        tailMat.emissiveIntensity = on("brakes") ? 0.8 + blink * 2.2 : 0.8;
        caliperMat.emissiveIntensity = on("brakes") ? 0.4 + pulse * 1.8 : 0.25;
        dialMat.emissiveIntensity = on("speedometer") ? 0.5 + pulse * 0.9 : 0.25;
        needle.rotation.x = on("speedometer") && !reduced ? -1.1 + (Math.sin(t * 2.2) + 1) * 0.9 : -0.9;
        capMat.emissiveIntensity = on("fuel") ? 0.3 + pulse * 1.2 : 0;
        fuelRing.scale.setScalar(on("fuel") && !reduced ? 1 + pulse * 0.25 : 1);
        hornMat.emissiveIntensity = on("horn") ? 0.3 + pulse * 1.2 : 0;
        engineGlow.emissiveIntensity = on("starter") ? 0.1 + pulse * 0.9 : 0;
        buttonMat.emissiveIntensity = on("starter") ? 0.3 + blink * 2 : 0.2;
        bike.position.x = on("starter") && !reduced ? Math.sin(t * 60) * 0.004 : 0;
        bike.position.y = on("starter") && !reduced ? Math.sin(t * 73) * 0.004 : 0;
        keyGroup.rotation.z = on("key") && !reduced ? Math.sin(t * 3) * 0.7 : 0;
        stitch.emissiveIntensity = on("seat") ? 0.4 + pulse * 1.6 : 0.3;
        standMat.emissiveIntensity = on("stands") ? 0.2 + pulse * 1.2 : 0;
        mainStand.rotation.z = on("stands") && !reduced ? Math.sin(t * 2) * 0.12 : 0;
        sideStand.rotation.z = on("stands") && !reduced ? Math.sin(t * 2 + 1) * 0.1 : 0;
        plateMat.emissiveIntensity = on("plate") ? 0.15 + pulse * 0.5 : 0;
        indicators.forEach((i) => ((i.material as T.MeshStandardMaterial).emissiveIntensity = 0.3));
        if (on("horn") && !reduced) {
          const p = (t * 0.9) % 1;
          wave.scale.setScalar(1 + p * 4);
          waveMat.opacity = 0.9 * (1 - p);
        } else waveMat.opacity = 0;
        for (const w of wheels) {
          const front = w.position.x > 0;
          const spin = (on("tyre-front") && front) || (on("tyre-rear") && !front);
          if (spin && !reduced) w.rotation.z -= dt * 3.5;
        }
        limeMat.emissiveIntensity = 0.55 + Math.sin(t * 2) * 0.12;

        // Scan ring on the active part
        if (activePart) {
          v.set(...ANCHORS[activePart].pos);
          bike.localToWorld(v);
          scan.position.copy(v);
          scan.quaternion.copy(camera.quaternion);
          scan.scale.setScalar(1 + (reduced ? 0 : Math.sin(t * 4) * 0.15));
          scan.visible = true;
        } else scan.visible = false;

        renderer.render(scene, camera);

        // Project pins into the overlay; spread pins that share a part
        const groups = new Map<BikePart, string[]>();
        for (const p of ps) groups.set(p.part, [...(groups.get(p.part) ?? []), p.key]);
        for (const p of ps) {
          const el = pinEls.current.get(p.key);
          if (!el) continue;
          v.set(...ANCHORS[p.part].pos);
          bike.localToWorld(v);
          // Facing: is the anchor on the camera's side of the bike?
          const facing = Math.sin(yaw) * -ANCHORS[p.part].pos[0] + Math.cos(yaw) * ANCHORS[p.part].pos[2];
          v.project(camera);
          const group = groups.get(p.part)!;
          const spread = (group.indexOf(p.key) - (group.length - 1) / 2) * (p.key === ak ? 0 : 16);
          const x = (v.x * 0.5 + 0.5) * width + spread;
          const y = (-v.y * 0.5 + 0.5) * height;
          el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
          el.style.opacity = facing < -0.2 ? "0.28" : "1";
          el.style.zIndex = p.key === ak ? "3" : facing < -0.2 ? "1" : "2";
        }
      };

      const loop = () => {
        draw();
        raf = requestAnimationFrame(loop);
      };
      // Browsers already pause rAF in hidden tabs; only stop when scrolled out of view.
      const start = () => {
        cancelAnimationFrame(raf);
        if (visible && !reduced) {
          clock.getDelta();
          raf = requestAnimationFrame(loop);
        }
      };
      live.current.redraw = reduced ? () => requestAnimationFrame(draw) : () => {};
      resize();
      draw();
      start();

      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        start();
      });
      io.observe(host);

      cleanup = () => {
        cancelAnimationFrame(raf);
        live.current.redraw = () => {};
        io.disconnect();
        ro.disconnect();
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        canvas.removeEventListener("pointercancel", onUp);
        disposables.forEach((d) => d.dispose());
        pmrem.dispose();
        renderer.dispose();
        canvas.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div ref={hostRef} className={cn("relative overflow-hidden rounded-2xl bg-[radial-gradient(ellipse_at_50%_40%,#4a4a4a,#0a0a0a_74%)]", className)}>
      {pins.map((p) => (
        <button
          key={p.key}
          type="button"
          ref={(el) => {
            if (el) pinEls.current.set(p.key, el);
            else pinEls.current.delete(p.key);
          }}
          onClick={() => onSelect?.(p.key)}
          title={`${p.number}. ${p.label}`}
          aria-label={`Question ${p.number}: ${p.label}`}
          style={{ opacity: 0 }}
          className={cn(
            "group absolute left-0 top-0 grid place-items-center rounded-full font-bold ring-2 transition-[width,height,background-color,box-shadow,opacity] duration-300",
            PIN_STYLES[p.state],
            p.key === activeKey
              ? "h-9 w-9 text-sm text-black ring-4 ring-neon shadow-[0_0_26px_rgba(206,219,40,.95)]"
              : "h-3.5 w-3.5 text-[0px] before:absolute before:-inset-2.5 before:content-[''] hover:h-7 hover:w-7 hover:text-[0.7rem] hover:text-black",
            p.key === activeKey && p.state === "flagged" && "text-white",
          )}
        >
          {p.number}
        </button>
      ))}
    </div>
  );
}
