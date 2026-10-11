import os

file_path = r"e:\solarena\달리기\src\game\engine.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

target = """    this.rig.shake(0.3);
    this.rig.kickFov(is3D ? 10 : 5);
    const pal = this.world.cur;
    this.particles.burst(this.p.x, this.p.y + 0.9, this.rz(), is3D ? pal.accent2 : pal.accent, 34, 8, 0.7, 2);
    this.flash(is3D ? `#${pal.accent2.getHexString()}` : `#${pal.accent.getHexString()}`, 0.28, 0.55);"""

replacement = """    this.rig.shake(0.55);
    this.rig.kickFov(is3D ? 16 : 9);
    const pal = this.world.cur;
    this.particles.burst(this.p.x, this.p.y + 0.9, this.rz(), is3D ? pal.accent2 : pal.accent, 55, 11, 0.85, 3);
    this.flash(is3D ? `#${pal.accent2.getHexString()}` : `#${pal.accent.getHexString()}`, 0.38, 0.65);
    this.showComboPopup(is3D ? '⚡ 3D SHIFT!' : '🌀 2D FLATTEN!', this.p.x, this.p.y + 1.8);"""

if target not in content:
    target = target.replace("\n", "\r\n")
    replacement = replacement.replace("\n", "\r\n")

if target in content:
    content = content.replace(target, replacement, 1)
    print("setMode enhanced successfully!")
else:
    print("Warning: target not found in engine.ts")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("engine.ts patch completed!")
