import os

file_path = r"e:\solarena\달리기\src\game\world.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add properties
target1 = "  private toyBuildings: { obj: THREE.Group; base: number }[] = [];\n  private orbFree: Orb[] = [];"
replacement1 = """  private toyBuildings: { obj: THREE.Group; base: number }[] = [];
  private warpRings: { mesh: THREE.Mesh; rotSpeed: number; pulseSpeed: number; baseScale: number }[] = [];
  private starField!: THREE.Points;
  private orbFree: Orb[] = [];"""

if target1 not in content:
    target1 = target1.replace("\n", "\r\n")
    replacement1 = replacement1.replace("\n", "\r\n")

if target1 in content:
    content = content.replace(target1, replacement1, 1)
    print("Property added successfully!")
else:
    print("Warning: target1 not found")

# 2. Add buildBackdrop additions at end of buildBackdrop
target2 = """      tg.position.set(0, -0.5, zPos);
      this.root.add(tg);
      this.toyBuildings.push({ obj: tg, base: (i / TOY_CITY_N) * TOY_CITY_SPAN });
    }
  }"""

replacement2 = """      tg.position.set(0, -0.5, zPos);
      this.root.add(tg);
      this.toyBuildings.push({ obj: tg, base: (i / TOY_CITY_N) * TOY_CITY_SPAN });
    }

    // 6. 🌀 거대한 회전하는 차원 관문 링들 (Colossal Warp Rings)
    const ringGeo = new THREE.TorusGeometry(14, 0.65, 16, 48);
    const ringColors = [0x38bdf8, 0xec4899, 0xfacc15];
    for (let i = 0; i < 3; i++) {
      const ringMat = new THREE.MeshBasicMaterial({
        color: ringColors[i],
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set((i - 1) * 35, 26 + i * 4, -85 - i * 15);
      ringMesh.rotation.x = Math.PI * 0.15;
      ringMesh.rotation.y = (i * Math.PI) / 3;
      this.root.add(ringMesh);
      this.warpRings.push({
        mesh: ringMesh,
        rotSpeed: 0.18 + i * 0.08,
        pulseSpeed: 1.5 + i * 0.4,
        baseScale: 1 + i * 0.25,
      });
    }

    // 7. ✨ 반짝이는 차원 성운 별무리 (Star / Sparkle Field)
    const starCount = 140;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (this.random() - 0.5) * 320;
      starPos[i * 3 + 1] = 8 + this.random() * 55;
      starPos[i * 3 + 2] = -50 - this.random() * 85;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2.2,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
    });
    this.starField = new THREE.Points(starGeo, starMat);
    this.root.add(this.starField);
  }"""

if target2 not in content:
    target2 = target2.replace("\n", "\r\n")
    replacement2 = replacement2.replace("\n", "\r\n")

if target2 in content:
    content = content.replace(target2, replacement2, 1)
    print("buildBackdrop updated successfully!")
else:
    print("Warning: target2 not found")

# 3. Add update loop animation for warp rings and stars
target3 = """    for (const b of this.toyBuildings) {
      b.obj.position.x = camX + mod(b.base - camX * 0.58, TOY_CITY_SPAN) - TOY_CITY_SPAN / 2;
    }"""

replacement3 = """    for (const b of this.toyBuildings) {
      b.obj.position.x = camX + mod(b.base - camX * 0.58, TOY_CITY_SPAN) - TOY_CITY_SPAN / 2;
    }

    // 🌀 차원 관문 링 & 성운 별무리 회전/패럴랙스
    for (let i = 0; i < this.warpRings.length; i++) {
      const r = this.warpRings[i];
      r.mesh.rotation.z += dt * r.rotSpeed;
      r.mesh.position.x = camX * 0.92 + (i - 1) * 38;
      const s = r.baseScale * (1 + Math.sin(t * r.pulseSpeed) * 0.04);
      r.mesh.scale.set(s, s, s);
    }
    if (this.starField) {
      this.starField.position.x = camX * 0.96;
    }"""

if target3 not in content:
    target3 = target3.replace("\n", "\r\n")
    replacement3 = replacement3.replace("\n", "\r\n")

if target3 in content:
    content = content.replace(target3, replacement3, 1)
    print("update loop updated successfully!")
else:
    print("Warning: target3 not found")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("world.ts patch completed!")
