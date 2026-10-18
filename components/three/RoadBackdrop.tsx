"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/utils";

/**
 * Landing backdrop: a road in 3D rolling toward the viewer, drawn only in the 2W form's own
 * colours (lime lane grid, a red centre line, black and lime light streaks) on a transparent
 * canvas, so the page stays white. With reduced motion a single still frame is drawn; if WebGL
 * is unavailable the page is simply plain white, as it was before.
 */
export default function RoadBackdrop() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    import("three").then((THREE) => {
      if (disposed) return;
      let renderer: InstanceType<typeof THREE.WebGLRenderer>;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return;
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0xffffff, 10, 62); // fades into the white page
      const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 120);
      camera.position.set(0, 1.4, 6);
      camera.lookAt(0, 0.9, -30);

      const grid = new THREE.GridHelper(160, 64, 0xcedb28, 0xcedb28);
      const gridMat = grid.material as InstanceType<typeof THREE.LineBasicMaterial>;
      gridMat.transparent = true;
      gridMat.opacity = 0.75;
      scene.add(grid);
      const cell = 160 / 64;

      const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 160), new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.85 }));
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(0, 0.01, -60);
      scene.add(lane);

      const colors = [0x000000, 0xcedb28, 0xff0000, 0xcedb28];
      const streakGeo = new THREE.BoxGeometry(0.05, 0.05, 1);
      const streaks = Array.from({ length: 40 }, (_, i) => {
        const m = new THREE.Mesh(streakGeo, new THREE.MeshBasicMaterial({ color: colors[i % colors.length], transparent: true, opacity: 0.7 }));
        const side = i % 2 ? 1 : -1;
        m.position.set(side * (3.5 + Math.random() * 9), 0.15 + Math.random() * 3.2, -Math.random() * 80);
        m.scale.z = 2 + Math.random() * 6;
        m.userData.speed = 16 + Math.random() * 26;
        scene.add(m);
        return m;
      });

      const resize = () => {
        const { clientWidth: w, clientHeight: h } = host;
        renderer.setSize(w, h, false);
        camera.aspect = w / Math.max(h, 1);
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(host);

      const reduced = prefersReducedMotion();
      const clock = new THREE.Clock();
      let raf = 0;
      const frame = () => {
        const dt = Math.min(clock.getDelta(), 0.05);
        grid.position.z = (clock.elapsedTime * 9) % cell;
        for (const s of streaks) {
          s.position.z += s.userData.speed * dt;
          if (s.position.z > 8) s.position.z = -80;
        }
        renderer.render(scene, camera);
        raf = requestAnimationFrame(frame);
      };
      if (reduced) renderer.render(scene, camera);
      else raf = requestAnimationFrame(frame);

      const onVisibility = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden && !reduced) {
          clock.getDelta();
          raf = requestAnimationFrame(frame);
        }
      };
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        cancelAnimationFrame(raf);
        document.removeEventListener("visibilitychange", onVisibility);
        ro.disconnect();
        scene.traverse((o) => {
          const mesh = o as InstanceType<typeof THREE.Mesh>;
          mesh.geometry?.dispose();
          (mesh.material as { dispose?: () => void } | undefined)?.dispose?.();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={hostRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 [&>canvas]:h-full [&>canvas]:w-full" />;
}
