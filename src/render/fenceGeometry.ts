import * as THREE from 'three';

export function createFencePostGeometry(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(0.25, 1.0, 0.25);
}

export function createFenceNSRailGeometry(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(0.125, 0.25, 0.5);
}

export function createFenceEWRailGeometry(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(0.5, 0.25, 0.125);
}
