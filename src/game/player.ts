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

  // --- 재질 팔레트 (마시마로 엽기토끼 전용) ---
  // 뽀얗고 포근한 하얀 털
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xfcfcff,
    roughness: 0.6,
    metalness: 0.05,
    emissive: 0x222233,
    emissiveIntensity: 0.2,
  });

  // 귀 안쪽 & 발바닥 & 볼터치 연분홍
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xffadc2,
    roughness: 0.5,
    metalness: 0.0,
  });

  // 시크한 ㅡ ㅡ 실눈 & 코
  const eyeMat = new THREE.MeshBasicMaterial({
    color: 0x1a1a24,
  });

  // 엽기토끼의 쏘울 아이템: 빨간 뚫어뻥
  const plungerRubberMat = new THREE.MeshStandardMaterial({
    color: 0xdd2c38,
    roughness: 0.4,
    metalness: 0.1,
  });
  const plungerStickMat = new THREE.MeshStandardMaterial({
    color: 0xcca070,
    roughness: 0.6,
  });

  // 게임 테마 연동 재질 (visor, core, ring)
  const visorMat = new THREE.MeshBasicMaterial({ color: 0xff66cc });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x38d9a9 });
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x19f0ff,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  // 공용 지오메트리
  const sphereGeo = new THREE.SphereGeometry(1, 24, 20);
  const capsuleGeo = new THREE.CapsuleGeometry(1, 1, 8, 16);
  const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 16);

  // 상체/전체 피벗 루트 (바운스 애니메이션용)
  const root = new THREE.Group();
  group.add(root);

  // ==========================================
  // 1. 몸통 (찹쌀떡 통통한 물방울 몸매)
  // ==========================================
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.72, 0);
  root.add(bodyGroup);

  const torso = new THREE.Mesh(sphereGeo, furMat);
  torso.scale.set(0.52, 0.58, 0.48);
  bodyGroup.add(torso);

  // 배 뽈록한 디테일
  const belly = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.7,
  }));
  belly.scale.set(0.44, 0.46, 0.4);
  belly.position.set(0.12, -0.05, 0);
  bodyGroup.add(belly);

  // 배꼽/코어에 앙증맞은 하트/에너지 뱃지 (coreMat)
  const badge = new THREE.Mesh(sphereGeo, coreMat);
  badge.scale.set(0.08, 0.08, 0.08);
  badge.position.set(0.48, -0.02, 0);
  bodyGroup.add(badge);

  // 보송보송 둥근 꼬리
  const tail = new THREE.Mesh(sphereGeo, furMat);
  tail.scale.set(0.16, 0.16, 0.16);
  tail.position.set(-0.48, -0.15, 0);
  bodyGroup.add(tail);

  // ==========================================
  // 2. 머리 (마시마로 둥글넙적 찹쌀떡 헤드)
  // ==========================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0.04, 1.38, 0);
  root.add(headGroup);

  const headMesh = new THREE.Mesh(sphereGeo, furMat);
  // 살짝 넙적하면서 볼살 빵빵
  headMesh.scale.set(0.52, 0.46, 0.48);
  headGroup.add(headMesh);

  // 이마/머리핀에 엑센트 리본 (visorMat)
  const pin = new THREE.Mesh(sphereGeo, visorMat);
  pin.scale.set(0.07, 0.07, 0.07);
  pin.position.set(0.15, 0.4, 0.28);
  headGroup.add(pin);

  // 마시마로 특유의 ㅡ ㅡ 실눈 (앞 + 옆 시점 모두 보이도록 양 측면 전방 배치)
  const createSlitEye = (zOffset: number, angleY: number) => {
    const eyeGroup = new THREE.Group();
    // 가느다란 ㅡ 자 실눈
    const slit = new THREE.Mesh(box, eyeMat);
    slit.scale.set(0.015, 0.032, 0.18);
    slit.position.set(0.46, 0.03, zOffset);
    slit.rotation.y = angleY;
    slit.rotation.z = -0.05;
    eyeGroup.add(slit);

    // 발그레한 핑크빛 볼터치
    const cheek = new THREE.Mesh(sphereGeo, pinkMat);
    cheek.scale.set(0.05, 0.07, 0.1);
    cheek.position.set(0.43, -0.12, zOffset * 1.15);
    eyeGroup.add(cheek);

    return eyeGroup;
  };

  const eyeLeft = createSlitEye(0.24, 0.2);
  const eyeRight = createSlitEye(-0.24, -0.2);
  headGroup.add(eyeLeft);
  headGroup.add(eyeRight);

  // 2D 사이드뷰(옆모습)에서도 완벽하게 보이는 옆모습 실눈 & 볼터치
  const sideEye = new THREE.Mesh(box, eyeMat);
  sideEye.scale.set(0.16, 0.03, 0.02);
  sideEye.position.set(0.1, 0.03, 0.47);
  headGroup.add(sideEye);

  const sideCheek = new THREE.Mesh(sphereGeo, pinkMat);
  sideCheek.scale.set(0.1, 0.07, 0.04);
  sideCheek.position.set(0.1, -0.12, 0.46);
  headGroup.add(sideCheek);

  // 앙증맞은 코
  const nose = new THREE.Mesh(sphereGeo, eyeMat);
  nose.scale.set(0.04, 0.03, 0.04);
  nose.position.set(0.51, -0.04, 0);
  headGroup.add(nose);

  // ==========================================
  // 3. 토끼 귀 (쫑긋하지만 살랑살랑 흔들림)
  // ==========================================
  const createEar = (zPos: number) => {
    const earPivot = new THREE.Group();
    earPivot.position.set(-0.06, 0.42, zPos);

    // 귀 바깥 흰 털
    const earMesh = new THREE.Mesh(capsuleGeo, furMat);
    earMesh.scale.set(0.1, 0.35, 0.14);
    earMesh.position.set(0, 0.35, 0);
    earPivot.add(earMesh);

    // 귀 안쪽 분홍면
    const innerEar = new THREE.Mesh(capsuleGeo, pinkMat);
    innerEar.scale.set(0.06, 0.28, 0.09);
    innerEar.position.set(0.04, 0.35, 0);
    earPivot.add(innerEar);

    headGroup.add(earPivot);
    return earPivot;
  };

  const earL = createEar(0.18);
  const earR = createEar(-0.18);
  earL.rotation.z = -0.1;
  earR.rotation.z = -0.1;

  // ==========================================
  // 4. 엽기토끼의 상징: 등 뒤의 뚫어뻥 (Plunger)
  // ==========================================
  const plungerGroup = new THREE.Group();
  plungerGroup.position.set(-0.35, 0.95, -0.2);
  plungerGroup.rotation.z = 0.55;
  plungerGroup.rotation.y = 0.25;
  root.add(plungerGroup);

  // 나무 손잡이 막대
  const stick = new THREE.Mesh(cylinderGeo, plungerStickMat);
  stick.scale.set(0.032, 0.72, 0.032);
  stick.position.set(0, 0.28, 0);
  plungerGroup.add(stick);

  // 빨간 고무 흡착판
  const rubberCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.06, 0.15, 16),
    plungerRubberMat
  );
  rubberCup.position.set(0, -0.06, 0);
  plungerGroup.add(rubberCup);

  const rubberRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.025, 8, 20),
    plungerRubberMat
  );
  rubberRim.rotation.x = Math.PI / 2;
  rubberRim.position.set(0, -0.13, 0);
  plungerGroup.add(rubberRim);

  // ==========================================
  // 5. 짧뚱한 두 팔 & 두 다리 (찹쌀떡 뜀박질)
  // ==========================================
  const createLimb = (isArm: boolean, zPos: number) => {
    const pivot = new THREE.Group();
    if (isArm) {
      pivot.position.set(0.08, 0.85, zPos);
      const arm = new THREE.Mesh(capsuleGeo, furMat);
      arm.scale.set(0.11, 0.2, 0.11);
      arm.position.set(0, -0.16, 0);
      pivot.add(arm);
    } else {
      pivot.position.set(0, 0.36, zPos);
      const leg = new THREE.Mesh(capsuleGeo, furMat);
      leg.scale.set(0.13, 0.18, 0.14);
      leg.position.set(0.04, -0.16, 0);
      pivot.add(leg);

      // 발바닥 분홍 젤리 패드
      const pad = new THREE.Mesh(sphereGeo, pinkMat);
      pad.scale.set(0.08, 0.04, 0.09);
      pad.position.set(0.06, -0.27, 0);
      pivot.add(pad);
    }
    root.add(pivot);
    return pivot;
  };

  const armL = createLimb(true, 0.38);
  const armR = createLimb(true, -0.38);
  const legL = createLimb(false, 0.2);
  const legR = createLimb(false, -0.2);

  // 발밑 에너지 링
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.035, 6, 28), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  // ==========================================
  // 6. 엽기토끼 전용 모션 & 물리 애니메이션
  // ==========================================
  const animate = (t: number, speed: number, grounded: boolean) => {
    if (grounded) {
      // 찰랑찰랑 찹쌀떡 바운스 러닝
      const ph = t * speed * 1.35;
      const s = Math.sin(ph);
      const c = Math.cos(ph);

      // 다리 앞뒤 타타탁
      legL.rotation.z = s * 0.95;
      legR.rotation.z = -s * 0.95;

      // 팔 앞뒤 파닥파닥
      armL.rotation.z = -s * 0.85;
      armR.rotation.z = s * 0.85;
      armL.rotation.x = 0.2;
      armR.rotation.x = -0.2;

      // 몸통 찹쌀떡 바운스 (통통 튐)
      root.position.y = Math.abs(s) * 0.1;
      root.rotation.z = -0.06 + s * 0.04;
      bodyGroup.scale.y = 1 - Math.abs(s) * 0.06;
      bodyGroup.scale.x = 1 + Math.abs(s) * 0.04;

      // 귀 뒤로 젖혀지며 살랑살랑 (관성 느낌)
      const earWiggle = Math.sin(ph - 0.7) * 0.35;
      earL.rotation.z = -0.28 + earWiggle;
      earR.rotation.z = -0.24 + earWiggle * 0.9;
      earL.rotation.x = c * 0.12;
      earR.rotation.x = -c * 0.12;

      // 뚫어뻥 덜렁덜렁
      plungerGroup.rotation.z = 0.55 + s * 0.18;
      plungerGroup.position.y = 0.95 + Math.abs(s) * 0.05;

      // 꼬리 살랑
      tail.rotation.y = s * 0.4;
    } else {
      // 점프 중: 슈퍼맨 만세 & 허공 허우적 포즈
      legL.rotation.z = 0.8;
      legR.rotation.z = -0.6;
      armL.rotation.z = -2.3;
      armR.rotation.z = -2.1;
      armL.rotation.x = 0.4;
      armR.rotation.x = -0.4;

      // 점프 시 귀가 바람에 뒤로 활짝 젖혀짐!
      earL.rotation.z = -0.7;
      earR.rotation.z = -0.65;
      earL.rotation.x = 0.25;
      earR.rotation.x = -0.25;

      root.position.y = 0.05;
      root.rotation.z = -0.15;
      bodyGroup.scale.set(1.05, 0.95, 1.0);

      // 뚫어뻥 등 뒤에 고정
      plungerGroup.rotation.z = 0.75;
    }

    // 아우라 링 회전
    ring.rotation.z = t * 2.5;
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

