"use client";

import { useEffect, useRef } from "react";
import type * as T from "three";
import { prefersReducedMotion } from "@/lib/utils";

type Props = {
  /** 0..1 through the form: the handlebar turns, and the gauge needle climbs, as the line manager progresses. */
  progress: number;
  /** Bump on every answer; the handlebar gives a small nudge. */
  nudge: number;
  /** The latest answer was a flagged one: shake, and the lime trim glows red. */
  alert: boolean;
  className?: string;
};

/**
 * A small 3D motorcycle handlebar for the form header (the 4W form has a steering wheel here):
 * grips, mirrors, a headlight and a speedometer pod. three.js is loaded on mount; with reduced
 * motion it renders once and only re-renders on prop changes.
 */
export default function Handlebar3D({ progress, nudge, alert, className }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const live = useRef({ progress, nudge, alert, kick: 0, redraw: () => {} });

  useEffect(() => {
    const l = live.current;
    if (nudge !== l.nudge) l.kick = 1;
    Object.assign(l, { progress, nudge, alert });
    l.redraw();
  }, [progress, nudge, alert]);

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
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
      camera.position.set(0, 0.25, 5.2);
      camera.lookAt(0, 0, 0);

      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.9;
      scene.add(new THREE.AmbientLight(0xffffff, 0.6));
      const key = new THREE.DirectionalLight(0xffffff, 1.8);
      key.position.set(2, 3, 4);
      scene.add(key);
      const rimLight = new THREE.PointLight(0xff0000, 5, 8);
      rimLight.position.set(-2, -1, 2);
      scene.add(rimLight);

      const body = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.45, roughness: 0.4 });
      const chrome = new THREE.MeshStandardMaterial({ color: 0xc4c8d0, metalness: 0.92, roughness: 0.2 });
      const trim = new THREE.MeshStandardMaterial({ color: 0xcedb28, emissive: 0xcedb28, emissiveIntensity: 0.9 });
      const lens = new THREE.MeshStandardMaterial({ color: 0xfffff0, emissive: 0xfffbd0, emissiveIntensity: 0.8 });
      const needleMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const dial = new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.5 });
      const geos: { dispose: () => void }[] = [];
      const add = (g: T.BufferGeometry, m: T.Material, parent: T.Object3D, x = 0, y = 0, z = 0) => {
        geos.push(g);
        const o = new THREE.Mesh(g, m);
        o.position.set(x, y, z);
        parent.add(o);
        return o;
      };

      const bars = new THREE.Group();
      // The bar, swept back and up at both ends
      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.45, 0.34, -0.3),
        new THREE.Vector3(-1.1, 0.1, -0.1),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(1.1, 0.1, -0.1),
        new THREE.Vector3(1.45, 0.34, -0.3),
      ]);
      add(new THREE.TubeGeometry(path, 40, 0.055, 10), chrome, bars);
      for (const s of [-1, 1]) {
        const grip = add(new THREE.CylinderGeometry(0.1, 0.1, 0.55, 20), body, bars, s * 1.36, 0.3, -0.27);
        grip.rotation.z = (Math.PI / 2) * 1.0 - s * 0.35;
        const band = add(new THREE.TorusGeometry(0.1, 0.018, 8, 24), trim, bars, s * 1.2, 0.23, -0.2);
        band.rotation.y = Math.PI / 2 - s * 0.0;
        // mirror on a stalk
        const stalk = add(new THREE.CylinderGeometry(0.025, 0.025, 0.55, 8), chrome, bars, s * 1.2, 0.55, -0.1);
        stalk.rotation.z = -s * 0.2;
        const glass = add(new THREE.CircleGeometry(0.24, 32), chrome, bars, s * 1.28, 0.9, -0.1);
        glass.scale.set(1, 1.15, 1);
        const rim = add(new THREE.RingGeometry(0.24, 0.29, 32), trim, bars, s * 1.28, 0.9, -0.095);
        rim.scale.set(1, 1.15, 1);
        // brake / clutch lever
        const lever = add(new THREE.BoxGeometry(0.05, 0.05, 0.55), chrome, bars, s * 1.05, 0.14, 0.2);
        lever.rotation.y = -s * 0.25;
      }
      // Headlight and speedometer pod
      const lamp = add(new THREE.SphereGeometry(0.5, 32, 24), lens, bars, 0, -0.6, 0.05);
      lamp.scale.set(1, 1, 0.75);
      add(new THREE.TorusGeometry(0.5, 0.05, 12, 48), chrome, bars, 0, -0.6, 0.2);
      const pod = add(new THREE.CylinderGeometry(0.42, 0.46, 0.3, 36), body, bars, 0, 0.5, -0.05);
      pod.rotation.x = Math.PI / 2 - 0.25;
      const podRing = add(new THREE.TorusGeometry(0.42, 0.035, 10, 48), trim, bars, 0, 0.5, 0.14);
      podRing.rotation.x = -0.25;
      const face = add(new THREE.CircleGeometry(0.38, 40), dial, bars, 0, 0.5, 0.145);
      face.rotation.x = -0.25;
      const needle = new THREE.Group();
      needle.position.set(0, 0.5, 0.16);
      needle.rotation.x = -0.25;
      add(new THREE.BoxGeometry(0.035, 0.32, 0.01), needleMat, needle, 0, 0.16, 0);
      bars.add(needle);
      bars.position.y = 0.05;
      scene.add(bars);

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        // the bar is ~3 wide and ~2.4 tall: fit both, whatever shape the box is
        const half = Math.tan(((camera.fov / 2) * Math.PI) / 180);
        camera.position.z = Math.max(1.7 / (half * Math.max(camera.aspect, 0.3)), 1.45 / half);
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      const red = new THREE.Color(0xff0000);
      const lime = new THREE.Color(0xcedb28);
      const reduced = prefersReducedMotion();
      const clock = new THREE.Clock();
      let angle = 0;
      let raf = 0;

      const draw = (t: number, dt: number) => {
        const l = live.current;
        // Turns from left to right across the whole form, with a gentle idle sway.
        const target = (l.progress - 0.5) * 1.1 + (reduced ? 0 : Math.sin(t * 0.9) * 0.05);
        angle += (target - angle) * (reduced ? 1 : Math.min(1, dt * 3.5));
        l.kick = Math.max(0, l.kick - dt * 2.2);
        const shake = l.alert ? Math.sin(t * 38) * 0.1 * l.kick : Math.sin(l.kick * Math.PI) * 0.14;
        bars.rotation.y = angle + shake;
        bars.rotation.x = -0.12;
        needle.rotation.z = (0.5 - l.progress) * 4.2;
        const c = l.alert ? red : lime;
        trim.color.lerp(c, reduced ? 1 : 0.15);
        trim.emissive.lerp(c, reduced ? 1 : 0.15);
        trim.emissiveIntensity = 0.9 + l.kick * 1.4;
        renderer.render(scene, camera);
      };

      const loop = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        draw(clock.elapsedTime, dt);
        raf = requestAnimationFrame(loop);
      };
      if (reduced) {
        live.current.redraw = () => draw(0, 0);
        draw(0, 0);
      } else raf = requestAnimationFrame(loop);

      const onVisibility = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden && !reduced) {
          clock.getDelta();
          raf = requestAnimationFrame(loop);
        }
      };
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        cancelAnimationFrame(raf);
        live.current.redraw = () => {};
        document.removeEventListener("visibilitychange", onVisibility);
        ro.disconnect();
        geos.forEach((g) => g.dispose());
        pmrem.dispose();
        [body, chrome, trim, lens, needleMat, dial].forEach((m) => m.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className={`[&>canvas]:h-full [&>canvas]:w-full ${className ?? ""}`} />;
}
