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

  // --- 재질 팔레트 (썸네일 싱크로율 100% 카툰 3D 토끼 전용) ---
  // 뽀얗고 보송보송한 벨벳 순백 털
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.32,
    metalness: 0.02,
    emissive: 0xfff0f5,
    emissiveIntensity: 0.14,
  });

  // 귀 안쪽 & 발바닥 & 볼터치 생기 있는 러블리 베이비 핑크
  const pinkMat = new THREE.MeshStandardMaterial({
    color: 0xff85a8,
    roughness: 0.35,
    metalness: 0.0,
    emissive: 0xff4d79,
    emissiveIntensity: 0.15,
  });

  // 똘망똘망하고 깊이 있는 글로시 블랙 안구
  const eyeBallMat = new THREE.MeshStandardMaterial({
    color: 0x12141c,
    roughness: 0.15,
    metalness: 0.05,
  });

  // 초롱초롱한 눈빛 하이라이트 (스펙큘러 캐치라이트)
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

  // 방긋 웃는 입 내부 & 앙증맞은 앞니
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x9f1239 });
  const toothMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

  // 뚫어뻥 고정 가죽 하네스 벨트 & 골드 버클
  const strapMat = new THREE.MeshStandardMaterial({
    color: 0x854d0e,
    roughness: 0.55,
  });
  const buckleMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.2,
    metalness: 0.8,
  });

  // 엽기토끼의 쏘울 아이템: 반짝이는 캔디 체리 레드 뚫어뻥
  const plungerRubberMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.22,
    metalness: 0.15,
    emissive: 0x9f1239,
    emissiveIntensity: 0.2,
  });
  const plungerStickMat = new THREE.MeshStandardMaterial({
    color: 0xd4a373,
    roughness: 0.38,
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

  // 정밀 고품질 지오메트리
  const sphereGeo = new THREE.SphereGeometry(1, 32, 24);
  const capsuleGeo = new THREE.CapsuleGeometry(1, 1, 12, 20);
  const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 24);
  const silhouetteMat = new THREE.MeshBasicMaterial({ color: 0x526777, side: THREE.BackSide });
  const addSilhouette = (mesh: THREE.Mesh, expand: number) => {
    const shell = new THREE.Mesh(mesh.geometry, silhouetteMat);
    shell.position.copy(mesh.position);
    shell.rotation.copy(mesh.rotation);
    shell.scale.copy(mesh.scale).multiplyScalar(expand);
    mesh.parent?.add(shell);
  };

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
  torso.scale.set(0.56, 0.62, 0.52);
  bodyGroup.add(torso);
  addSilhouette(torso, 1.075);

  // 배 뽈록한 하얀 솜털 디테일
  const belly = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.45,
    emissive: 0xfff7ed,
    emissiveIntensity: 0.18,
  }));
  belly.scale.set(0.48, 0.50, 0.44);
  belly.position.set(0.15, -0.04, 0);
  bodyGroup.add(belly);

  // 뚫어뻥을 단단히 고정하는 X자 가슴 가죽 끈 (하네스)
  const strap1 = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.038, 8, 28), strapMat);
  strap1.rotation.y = Math.PI / 4;
  strap1.rotation.x = 0.2;
  const strap2 = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.038, 8, 28), strapMat);
  strap2.rotation.y = -Math.PI / 4;
  strap2.rotation.x = -0.2;
  bodyGroup.add(strap1, strap2);

  // 골드 금속 버클 뱃지
  const buckle = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 16), buckleMat);
  buckle.rotation.z = Math.PI / 2;
  buckle.position.set(0.54, -0.02, 0);
  bodyGroup.add(buckle);

  const badge = new THREE.Mesh(sphereGeo, coreMat);
  badge.scale.set(0.06, 0.06, 0.06);
  badge.position.set(0.56, -0.02, 0);
  bodyGroup.add(badge);

  // 보송보송 둥근 꼬리
  const tail = new THREE.Mesh(sphereGeo, furMat);
  tail.scale.set(0.19, 0.19, 0.19);
  tail.position.set(-0.54, -0.16, 0);
  bodyGroup.add(tail);

  // ==========================================
  // 2. 머리 (찹쌀떡 볼살 + 초롱초롱 큰 눈 + 핑크 볼터치)
  // ==========================================
  const headGroup = new THREE.Group();
  headGroup.position.set(0.05, 1.42, 0);
  root.add(headGroup);

  const headMesh = new THREE.Mesh(sphereGeo, furMat);
  headMesh.scale.set(0.58, 0.50, 0.54);
  headGroup.add(headMesh);
  addSilhouette(headMesh, 1.08);

  // 귀여운 하트형 핑크 코
  const nose = new THREE.Mesh(sphereGeo, pinkMat);
  nose.scale.set(0.05, 0.04, 0.05);
  nose.position.set(0.56, -0.01, 0);
  headGroup.add(nose);

  // 🌟 썸네일과 1:1 일치하는 초롱초롱한 카툰 큰 눈 생성 함수 (좌/우 총 2개)
  const createCartoonEye = (zOffset: number, angleY: number) => {
    const eyeGroup = new THREE.Group();

    // 1. 큰 글로시 블랙 안구 (2D 측면과 3D 쿼터뷰 모두에서 예쁜 타원형)
    const eyeBall = new THREE.Mesh(sphereGeo, eyeBallMat);
    eyeBall.scale.set(0.14, 0.16, 0.12);
    eyeBall.rotation.y = angleY;
    eyeBall.position.set(0.42, 0.08, zOffset);
    eyeGroup.add(eyeBall);

    // 2. 초롱초롱한 큰 캐치라이트 하이라이트 (Glint 1)
    const glint1 = new THREE.Mesh(sphereGeo, glintMat);
    glint1.scale.set(0.05, 0.06, 0.05);
    glint1.position.set(0.50, 0.14, zOffset + 0.04 * (zOffset > 0 ? 1 : -1));
    eyeGroup.add(glint1);

    // 3. 앙증맞은 작은 캐치라이트 하이라이트 (Glint 2)
    const glint2 = new THREE.Mesh(sphereGeo, glintMat);
    glint2.scale.set(0.028, 0.028, 0.028);
    glint2.position.set(0.49, 0.03, zOffset - 0.02 * (zOffset > 0 ? 1 : -1));
    eyeGroup.add(glint2);

    // 4. 발그레한 핑크빛 볼터치
    const cheek = new THREE.Mesh(sphereGeo, pinkMat);
    cheek.scale.set(0.12, 0.10, 0.14);
    cheek.position.set(0.38, -0.10, zOffset * 1.15);
    eyeGroup.add(cheek);

    return eyeGroup;
  };

  // 정확히 좌/우 2개의 눈만 생성 (제3의 측면 눈 완전 제거)
  const eyeLeft = createCartoonEye(0.28, 0.40);
  const eyeRight = createCartoonEye(-0.28, -0.40);
  headGroup.add(eyeLeft, eyeRight);

  // 방긋 웃는 귀여운 입과 앙증맞은 토끼 앞니 2개
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.022, 8, 16, Math.PI * 0.9), mouthMat);
  mouth.rotation.y = Math.PI / 2;
  mouth.rotation.z = -Math.PI * 0.95;
  mouth.position.set(0.54, -0.12, 0);

  const toothL = new THREE.Mesh(capsuleGeo, toothMat);
  toothL.scale.set(0.022, 0.04, 0.025);
  toothL.position.set(0.55, -0.11, 0.025);
  const toothR = new THREE.Mesh(capsuleGeo, toothMat);
  toothR.scale.set(0.022, 0.04, 0.025);
  toothR.position.set(0.55, -0.11, -0.025);
  headGroup.add(mouth, toothL, toothR);

  // ==========================================
  // 3. 토끼 귀 (쫑긋하면서도 부드러운 롱 캡슐 곡선)
  // ==========================================
  const createEar = (zPos: number) => {
    const earPivot = new THREE.Group();
    earPivot.position.set(-0.06, 0.46, zPos);

    // 귀 바깥 부드러운 흰 털
    const earMesh = new THREE.Mesh(capsuleGeo, furMat);
    earMesh.scale.set(0.12, 0.42, 0.16);
    earMesh.position.set(0, 0.42, 0);
    earPivot.add(earMesh);
    addSilhouette(earMesh, 1.1);

    // 귀 안쪽 선명한 러블리 핑크 패널
    const innerEar = new THREE.Mesh(capsuleGeo, pinkMat);
    innerEar.scale.set(0.08, 0.34, 0.11);
    innerEar.position.set(0.05, 0.42, 0);
    earPivot.add(innerEar);

    headGroup.add(earPivot);
    return earPivot;
  };

  const earL = createEar(0.20);
  const earR = createEar(-0.20);
  earL.rotation.z = -0.14;
  earR.rotation.z = -0.14;

  // ==========================================
  // 4. 엽기토끼의 상징: 등 뒤의 뚫어뻥 (썸네일 싱크로율 100% 카툰 3D)
  // ==========================================
  const plungerGroup = new THREE.Group();
  plungerGroup.position.set(-0.32, 1.05, 0.10);
  plungerGroup.rotation.z = -0.42;
  plungerGroup.rotation.y = 0.20;
  root.add(plungerGroup);

  // 매끄러운 따뜻한 우드 손잡이 막대
  const stick = new THREE.Mesh(cylinderGeo, plungerStickMat);
  stick.scale.set(0.045, 0.88, 0.045);
  stick.position.set(0, -0.14, 0);
  plungerGroup.add(stick);

  // 막대 끝 둥근 골드/우드 캡
  const stickCap = new THREE.Mesh(sphereGeo, plungerStickMat);
  stickCap.scale.set(0.055, 0.055, 0.055);
  stickCap.position.set(0, -0.58, 0);
  plungerGroup.add(stickCap);

  // 🌟 썸네일에서 돋보이는 큼직하고 둥근 체리 레드 고무 컵
  const rubberCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.11, 0.24, 26),
    plungerRubberMat
  );
  rubberCup.position.set(0, 0.38, 0);
  plungerGroup.add(rubberCup);

  // 고무 흡착판 림 (도톰한 토러스 테두리)
  const rubberRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.25, 0.048, 10, 28),
    plungerRubberMat
  );
  rubberRim.rotation.x = Math.PI / 2;
  rubberRim.position.set(0, 0.48, 0);
  plungerGroup.add(rubberRim);

  // 고무 컵 상단 둥근 벨 캡
  const rubberCap = new THREE.Mesh(sphereGeo, plungerRubberMat);
  rubberCap.scale.set(0.14, 0.10, 0.14);
  rubberCap.position.set(0, 0.27, 0);
  plungerGroup.add(rubberCap);

  // ==========================================
  // 5. 짧뚱하고 앙증맞은 두 팔 & 왕발바닥 두 다리 (찹쌀떡 뜀박질)
  // ==========================================
  const createLimb = (isArm: boolean, zPos: number) => {
    const pivot = new THREE.Group();
    if (isArm) {
      pivot.position.set(0.06, 0.82, zPos);
      const arm = new THREE.Mesh(capsuleGeo, furMat);
      arm.scale.set(0.13, 0.22, 0.13);
      arm.position.set(0, -0.14, 0);
      pivot.add(arm);

      // 손끝 앙증맞은 핑크 젤리
      const handPad = new THREE.Mesh(sphereGeo, pinkMat);
      handPad.scale.set(0.065, 0.045, 0.065);
      handPad.position.set(0.02, -0.24, 0);
      pivot.add(handPad);
    } else {
      // 🌟 토끼 뒷다리: 몸통 밖으로 시원하게 노출되는 통통한 허벅지와 도톰한 찹쌀떡 왕발바닥
      pivot.position.set(0, 0.32, zPos);

      // 1. 통통한 허벅지/종아리
      const thigh = new THREE.Mesh(capsuleGeo, furMat);
      thigh.scale.set(0.18, 0.26, 0.18);
      thigh.position.set(0, -0.16, 0);
      pivot.add(thigh);

      // 2. 도톰한 토끼 왕발바닥 (앞으로 뻗은 찹쌀떡 발)
      const foot = new THREE.Mesh(sphereGeo, furMat);
      foot.scale.set(0.28, 0.14, 0.19);
      foot.position.set(0.12, -0.34, 0);
      pivot.add(foot);

      // 3. 발바닥 메인 핑크 젤리 패드
      const mainPad = new THREE.Mesh(sphereGeo, pinkMat);
      mainPad.scale.set(0.18, 0.05, 0.13);
      mainPad.position.set(0.12, -0.40, 0);
      pivot.add(mainPad);

      // 4. 앞발가락 귀여운 핑크 젤리 2알
      const toe1 = new THREE.Mesh(sphereGeo, pinkMat);
      toe1.scale.set(0.05, 0.04, 0.05);
      toe1.position.set(0.24, -0.38, 0.055);

      const toe2 = new THREE.Mesh(sphereGeo, pinkMat);
      toe2.scale.set(0.05, 0.04, 0.05);
      toe2.position.set(0.24, -0.38, -0.055);
      pivot.add(toe1, toe2);
    }
    root.add(pivot);
    return pivot;
  };

  // 몸통 밖으로 확실하게 돌출되어 선명하게 보이도록 Z 오프셋을 넉넉히 확보 (몸통 z=±0.26 초과)
  const armL = createLimb(true, 0.38);
  const armR = createLimb(true, -0.38);
  const legL = createLimb(false, 0.32);
  const legR = createLimb(false, -0.32);

  // 발밑 에너지 링
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.035, 6, 28), ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.05;
  group.add(ring);

  // ==========================================
  // 6. 엽기토끼 전용 유기적이고 부드러운 러닝 모션 (Squash & Stretch + Natural Hop)
  // ==========================================
  const animate = (t: number, speed: number, grounded: boolean) => {
    if (grounded) {
      // 자연스럽고 우아한 달리기 주기 (너무 빠르지 않으면서 속도감에 연동)
      const strideFreq = 6.2 + Math.min(speed, 18) * 0.42;
      const ph = t * strideFreq;
      const s = Math.sin(ph);
      const c = Math.cos(ph);

      // 🌟 완벽하게 복원된 토끼 다리 스윙 궤적 (양수 Y축 유지 + 앞뒤 구르는 뜀박질)
      legL.rotation.z = s * 0.85;
      legL.position.y = 0.32 + Math.max(0, -c) * 0.14;
      legL.position.x = s * 0.20;

      legR.rotation.z = -s * 0.85;
      legR.position.y = 0.32 + Math.max(0, c) * 0.14;
      legR.position.x = -s * 0.20;

      // 양팔 앙증맞은 질주 스윙
      armL.rotation.z = -s * 0.65;
      armR.rotation.z = s * 0.65;
      armL.position.x = 0.06 - s * 0.08;
      armR.position.x = 0.06 + s * 0.08;
      armL.rotation.x = 0.15;
      armR.rotation.x = -0.15;

      // 부드러운 조화 바운스 (지면과 이격 없는 쫀득한 호핑)
      const bounce = Math.sin(ph * 2);
      root.position.y = 0.04 + bounce * 0.035;

      // 앞으로 역동적으로 기울어진 질주 자세 + 미세한 상체 틸트
      root.rotation.z = -0.14 + s * 0.03;

      // 카툰 스쿼시 & 스트레치 (착지 시 찹쌀떡 납작, 도약 시 쫀득)
      bodyGroup.scale.y = 1.0 - bounce * 0.04;
      bodyGroup.scale.x = 1.0 + bounce * 0.03;

      // 귀의 부드러운 공기저항 관성 젖힘 & 살랑거림
      const earFollow = Math.sin(ph - 0.8) * 0.22;
      earL.rotation.z = -0.32 + earFollow;
      earR.rotation.z = -0.28 + earFollow * 0.92;
      earL.rotation.x = c * 0.08;
      earR.rotation.x = -c * 0.08;

      // 뚫어뻥: 등 뒤에서 안정적이면서 탄력 있게 가볍게 끄덕임
      plungerGroup.rotation.z = 0.62 + bounce * 0.08;
      plungerGroup.position.y = 0.95 + bounce * 0.02;

      // 앙증맞은 꼬리 살랑
      tail.rotation.y = s * 0.35;
    } else {
      // 점프 / 체공 중: 경쾌한 슈퍼맨 활공 포즈 (다리 Y축 땅속 꺼짐 방지)
      legL.rotation.z = 0.75;
      legR.rotation.z = -0.55;
      legL.position.y = 0.40;
      legR.position.y = 0.36;
      legL.position.x = 0.08;
      legR.position.x = -0.08;

      armL.rotation.z = -2.1;
      armR.rotation.z = -1.9;
      armL.position.x = 0.12;
      armR.position.x = 0.12;
      armL.rotation.x = 0.3;
      armR.rotation.x = -0.3;

      // 체공 시 귀가 바람에 뒤로 활짝 젖혀짐
      earL.rotation.z = -0.65;
      earR.rotation.z = -0.6;
      earL.rotation.x = 0.18;
      earR.rotation.x = -0.18;

      root.position.y = 0.06;
      root.rotation.z = -0.18;
      bodyGroup.scale.set(1.04, 0.96, 1.0);

      plungerGroup.rotation.z = 0.72;
    }

    // 아우라 링 회전
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
