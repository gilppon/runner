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
    name: 'CARROT MEADOW',
    sky1: '#4aa8ff',
    sky2: '#d8f3ff',
    void1: '#1b3b6f',
    void2: '#52b788',
    floor: '#40916c',
    wall: '#f48c06',
    accent: '#ffb703',
    accent2: '#ff4d6d',
    orb: '#ff6b00',
    danger: '#e63946',
  },
  {
    name: 'COTTON CANDY',
    sky1: '#ff8fab',
    sky2: '#ffe5ec',
    void1: '#59203b',
    void2: '#a34875',
    floor: '#b54e79',
    wall: '#70c1b3',
    accent: '#ffe066',
    accent2: '#b392ac',
    orb: '#ff8800',
    danger: '#ff1493',
  },
  {
    name: 'BATHROOM ESCAPE',
    sky1: '#00b4d8',
    sky2: '#caf0f8',
    void1: '#023e8a',
    void2: '#0077b6',
    floor: '#48cae4',
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
    wall: '#8367a8',
    accent: '#4cc9f0',
    accent2: '#f72585',
    orb: '#ff9e00',
    danger: '#ff0054',
  },
];
