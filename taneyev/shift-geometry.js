// 3D geometry for the shift models: where things sit and how they move.
// No music here: which motion each interval takes comes from
// src/taneyev/symmetry.js. This file only turns that into coordinates.
//
// World axes: y is up; the heptagon and the helix's turns lie in the x–z plane.
// Step n of the scale sits at angle n · 2π/7.

export const TAU = Math.PI * 2;
export const STEP = TAU / 7;

/** A point on a circle of radius r at height y, at step angle n. */
export const onCircle = (n, r, y = 0) => [r * Math.cos(n * STEP), y, r * Math.sin(n * STEP)];

/** Turns a point about the vertical axis by angle a. */
export function rotY(p, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [p[0] * c - p[2] * s, p[1], p[0] * s + p[2] * c];
}

/**
 * Turns a point by angle a about the level axis at angle phi, height h0.
 * With a = π this is the half-turn that flips the coin (Rodrigues' formula).
 */
export function turnAboutLevelAxis(p, phi, a, h0 = 0) {
  const u = [Math.cos(phi), 0, Math.sin(phi)];
  const q = [p[0], p[1] - h0, p[2]];
  const c = Math.cos(a);
  const s = Math.sin(a);
  const along = u[0] * q[0] + u[2] * q[2];
  const cross = [u[1] * q[2] - u[2] * q[1], u[2] * q[0] - u[0] * q[2], u[0] * q[1] - u[1] * q[0]];
  const r = [0, 1, 2].map((i) => q[i] * c + cross[i] * s + u[i] * along * (1 - c));
  return [r[0], r[1] + h0, r[2]];
}

/** Smooth start and stop for an animation running from t = 0 to 1. */
export const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2);

/**
 * A camera looking at the origin from a distance, turned by yaw and pitch.
 * Returns a function from a world point to [screenX, screenY, depth, scale].
 */
export function camera({ yaw, pitch, distance, focal, width, height }) {
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  return (p) => {
    const a = rotY(p, -yaw);
    const y = a[1] * cp - a[2] * sp;
    const z = a[1] * sp + a[2] * cp;
    const k = focal / (distance - z);
    return [width / 2 + a[0] * k, height / 2 - y * k, z, k];
  };
}

/** The screen direction (unit vector) of a world vector v starting at point p. */
export function screenDirection(project, p, v) {
  const a = project(p);
  const b = project([p[0] + v[0] * 0.2, p[1] + v[1] * 0.2, p[2] + v[2] * 0.2]);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [dx / len, dy / len];
}
