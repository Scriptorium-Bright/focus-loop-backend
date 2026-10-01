export interface SkinPalette {
  skyTop: string;
  skyBottom: string;
  horizon: string;
  water: string;
  waterHighlight: string;
  boat: string;
  boatEdge: string;
  accent: string;
  surface: string;
}

export interface HarborVariant {
  id: string;
  name: string;
  description: string;
}

export interface AudioProfile {
  water: number;
  swell: number;
  ambient: string;
}

export interface MotionProfile {
  bob: number;
  roll: number;
}

export interface SkyProfile {
  glow: string;
  haze: number;
  cloudDensity: number;
}

export interface OceanProfile {
  swell: number;
  flow: number;
  foam: number;
  wind: number;
}

export interface VesselProfile {
  hull: string;
  edge: string;
  rope: string;
  bob: number;
  roll: number;
}

export interface ArrivalLandmark {
  name: string;
  kind: 'lighthouse' | 'village' | 'window' | 'harbor-light' | 'buoy';
  glow: number;
}

export interface FocusSkin {
  id: string;
  name: string;
  access: 'FREE' | 'PREMIUM' | 'UNLOCK';
  mood: string;
  palette: SkinPalette;
  sky: SkyProfile;
  ocean: OceanProfile;
  vessel: VesselProfile;
  departureDock: HarborVariant;
  pauseHarbors: HarborVariant[];
  arrivalLandmark: ArrivalLandmark;
  landmark: string;
  harbors: HarborVariant[];
  audio: AudioProfile;
  motion: MotionProfile;
}

