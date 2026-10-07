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

  // --- 재질 팔레트 (썸네일 일치형 찹쌀떡 토끼 전용) ---
  // 뽀얗고 포근한 벨벳 하얀 털
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.38,
    metalness: 0.02,
    emissive: 0x1a1a24,
    emissiveIntensity: 0.12,
  });

  // 귀 안쪽 & 발바닥 & 볼터치 생기 있는 베이비 핑크
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xff94b8,
    roughness: 0.42,
    metalness: 0.0,
  });

  // 깊이 있는 눈동자 & 입술 라인
  const eyeMat = new THREE.MeshBasicMaterial({
    color: 0x181822,
  });

  // 행복하게 웃는 입 내부 & 앙증맞은 앞니
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x881337 });
  const toothMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // 뚫어뻥 고정 가죽 하네스 벨트
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.65,
  });

  // 엽기토끼의 쏘울 아이템: 반짝이는 체리 레드 뚫어뻥
  const plungerRubberMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.28,
    metalness: 0.12,
  });
  const plungerStickMat = new THREE.MeshStandardMaterial({
    color: 0xd4a373,
    roughness: 0.45,
  });

  // 게임 테마 연동 재질 (visor, core, ring)
  const visorMat = new THREE.MeshBasicMaterial({ color: 0xff66cc });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0x38d9a9 });
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x22d3ee,
    transparent: true,
    opacity: 0.9,
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
  // 1. 몸통 (찹쌀떡 통통한 물방울 몸매 + 가죽 하네스)
  // ==========================================
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.72, 0);
  root.add(bodyGroup);

  const torso = new THREE.Mesh(sphereGeo, furMat);
  torso.scale.set(0.55, 0.60, 0.50);
  bodyGroup.add(torso);

  // 배 뽈록한 디테일
  const belly = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({
    color: 0xfffcf5,
    roughness: 0.55,
  }));
  belly.scale.set(0.46, 0.48, 0.42);
  belly.position.set(0.14, -0.05, 0);
  bodyGroup.add(belly);

  // 뚫어뻥을 단단히 고정하는 X자 가슴 가죽 끈 (하네스)
  const strap1 = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.035, 6, 24), strapMat);
  strap1.rotation.y = Math.PI / 4;
  strap1.rotation.x = 0.2;
  const strap2 = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.035, 6, 24), strapMat);
  strap2.rotation.y = -Math.PI / 4;
  strap2.rotation.x = -0.2;
  bodyGroup.add(strap1, strap2);

  // 배꼽/코어에 앙증맞은 골드/에메랄드 뱃지
  const badge = new THREE.Mesh(sphereGeo, coreMat);
  badge.scale.set(0.09, 0.09, 0.09);
  badge.position.set(0.52, -0.02, 0);
  bodyGroup.add(badge);

  // 보송보송 둥근 꼬리
  const tail = new THREE.Mesh(sphereGeo, furMat);
  tail.scale.set(0.18, 0.18, 0.18);
  tail.position.set(-0.52, -0.15, 0);
  bodyGroup.add(tail);

  // ==========================================
  // 2. 머리 (찹쌀떡 볼살 + 활짝 웃는 표정 + 핑크 볼터치)
  // ==========================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0.04, 1.40, 0);
  root.add(headGroup);

  const headMesh = new THREE.Mesh(sphereGeo, furMat);
  headMesh.scale.set(0.55, 0.48, 0.52);
  headGroup.add(headMesh);

  // 귀여운 핑크 코
  const nose = new THREE.Mesh(sphereGeo, pinkMat);
  nose.scale.set(0.045, 0.035, 0.045);
  nose.position.set(0.54, -0.02, 0);
  headGroup.add(nose);

  // 눈웃음 아치 (^ ^) 생성 함수
  const createSmileEye = (zOffset: number, angleY: number) => {
    const eyeGroup = new THREE.Group();
    // 호(Arc) 모양의 활짝 웃는 눈
    const eyeArc = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 6, 16, Math.PI * 0.9), eyeMat);
    eyeArc.rotation.y = Math.PI / 2 + angleY;
    eyeArc.rotation.z = Math.PI * 0.05;
    eyeArc.position.set(0.48, 0.06, zOffset);
    eyeGroup.add(eyeArc);

    // 발그레한 핑크빛 볼터치
    const cheek = new THREE.Mesh(sphereGeo, pinkMat);
    cheek.scale.set(0.065, 0.08, 0.12);
    cheek.position.set(0.46, -0.09, zOffset * 1.15);
    eyeGroup.add(cheek);

    return eyeGroup;
  };

  const eyeLeft = createSmileEye(0.24, 0.22);
  const eyeRight = createSmileEye(-0.24, -0.22);
  headGroup.add(eyeLeft, eyeRight);

  // 2D 사이드뷰에서도 선명하게 보이는 옆모습 눈 & 볼터치
  const sideEye = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 6, 16, Math.PI * 0.9), eyeMat);
  sideEye.rotation.x = Math.PI / 2;
  sideEye.rotation.z = 0;
  sideEye.position.set(0.12, 0.06, 0.51);
  headGroup.add(sideEye);

  const sideCheek = new THREE.Mesh(sphereGeo, pinkMat);
  sideCheek.scale.set(0.12, 0.08, 0.05);
  sideCheek.position.set(0.12, -0.09, 0.50);
  headGroup.add(sideCheek);

  // 방긋 웃는 입과 귀여운 토끼 앞니
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 6, 14, Math.PI * 0.9), mouthMat);
  mouth.rotation.y = Math.PI / 2;
  mouth.rotation.z = -Math.PI * 0.95;
  mouth.position.set(0.52, -0.12, 0);
  const tooth = new THREE.Mesh(box, toothMat);
  tooth.scale.set(0.025, 0.04, 0.04);
  tooth.position.set(0.53, -0.11, 0);
  headGroup.add(mouth, tooth);

  // ==========================================
  // 3. 토끼 귀 (쫑긋하면서도 부드러운 곡선)
  // ==========================================
  const createEar = (zPos: number) => {
    const earPivot = new THREE.Group();
    earPivot.position.set(-0.06, 0.44, zPos);

    // 귀 바깥 흰 털
    const earMesh = new THREE.Mesh(capsuleGeo, furMat);
    earMesh.scale.set(0.11, 0.38, 0.15);
    earMesh.position.set(0, 0.38, 0);
    earPivot.add(earMesh);

    // 귀 안쪽 분홍면
    const innerEar = new THREE.Mesh(capsuleGeo, pinkMat);
    innerEar.scale.set(0.07, 0.30, 0.10);
    innerEar.position.set(0.045, 0.38, 0);
    earPivot.add(innerEar);

    headGroup.add(earPivot);
    return earPivot;
  };

  const earL = createEar(0.20);
  const earR = createEar(-0.20);
  earL.rotation.z = -0.12;
  earR.rotation.z = -0.12;

  // ==========================================
  // 4. 엽기토끼의 상징: 등 뒤의 뚫어뻥 (썸네일 싱크로율 100% 3D 카툰)
  // ==========================================
  const plungerGroup = new THREE.Group();
  // 등 뒤에 비스듬히 얹고, 2D 사이드뷰(+Z 카메라)에서도 돋보이도록 z=0.08로 전면 노출
  plungerGroup.position.set(-0.30, 1.02, 0.08);
  plungerGroup.rotation.z = -0.45;
  plungerGroup.rotation.y = 0.18;
  root.add(plungerGroup);

  // 매끄러운 따뜻한 우드 손잡이 막대 (아래쪽으로 뻗음)
  const stick = new THREE.Mesh(cylinderGeo, plungerStickMat);
  stick.scale.set(0.042, 0.82, 0.042);
  stick.position.set(0, -0.12, 0);
  plungerGroup.add(stick);

  // 썸네일에서 독보적인 체리 레드 고무 컵 (등 위로 큼직하고 둥글게 솟아오름)
  const rubberCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.10, 0.22, 22),
    plungerRubberMat
  );
  rubberCup.position.set(0, 0.35, 0);
  plungerGroup.add(rubberCup);

  const rubberRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.23, 0.042, 8, 24),
    plungerRubberMat
  );
  rubberRim.rotation.x = Math.PI / 2;
  rubberRim.position.set(0, 0.44, 0);
  plungerGroup.add(rubberRim);

  // 고무 컵 상단 둥근 캡 디테일
  const rubberCap = new THREE.Mesh(sphereGeo, plungerRubberMat);
  rubberCap.scale.set(0.12, 0.08, 0.12);
  rubberCap.position.set(0, 0.25, 0);
  plungerGroup.add(rubberCap);



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

