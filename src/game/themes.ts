export interface Theme {
  name: string;
  sky1: string; // 2D sky top
  sky2: string; // 2D sky horizon
  void1: string; // 3D void top
  void2: string; // 3D void bottom
  floor: string;
  wall: string;
  accent: string;
  accent2: string;
  orb: string;
  danger: string;
}

export const THEMES: Theme[] = [
  {
    name: 'NEON FLATLAND',
    sky1: '#150a3a',
    sky2: '#ff4f9a',
    void1: '#04050f',
    void2: '#101a4a',
    floor: '#2c2b6b',
    wall: '#3b2078',
    accent: '#19f0ff',
    accent2: '#ff3df0',
    orb: '#8dfcff',
    danger: '#ff8a3d',
  },
  {
    name: 'SUNSET SLAB',
    sky1: '#2a0f52',
    sky2: '#ff9a5a',
    void1: '#12050f',
    void2: '#3a1030',
    floor: '#6a2f5c',
    wall: '#7a2a54',
    accent: '#ffd166',
    accent2: '#ff5e78',
    orb: '#ffe9a0',
    danger: '#4ff0d0',
  },
  {
    name: 'TOXIC GRID',
    sky1: '#031a12',
    sky2: '#2be27e',
    void1: '#020a06',
    void2: '#0a2a1a',
    floor: '#1d5a3c',
    wall: '#1c4a58',
    accent: '#c4ff3a',
    accent2: '#00ffc6',
    orb: '#eaffb0',
    danger: '#ff4d6d',
  },
  {
    name: 'GLACIER LOOP',
    sky1: '#0a1c46',
    sky2: '#88d8ff',
    void1: '#030818',
    void2: '#0d2a5c',
    floor: '#3b6aa8',
    wall: '#3c4d9c',
    accent: '#9be7ff',
    accent2: '#b388ff',
    orb: '#ffffff',
    danger: '#ff7a9c',
  },
  {
    name: 'CRIMSON VOID',
    sky1: '#1a0108',
    sky2: '#ff3355',
    void1: '#080103',
    void2: '#33081a',
    floor: '#5c1f3a',
    wall: '#601848',
    accent: '#ff6b86',
    accent2: '#ffc233',
    orb: '#ffd0d8',
    danger: '#36e0ff',
  },
];