export const skins: FocusSkin[] = [
  {
    id: 'DAWN',
    name: '고요한 새벽',
    access: 'FREE',
    mood: '잔잔하게 하루를 여는 물빛',
    landmark: '작은 등대',
    palette: { skyTop: '#6e8794', skyBottom: '#d8c6ae', horizon: '#d4b48d', water: '#244856', waterHighlight: '#b8d6d1', boat: '#342923', boatEdge: '#d1a878', accent: '#e8c28f', surface: 'rgba(13, 31, 41, .72)' },
    harbors: [{ id: 'dawn-harbor-1', name: '등대 부두', description: '작은 불빛 아래 고요한 부두' }, { id: 'dawn-harbor-2', name: '새벽 방파제', description: '물이 낮게 부서지는 방파제' }],
    audio: { water: 0.45, swell: 0.2, ambient: '낮은 물결과 목재 소리' },
    motion: { bob: 2.2, roll: 0.18 },
    sky: { glow: '#e8c28f', haze: 0.22, cloudDensity: 0.18 },
    ocean: { swell: 0.55, flow: 0.72, foam: 0.5, wind: 0.2 },
    vessel: { hull: '#342923', edge: '#d1a878', rope: '#d1a878', bob: 2.2, roll: 0.18 },
    departureDock: { id: 'dawn-harbor-1', name: '등대 부두', description: '작은 불빛 아래 고요한 부두' },
    pauseHarbors: [{ id: 'dawn-harbor-1', name: '등대 부두', description: '작은 불빛 아래 고요한 부두' }, { id: 'dawn-harbor-2', name: '새벽 방파제', description: '물이 낮게 부서지는 방파제' }],
    arrivalLandmark: { name: '작은 등대', kind: 'lighthouse', glow: 0.8 },
  },
  {
    id: 'COAST',
    name: '맑은 연안',
    access: 'FREE',
    mood: '맑고 가벼운 해안의 공기',
    landmark: '해안 마을',
    palette: { skyTop: '#6fa2a2', skyBottom: '#d9dec5', horizon: '#c7d7bf', water: '#1f5b68', waterHighlight: '#bee6d5', boat: '#3e3229', boatEdge: '#e1bd86', accent: '#d6e8bb', surface: 'rgba(16, 47, 52, .68)' },
    harbors: [{ id: 'coast-harbor-1', name: '작은 만', description: '부표가 이어지는 밝은 쉼터' }, { id: 'coast-harbor-2', name: '모래 곶', description: '빛이 넓게 번지는 해안' }],
    audio: { water: 0.5, swell: 0.18, ambient: '맑은 물과 먼 갈매기' },
    motion: { bob: 2.8, roll: 0.22 },
    sky: { glow: '#d6e8bb', haze: 0.16, cloudDensity: 0.12 },
    ocean: { swell: 0.68, flow: 0.9, foam: 0.64, wind: 0.28 },
    vessel: { hull: '#3e3229', edge: '#e1bd86', rope: '#e1bd86', bob: 2.8, roll: 0.22 },
    departureDock: { id: 'coast-harbor-1', name: '작은 만', description: '부표가 이어지는 밝은 쉼터' },
    pauseHarbors: [{ id: 'coast-harbor-1', name: '작은 만', description: '부표가 이어지는 밝은 쉼터' }, { id: 'coast-harbor-2', name: '모래 곶', description: '빛이 넓게 번지는 해안' }],
    arrivalLandmark: { name: '해안 마을', kind: 'village', glow: 0.74 },
  },
  {
    id: 'RAIN',
    name: '비 오는 방파제',
    access: 'PREMIUM',
    mood: '빗소리 안쪽에서 머무는 시간',
    landmark: '따뜻한 창',
    palette: { skyTop: '#3d5664', skyBottom: '#788f99', horizon: '#a7b1ae', water: '#203e4b', waterHighlight: '#9fb9b6', boat: '#292a2a', boatEdge: '#b5a18a', accent: '#c1d2ca', surface: 'rgba(9, 23, 32, .78)' },
    harbors: [{ id: 'rain-harbor-1', name: '방파제 안쪽', description: '빗소리가 낮아지는 보호된 수면' }, { id: 'rain-harbor-2', name: '젖은 부두', description: '작은 창 하나가 남은 부두' }],
    audio: { water: 0.25, swell: 0.12, ambient: '부드러운 비와 낮은 물결' },
    motion: { bob: 1.8, roll: 0.12 },
    sky: { glow: '#c1d2ca', haze: 0.42, cloudDensity: 0.62 },
    ocean: { swell: 0.34, flow: 0.5, foam: 0.3, wind: 0.38 },
    vessel: { hull: '#292a2a', edge: '#b5a18a', rope: '#b5a18a', bob: 1.8, roll: 0.12 },
    departureDock: { id: 'rain-harbor-1', name: '방파제 안쪽', description: '빗소리가 낮아지는 보호된 수면' },
    pauseHarbors: [{ id: 'rain-harbor-1', name: '방파제 안쪽', description: '빗소리가 낮아지는 보호된 수면' }, { id: 'rain-harbor-2', name: '젖은 부두', description: '작은 창 하나가 남은 부두' }],
    arrivalLandmark: { name: '따뜻한 창', kind: 'window', glow: 0.92 },
  },
  {
    id: 'MOON',
    name: '달빛 항해',
    access: 'PREMIUM',
    mood: '남청색 수면에 오래 머무는 밤',
    landmark: '항구 불빛',
    palette: { skyTop: '#101d3e', skyBottom: '#405777', horizon: '#73869c', water: '#142f50', waterHighlight: '#9bb6ce', boat: '#25232d', boatEdge: '#c2ad89', accent: '#b9cae8', surface: 'rgba(7, 17, 37, .8)' },
    harbors: [{ id: 'moon-harbor-1', name: '등대 아래', description: '달빛과 등대가 겹치는 정박지' }, { id: 'moon-harbor-2', name: '푸른 부두', description: '멀리 불빛만 남은 부두' }],
    audio: { water: 0.35, swell: 0.28, ambient: '느린 파도와 낮은 바람' },
    motion: { bob: 1.6, roll: 0.1 },
    sky: { glow: '#b9cae8', haze: 0.2, cloudDensity: 0.24 },
    ocean: { swell: 0.72, flow: 0.56, foam: 0.42, wind: 0.18 },
    vessel: { hull: '#25232d', edge: '#c2ad89', rope: '#c2ad89', bob: 1.6, roll: 0.1 },
    departureDock: { id: 'moon-harbor-1', name: '등대 아래', description: '달빛과 등대가 겹치는 정박지' },
    pauseHarbors: [{ id: 'moon-harbor-1', name: '등대 아래', description: '달빛과 등대가 겹치는 정박지' }, { id: 'moon-harbor-2', name: '푸른 부두', description: '멀리 불빛만 남은 푸른 부두' }],
    arrivalLandmark: { name: '항구 불빛', kind: 'harbor-light', glow: 1 },
  },
  {
    id: 'FOG',
    name: '안개 해역',
    access: 'UNLOCK',
    mood: '낮은 대비로 오래 머무는 미지의 물길',
    landmark: '안개 부표',
    harbors: [{ id: 'fog-harbor-1', name: '부표 쉼터', description: '안개 사이 안내음이 남는 쉼터' }, { id: 'fog-harbor-2', name: '옅은 방파제', description: '천천히 드러나는 낮은 방파제' }],
    palette: { skyTop: '#66787c', skyBottom: '#aeb9b1', horizon: '#c4c9bf', water: '#536b6d', waterHighlight: '#c5d0c7', boat: '#3e3c39', boatEdge: '#c3bda8', accent: '#d5c99f', surface: 'rgba(44, 61, 62, .76)' },
    audio: { water: 0.28, swell: 0.1, ambient: '낮은 물결과 먼 부표 안내음' },
    motion: { bob: 1.2, roll: 0.08 },
    sky: { glow: '#d5c99f', haze: 0.56, cloudDensity: 0.8 },
    ocean: { swell: 0.25, flow: 0.32, foam: 0.2, wind: 0.14 },
    vessel: { hull: '#3e3c39', edge: '#c3bda8', rope: '#c3bda8', bob: 1.2, roll: 0.08 },
    departureDock: { id: 'fog-harbor-1', name: '부표 쉼터', description: '안개 사이 안내음이 남는 쉼터' },
    pauseHarbors: [{ id: 'fog-harbor-1', name: '부표 쉼터', description: '안개 사이 안내음이 남는 쉼터' }, { id: 'fog-harbor-2', name: '옅은 방파제', description: '천천히 드러나는 낮은 방파제' }],
    arrivalLandmark: { name: '안개 부표', kind: 'buoy', glow: 0.72 },
  },
];

export const defaultSkin = skins[0];
export const findSkin = (id: string) => skins.find((skin) => skin.id === id) ?? defaultSkin;
