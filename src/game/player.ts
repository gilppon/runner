import * as THREE from 'three';
import type { PetDef } from './content';

export interface PlayerRig {
  group: THREE.Group;
  ring: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  visorMat: THREE.MeshBasicMaterial;
  coreMat: THREE.MeshBasicMaterial;
  animate(t: number, speed: number, grounded: boolean): void;
}

const box = new THREE.BoxGeometry(1, 1, 1);

export function createPlayer(): PlayerRig {
  const group = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#eef3ff', roughness: 0.45, metalness: 0.1, emissive: '#26305a', emissiveIntensity: 0.6 });
  const limbMat = new THREE.MeshStandardMaterial({ color: '#6f8cff', roughness: 0.5, emissive: '#1a2a80', emissiveIntensity: 0.6 });
  const visorMat = new THREE.MeshBasicMaterial({ color: '#19f0ff' });
  const coreMat = new THREE.MeshBasicMaterial({ color: '#ff3df0' });

  const mk = (
    mat: THREE.Material,
    sx: number,
    sy: number,
    sz: number,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D,
  ) => {
    const m = new THREE.Mesh(box, mat);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  const upper = new THREE.Group();
  group.add(upper);
  const torso = mk(bodyMat, 0.62, 0.75, 0.44, 0, 0.98, 0, upper);
  mk(bodyMat, 0.52, 0.5, 0.5, 0.03, 1.62, 0, upper);
  mk(visorMat, 0.22, 0.16, 0.54, 0.2, 1.64, 0, upper);
  mk(coreMat, 0.16, 0.42, 0.3, -0.38, 1.0, 0, upper);

  const pivot = (y: number, z: number, parent: THREE.Object3D) => {
    const g = new THREE.Group();
    g.position.set(0, y, z);
    parent.add(g);
    return g;
  };
  const legL = pivot(0.62, 0.15, group);
  const legR = pivot(0.62, -0.15, group);
  mk(limbMat, 0.22, 0.62, 0.22, 0, -0.31, 0, legL);
  mk(limbMat, 0.22, 0.62, 0.22, 0, -0.31, 0, legR);
  const armL = pivot(1.3, 0.4, upper);
  const armR = pivot(1.3, -0.4, upper);
  mk(limbMat, 0.18, 0.55, 0.18, 0, -0.27, 0, armL);
  mk(limbMat, 0.18, 0.55, 0.18, 0, -0.27, 0, armR);

  const ringMat = new THREE.MeshBasicMaterial({
    color: '#19f0ff',
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.04, 6, 28), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  const animate = (t: number, speed: number, grounded: boolean) => {
    if (grounded) {
      const ph = t * speed * 1.1;
      const s = Math.sin(ph) * 0.95;
      legL.rotation.z = s;
      legR.rotation.z = -s;
      armL.rotation.z = -s * 0.9;
      armR.rotation.z = s * 0.9;
      torso.position.y = 0.98 + Math.abs(Math.sin(ph)) * 0.04;
      upper.rotation.z = -0.12;
    } else {
      legL.rotation.z = 0.75;
      legR.rotation.z = -0.55;
      armL.rotation.z = -2.5;
      armR.rotation.z = -2.1;
      upper.rotation.z = -0.05;
    }
    ring.rotation.z = t * 2.2;
  };

  return { group, ring, ringMat, visorMat, coreMat, animate };
}

export function createPetMesh(pet: PetDef): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: pet.color,
    roughness: 0.5,
    emissive: pet.color,
    emissiveIntensity: 0.35,
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#0b0b1a' });
  const add = (geo: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    g.add(mesh);
    return mesh;
  };

  if (pet.dim === '2D') {
    add(box, mat, 0, 0, 0, 0.7, 0.6, 0.12);
    add(box, mat, -0.18, 0.4, 0, 0.18, 0.25, 0.1);
    add(box, mat, 0.18, 0.4, 0, 0.18, 0.25, 0.1);
  } else if (pet.dim === '3D') {
    add(new THREE.OctahedronGeometry(0.42), mat, 0, 0, 0);
  } else {
    add(box, mat, -0.12, 0, 0, 0.5, 0.5, 0.08);
    add(box, mat, 0.16, 0, 0, 0.36, 0.36, 0.36);
  }
  add(box, eyeMat, 0.3, 0.08, 0.14, 0.08, 0.12, 0.06);
  add(box, eyeMat, 0.3, 0.08, -0.14, 0.08, 0.12, 0.06);
  return g;
}
