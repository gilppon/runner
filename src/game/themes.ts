export interface Theme {
  name: string;
  sky1: string; // 2D sky top
  sky2: string; // 2D sky horizon
  void1: string; // 3D void top
  void2: string; // 3D void bottom
  floor: string;
  road: string;
  side: string;
  wall: string;
  accent: string;
  accent2: string;
  orb: string;
  danger: string;
}

export const THEMES: Theme[] = [
  {
    name: 'CARROT MEADOW',
    sky1: '#38bdf8',
    sky2: '#e0f2fe',
    void1: '#1d4ed8',
    void2: '#60a5fa',
    floor: '#22c55e',
    road: '#f8e39c',
    side: '#a9683e',
    wall: '#f97316',
    accent: '#facc15',
    accent2: '#ec4899',
    orb: '#ff7700',
    danger: '#ef4444',
  },
  {
    name: 'COTTON CANDY',
    sky1: '#f8a5c2',
    sky2: '#fde8f0',
    void1: '#4a203b',
    void2: '#8c3f68',
    floor: '#38bdf8',
    road: '#fff5ea',
    side: '#6b3f55',
    wall: '#2dd4bf',
    accent: '#fde047',
    accent2: '#c084fc',
    orb: '#ff8800',
    danger: '#ff2255',
  },
  {
    name: 'BATHROOM ESCAPE',
    sky1: '#00b4d8',
    sky2: '#caf0f8',
    void1: '#023e8a',
    void2: '#0077b6',
    floor: '#48cae4',
    road: '#c9f3f5',
    side: '#427c90',
    wall: '#0096c7',
    accent: '#ffb703',
    accent2: '#fb8500',
    orb: '#ff6b00',
    danger: '#d90429',
  },
  {
    name: 'SUNNY PARK',
    sky1: '#3a86ff',
    sky2: '#ffe082',
    void1: '#1d3557',
    void2: '#588157',
    floor: '#606c38',
    road: '#e7d39e',
    side: '#806749',
    wall: '#e76f51',
    accent: '#2a9d8f',
    accent2: '#f4a261',
    orb: '#ff7700',
    danger: '#e71d36',
  },
  {
    name: 'MOONLIGHT PICNIC',
    sky1: '#1d1b38',
    sky2: '#5c4d7d',
    void1: '#0f0e26',
    void2: '#2a2040',
    floor: '#3d3460',
    road: '#8c7db8',
    side: '#30274e',
    wall: '#8367a8',
    accent: '#4cc9f0',
    accent2: '#f72585',
    orb: '#ff9e00',
    danger: '#ff0054',
  },
];
