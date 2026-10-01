import type { FocusSkin } from '../domain/skins';
import type { SceneState } from '../domain/session/sessionTypes';

export interface SceneRenderOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  time: number;
  sceneState: SceneState;
  progress: number;
  skin: FocusSkin;
  reduceMotion: boolean;
  seed: number;
  harborSearchProgress?: number;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (from: number, to: number, amount: number) => from + (to - from) * clamp(amount);
const delayedProgress = (progress: number, start: number, end: number) => clamp((progress - start) / Math.max(0.001, end - start));
const rgba = (hex: string, alpha: number) => {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const seeded = (seed: number, index: number) => {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

interface SceneProfile {
  waterSpeed: number;
  boatMotion: number;
  foam: number;
  dockVisible: boolean;
  dockParallax: number;
  ropeTension: number;
  lightStrength: number;
  searchPhase: number;
  wind: number;
}

const profileFor = (sceneState: SceneState, progress: number, harborSearchProgress: number): SceneProfile => {
  if (sceneState === 'DOCKED_VIEW') return { waterSpeed: 0.08, boatMotion: 0.3, foam: 0.18, dockVisible: true, dockParallax: 0, ropeTension: 1, lightStrength: 0.42, searchPhase: 0, wind: 0.15 };
  if (sceneState === 'CAST_OFF') {
    // The environment reveals the departure in distinct beats: the rope
    // gives after a short hold, the dock begins to slide later, and the
    // water flow reaches its open-water speed last.
    const rope = delayedProgress(progress, 0.3 / 2.4, 1 / 2.4);
    const dock = delayedProgress(progress, 0.6 / 2.4, 1.8 / 2.4);
    const water = delayedProgress(progress, 0.8 / 2.4, 2.3 / 2.4);
    return { waterSpeed: lerp(0.08, 0.34, water), boatMotion: lerp(0.3, 1, water), foam: lerp(0.18, 0.5, water), dockVisible: progress < 0.96, dockParallax: dock, ropeTension: 1 - rope, lightStrength: 0.38, searchPhase: 0, wind: lerp(0.15, 0.7, water) };
  }
  if (sceneState === 'SEARCHING_HARBOR') {
    const slowdown = clamp((harborSearchProgress - 0.84) / 0.16);
    return { waterSpeed: lerp(0.26, 0.14, slowdown), boatMotion: lerp(0.76, 0.42, slowdown), foam: lerp(0.42, 0.1, slowdown), dockVisible: false, dockParallax: 0, ropeTension: 0.12, lightStrength: 0.4 + harborSearchProgress * 0.42, searchPhase: harborSearchProgress, wind: lerp(0.55, 0.22, slowdown) };
  }
  if (sceneState === 'HARBOR_REST') return { waterSpeed: 0.136, boatMotion: 0.4, foam: 0.1, dockVisible: false, dockParallax: 0, ropeTension: 0.3, lightStrength: 0.78, searchPhase: 1, wind: 0.21 };
  if (sceneState === 'LEAVING_HARBOR') return { waterSpeed: lerp(0.136, 0.34, progress), boatMotion: lerp(0.4, 1, progress), foam: lerp(0.1, 0.5, progress), dockVisible: progress < 0.78, dockParallax: clamp(progress / 0.78), ropeTension: 0.1 + clamp(progress / 0.55) * 0.6, lightStrength: lerp(0.78, 0.42, progress), searchPhase: 1 - progress, wind: lerp(0.21, 0.7, progress) };
  if (sceneState === 'APPROACHING_DESTINATION') return { waterSpeed: lerp(0.34, 0.12, progress), boatMotion: lerp(1, 0.34, progress), foam: lerp(0.5, 0.2, progress), dockVisible: false, dockParallax: 0, ropeTension: 0.24, lightStrength: lerp(0.42, 1, progress), searchPhase: 1, wind: lerp(0.7, 0.16, progress) };
  if (sceneState === 'ARRIVED') return { waterSpeed: 0.08, boatMotion: 0.2, foam: 0.12, dockVisible: false, dockParallax: 0, ropeTension: 0.3, lightStrength: 1, searchPhase: 1, wind: 0.12 };
  return { waterSpeed: 0.34, boatMotion: 1, foam: 0.5, dockVisible: false, dockParallax: 0, ropeTension: 0.24, lightStrength: 0.42, searchPhase: 0, wind: 0.7 };
};

const drawSky = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin, progress: number) => {
  const skyBottom = height * 0.58;
  const gradient = ctx.createLinearGradient(0, 0, 0, skyBottom);
  gradient.addColorStop(0, skin.palette.skyTop);
  gradient.addColorStop(1, skin.palette.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, skyBottom);

  const glowX = width * (0.67 - progress * 0.04);
  const glowY = height * 0.28;
  const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, Math.min(width, height) * 0.25);
  glow.addColorStop(0, rgba(skin.sky.glow, 0.36));
  glow.addColorStop(0.55, rgba(skin.sky.glow, 0.09));
  glow.addColorStop(1, rgba(skin.sky.glow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, skyBottom);

  const haze = ctx.createLinearGradient(0, height * 0.34, 0, height * 0.55);
  haze.addColorStop(0, 'rgba(255,255,255,0)');
  haze.addColorStop(1, rgba(skin.palette.horizon, 0.12 + skin.sky.haze * 0.22));
  ctx.fillStyle = haze;
  ctx.fillRect(0, height * 0.3, width, height * 0.28);
};

const drawHorizon = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin) => {
  const horizonY = height * 0.48;
  ctx.fillStyle = rgba(skin.palette.horizon, 0.2);
  ctx.fillRect(0, horizonY - 1, width, 3);
  ctx.fillStyle = rgba(skin.palette.horizon, 0.12);
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 4);
  ctx.lineTo(width * 0.18, horizonY + 1);
  ctx.lineTo(width * 0.38, horizonY + 3);
  ctx.lineTo(width * 0.6, horizonY);
  ctx.lineTo(width * 0.83, horizonY + 3);
  ctx.lineTo(width, horizonY + 1);
  ctx.lineTo(width, height * 0.57);
  ctx.lineTo(0, height * 0.57);
  ctx.closePath();
  ctx.fill();
};

const drawFarWater = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin) => {
  const horizonY = height * 0.49;
  const gradient = ctx.createLinearGradient(0, horizonY, 0, height);
  gradient.addColorStop(0, rgba(skin.palette.horizon, 0.44));
  gradient.addColorStop(0.18, skin.palette.water);
  gradient.addColorStop(1, rgba(skin.palette.water, 0.96));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, horizonY, width, height - horizonY);
};

const drawMidSwell = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  skin: FocusSkin,
  time: number,
  motion: number,
  seed: number,
) => {
  const horizonY = height * 0.5;
  const swellMotion = motion * (0.55 + skin.ocean.swell * 0.6);
  for (let band = 0; band < 6; band += 1) {
    const y = horizonY + Math.pow((band + 1) / 7, 1.7) * height * 0.4;
    const sway = Math.sin(time * 0.00016 * (0.7 + band * 0.08) + seeded(seed, band) * 6) * (2 + band * 0.8) * swellMotion;
    const bandHeight = height * (0.035 + band * 0.006);
    const gradient = ctx.createLinearGradient(0, y - bandHeight, 0, y + bandHeight);
    gradient.addColorStop(0, rgba(skin.palette.waterHighlight, 0));
    gradient.addColorStop(0.5, rgba(skin.palette.waterHighlight, 0.04 + band * 0.008));
    gradient.addColorStop(1, rgba(skin.palette.waterHighlight, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, y + sway);
    for (let x = 0; x <= width; x += Math.max(16, width / 28)) {
      ctx.lineTo(x, y + sway + Math.sin(x * 0.009 + band * 1.6 + time * 0.0001) * (1.5 + band * 0.45) * swellMotion);
    }
    ctx.lineTo(width, y + bandHeight + sway);
    ctx.lineTo(0, y + bandHeight + sway);
    ctx.closePath();
    ctx.fill();
  }
};

const drawLightPath = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin, strength: number) => {
  const horizonY = height * 0.49;
  const center = width * 0.53;
  const gradient = ctx.createLinearGradient(center, horizonY, center, height);
  gradient.addColorStop(0, rgba(skin.palette.accent, 0.22 * strength));
  gradient.addColorStop(0.45, rgba(skin.palette.accent, 0.08 * strength));
  gradient.addColorStop(1, rgba(skin.palette.accent, 0));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(center - width * 0.025, horizonY);
  ctx.lineTo(center + width * 0.025, horizonY);
  ctx.lineTo(center + width * 0.3, height);
  ctx.lineTo(center - width * 0.36, height);
  ctx.closePath();
  ctx.fill();
};

const drawWindSheen = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin, time: number, wind: number) => {
  const intensity = clamp(wind / 0.7) * (0.5 + skin.ocean.wind * 0.5);
  if (intensity <= 0) return;
  const horizonY = height * 0.5;
  ctx.save();
  ctx.globalAlpha = 0.035 * intensity;
  ctx.fillStyle = skin.palette.waterHighlight;
  for (let index = 0; index < 3; index += 1) {
    const y = horizonY + height * (0.05 + index * 0.045);
    const sway = Math.sin(time * 0.00012 + index * 1.7) * width * 0.012 * intensity;
    ctx.beginPath();
    ctx.moveTo(width * 0.08 + sway, y);
    ctx.quadraticCurveTo(width * 0.46, y - height * 0.012, width * 0.92 - sway, y + height * 0.006);
    ctx.lineTo(width * 0.92 - sway, y + height * 0.025);
    ctx.quadraticCurveTo(width * 0.46, y + height * 0.012, width * 0.08 + sway, y + height * 0.02);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

const drawNearWater = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  skin: FocusSkin,
  time: number,
  speed: number,
  reduceMotion: boolean,
  seed: number,
) => {
  const horizonY = height * 0.5;
  const center = width * 0.5;
  const motion = reduceMotion ? 0.12 : 1;
  const flowSpeed = speed * motion * (0.65 + skin.ocean.flow * 0.55);
  for (let index = 0; index < 24; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const origin = 0.04 + seeded(seed, index + 20) * 0.24;
    const phase = (time * 0.00011 * (0.7 + seeded(seed, index + 40) * 0.7) * flowSpeed + seeded(seed, index + 60)) % 1;
    const spread = Math.pow(phase, 1.22);
    const x = center + side * (spread * width * (0.26 + seeded(seed, index + 80) * 0.34) + origin * width * 0.14);
    const y = horizonY + spread * (height - horizonY) * (0.76 + seeded(seed, index + 100) * 0.22);
    const length = (3 + spread * 22) * (width / 390);
    const alpha = (0.03 + spread * 0.07) * flowSpeed;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(side * (0.3 + spread * 0.35));
    ctx.fillStyle = rgba(skin.palette.waterHighlight, alpha);
    ctx.beginPath();
    ctx.ellipse(0, 0, length, Math.max(1, length * 0.18), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.strokeStyle = rgba(skin.palette.waterHighlight, 0.045 * flowSpeed);
  ctx.lineWidth = Math.max(1, width / 500);
  for (let index = 0; index < 5; index += 1) {
    const y = horizonY + height * (0.16 + index * 0.085);
    const wave = Math.sin(time * 0.00012 + index) * 2 * flowSpeed;
    ctx.beginPath();
    ctx.moveTo(width * 0.08, y + wave);
    ctx.quadraticCurveTo(width * 0.5, y - 3 * flowSpeed + wave, width * 0.92, y + wave);
    ctx.stroke();
  }
};

const drawLandmark = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin, sceneState: SceneState, progress: number, lightStrength: number) => {
  const horizonY = height * 0.49;
  const approaching = sceneState === 'APPROACHING_DESTINATION' || sceneState === 'ARRIVED';
  if (!approaching && sceneState !== 'SEARCHING_HARBOR') return;
  if (sceneState === 'APPROACHING_DESTINATION' && progress < 0.12) return;
  if (sceneState === 'SEARCHING_HARBOR' && progress < 0.84) return;
  const scale = approaching ? 1.05 + clamp(progress) * 0.52 : 1;
  const x = width * 0.78;
  const base = horizonY + 2;
  ctx.save();
  const approachFade = approaching && sceneState !== 'ARRIVED' ? clamp((progress - 0.12) / 0.22) : 1;
  ctx.globalAlpha = (sceneState === 'SEARCHING_HARBOR' ? 0.25 : 0.55) * lightStrength * approachFade * skin.arrivalLandmark.glow;
  ctx.fillStyle = rgba(skin.palette.horizon, 0.75);
  const landmarkKind = skin.arrivalLandmark.kind;
  if (landmarkKind === 'window' || skin.landmark === '따뜻한 창') {
    ctx.fillRect(x - 15 * scale, base - 22 * scale, 30 * scale, 22 * scale);
    ctx.fillStyle = skin.palette.accent;
    ctx.shadowColor = skin.palette.accent;
    ctx.shadowBlur = 12 * scale;
    ctx.fillRect(x - 7 * scale, base - 16 * scale, 5 * scale, 6 * scale);
    ctx.fillRect(x + 3 * scale, base - 16 * scale, 5 * scale, 6 * scale);
  } else if (landmarkKind === 'harbor-light' || skin.landmark === '항구 불빛') {
    ctx.fillRect(x - 22 * scale, base - 7 * scale, 44 * scale, 7 * scale);
    ctx.fillStyle = skin.palette.accent;
    ctx.shadowColor = skin.palette.accent;
    ctx.shadowBlur = 14 * scale;
    for (let index = -1; index <= 1; index += 1) {
      ctx.beginPath();
      ctx.arc(x + index * 14 * scale, base - 13 * scale, 2.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (landmarkKind === 'village' || skin.landmark === '해안 마을') {
    ctx.fillRect(x - 22 * scale, base - 12 * scale, 10 * scale, 12 * scale);
    ctx.fillRect(x - 7 * scale, base - 20 * scale, 14 * scale, 20 * scale);
    ctx.fillRect(x + 10 * scale, base - 9 * scale, 12 * scale, 9 * scale);
    ctx.fillStyle = skin.palette.accent;
    ctx.shadowColor = skin.palette.accent;
    ctx.shadowBlur = 9 * scale;
    ctx.fillRect(x - 3 * scale, base - 14 * scale, 4 * scale, 5 * scale);
    ctx.fillRect(x + 14 * scale, base - 6 * scale, 3 * scale, 3 * scale);
  } else if (landmarkKind === 'buoy' || skin.landmark === '안개 부표') {
    ctx.fillRect(x - 1.5 * scale, base - 25 * scale, 3 * scale, 25 * scale);
    ctx.fillStyle = skin.palette.accent;
    ctx.shadowColor = skin.palette.accent;
    ctx.shadowBlur = 16 * scale;
    ctx.beginPath();
    ctx.arc(x, base - 27 * scale, 5 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(x - 3 * scale, base - 30 * scale, 6 * scale, 30 * scale);
    ctx.beginPath();
    ctx.moveTo(x - 7 * scale, base - 30 * scale);
    ctx.lineTo(x + 7 * scale, base - 30 * scale);
    ctx.lineTo(x, base - 38 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = skin.palette.accent;
    ctx.shadowColor = skin.palette.accent;
    ctx.shadowBlur = 14 * scale;
    ctx.beginPath();
    ctx.arc(x, base - 38 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const drawHarborLights = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin, sceneState: SceneState, searchProgress: number, seed: number, strength: number) => {
  if (!['SEARCHING_HARBOR', 'HARBOR_REST', 'LEAVING_HARBOR'].includes(sceneState)) return;
  const horizonY = height * 0.49;
  const candidateProgress = clamp((searchProgress - 1 / 3) * 3);
  const count = sceneState === 'SEARCHING_HARBOR' ? (searchProgress < 1 / 3 ? 0 : 3) : 1;
  for (let index = 0; index < count; index += 1) {
    const x = width * (0.28 + seeded(seed, index) * 0.52);
    const y = horizonY - 12 - seeded(seed, index + 4) * 16;
    const selected = sceneState === 'SEARCHING_HARBOR' && searchProgress >= 0.66 && index === Math.min(2, Math.floor(candidateProgress * 3));
    const candidateFade = clamp((searchProgress - 1 / 3) / (1 / 6));
    const arrivalGlow = sceneState !== 'SEARCHING_HARBOR' ? 1 : clamp((searchProgress - 0.84) / 0.16);
    const candidateStrength = searchProgress < 2 / 3 ? 0.34 * candidateFade : selected ? 0.34 + arrivalGlow * 0.61 : 0.14;
    ctx.save();
    ctx.globalAlpha = (sceneState === 'SEARCHING_HARBOR' ? candidateStrength : 0.76) * strength;
    ctx.fillStyle = skin.palette.accent;
    ctx.shadowColor = skin.palette.accent;
    ctx.shadowBlur = selected ? 18 : 10;
    ctx.beginPath();
    ctx.arc(x, y, selected ? 3.2 + arrivalGlow * 2 : 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
};

const drawRestHarbor = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin, strength: number) => {
  const horizonY = height * 0.49;
  ctx.save();
  ctx.globalAlpha = 0.58 * strength;
  ctx.fillStyle = rgba(skin.palette.horizon, 0.72);
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 5);
  ctx.lineTo(width * 0.22, horizonY - 2);
  ctx.lineTo(width * 0.35, horizonY + 2);
  ctx.lineTo(width * 0.44, horizonY + height * 0.12);
  ctx.lineTo(0, horizonY + height * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(width, horizonY + 8);
  ctx.lineTo(width * 0.79, horizonY + 1);
  ctx.lineTo(width * 0.67, horizonY + 6);
  ctx.lineTo(width * 0.56, horizonY + height * 0.13);
  ctx.lineTo(width, horizonY + height * 0.17);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(skin.palette.boatEdge, 0.58);
  ctx.lineWidth = Math.max(1, width / 420);
  for (let index = 0; index < 3; index += 1) {
    const x = width * (0.14 + index * 0.075);
    ctx.beginPath();
    ctx.moveTo(x, horizonY + 3);
    ctx.lineTo(x, horizonY + height * 0.12);
    ctx.stroke();
  }
  ctx.fillStyle = skin.palette.accent;
  ctx.shadowColor = skin.palette.accent;
  ctx.shadowBlur = 14;
  ctx.globalAlpha = 0.76 * strength;
  for (const x of [width * 0.2, width * 0.76, width * 0.82]) {
    ctx.beginPath();
    ctx.arc(x, horizonY - 8, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const drawContactFoam = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin, strength: number) => {
  const center = width * 0.5;
  const bowY = height * 0.82;
  const boatWidth = Math.min(width * 0.66, 520);
  ctx.save();
  ctx.strokeStyle = rgba(skin.palette.waterHighlight, 0.2 * strength);
  ctx.lineWidth = Math.max(1.2, width / 250);
  ctx.beginPath();
  ctx.moveTo(center - boatWidth * 0.2, bowY + height * 0.075);
  ctx.quadraticCurveTo(center - boatWidth * 0.38, bowY + height * 0.105, center - boatWidth * 0.5, bowY + height * 0.13);
  ctx.moveTo(center + boatWidth * 0.2, bowY + height * 0.075);
  ctx.quadraticCurveTo(center + boatWidth * 0.38, bowY + height * 0.105, center + boatWidth * 0.5, bowY + height * 0.13);
  ctx.stroke();
  ctx.restore();
};

const drawBoatRope = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin, time: number, motion: number) => {
  const center = width * 0.5;
  const boatWidth = Math.min(width * 0.66, 520);
  const bowY = height * 0.82 + Math.sin(time * 0.00105) * skin.vessel.bob * 0.55 * motion;
  const edgeY = height * 0.91 + Math.sin(time * 0.00105) * skin.vessel.bob * 0.55 * motion;
  const ropeX = center - boatWidth * 0.27;
  ctx.save();
  ctx.strokeStyle = rgba(skin.vessel.rope, 0.56);
  ctx.lineWidth = Math.max(1, width / 520);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ropeX, edgeY - height * 0.012);
  ctx.quadraticCurveTo(center - boatWidth * 0.31, edgeY - height * 0.035, center - boatWidth * 0.3, edgeY + height * 0.008);
  ctx.quadraticCurveTo(center - boatWidth * 0.29, edgeY + height * 0.045, center - boatWidth * 0.34, edgeY + height * 0.04);
  ctx.stroke();
  ctx.globalAlpha = 0.42;
  ctx.beginPath();
  ctx.moveTo(center - boatWidth * 0.28, bowY + height * 0.05);
  ctx.quadraticCurveTo(center - boatWidth * 0.31, bowY + height * 0.07, center - boatWidth * 0.29, bowY + height * 0.085);
  ctx.stroke();
  ctx.restore();
};

const drawFirstPersonBoat = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  skin: FocusSkin,
  sceneState: SceneState,
  time: number,
  motion: number,
  reduceMotion: boolean,
) => {
  const center = width * 0.5;
  const boatWidth = Math.min(width * 0.66, 520);
  const bob = reduceMotion ? 0 : Math.sin(time * 0.00105) * skin.vessel.bob * 0.55 * motion;
  const roll = reduceMotion ? 0 : Math.sin(time * 0.00062) * (skin.vessel.roll * Math.PI / 180) * 0.5 * motion;
  const bowY = height * 0.82 + bob;
  const edgeY = height * 0.91 + bob;
  ctx.save();
  ctx.translate(0, sceneState === 'CAST_OFF' || sceneState === 'LEAVING_HARBOR' ? bob * 0.3 : 0);
  ctx.translate(center, bowY);
  ctx.rotate(roll);
  ctx.translate(-center, -bowY);

  ctx.fillStyle = rgba(skin.vessel.hull, 0.98);
  ctx.beginPath();
  ctx.moveTo(center, bowY);
  ctx.quadraticCurveTo(center - boatWidth * 0.18, bowY + height * 0.055, center - boatWidth * 0.5, edgeY);
  ctx.lineTo(center - boatWidth * 0.44, height + 4);
  ctx.lineTo(center + boatWidth * 0.44, height + 4);
  ctx.lineTo(center + boatWidth * 0.5, edgeY);
  ctx.quadraticCurveTo(center + boatWidth * 0.18, bowY + height * 0.055, center, bowY);
  ctx.closePath();
  ctx.fill();

  const interior = ctx.createLinearGradient(0, bowY, 0, height);
  interior.addColorStop(0, rgba(skin.vessel.edge, 0.34));
  interior.addColorStop(0.32, rgba(skin.vessel.hull, 0.25));
  interior.addColorStop(1, rgba('#000000', 0.24));
  ctx.fillStyle = interior;
  ctx.beginPath();
  ctx.moveTo(center, bowY + height * 0.02);
  ctx.quadraticCurveTo(center - boatWidth * 0.15, bowY + height * 0.08, center - boatWidth * 0.37, edgeY + height * 0.02);
  ctx.lineTo(center - boatWidth * 0.31, height + 3);
  ctx.lineTo(center + boatWidth * 0.31, height + 3);
  ctx.lineTo(center + boatWidth * 0.37, edgeY + height * 0.02);
  ctx.quadraticCurveTo(center + boatWidth * 0.15, bowY + height * 0.08, center, bowY + height * 0.02);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = skin.vessel.edge;
  ctx.lineWidth = Math.max(1.5, width / 240);
  ctx.beginPath();
  ctx.moveTo(center, bowY);
  ctx.quadraticCurveTo(center - boatWidth * 0.2, bowY + height * 0.05, center - boatWidth * 0.5, edgeY);
  ctx.moveTo(center, bowY);
  ctx.quadraticCurveTo(center + boatWidth * 0.2, bowY + height * 0.05, center + boatWidth * 0.5, edgeY);
  ctx.stroke();
  ctx.strokeStyle = rgba(skin.vessel.edge, 0.5);
  ctx.lineWidth = Math.max(1, width / 430);
  ctx.beginPath();
  ctx.moveTo(center - boatWidth * 0.38, edgeY + height * 0.02);
  ctx.lineTo(center - boatWidth * 0.32, height + 2);
  ctx.moveTo(center + boatWidth * 0.38, edgeY + height * 0.02);
  ctx.lineTo(center + boatWidth * 0.32, height + 2);
  ctx.stroke();
  ctx.restore();
};

const drawDockAndRope = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin, visible: boolean, dockParallax: number, ropeTension: number) => {
  if (!visible) return;
  const dockOffset = dockParallax * width * 0.3;
  const dockX = -width * 0.04 - dockOffset;
  const dockY = height * 0.64;
  ctx.save();
  ctx.fillStyle = rgba(skin.vessel.hull, 0.8);
  ctx.beginPath();
  ctx.moveTo(dockX, dockY);
  ctx.lineTo(dockX + width * 0.25, dockY + height * 0.02);
  ctx.lineTo(dockX + width * 0.31, dockY + height * 0.06);
  ctx.lineTo(dockX, dockY + height * 0.065);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = rgba(skin.vessel.edge, 0.64);
  ctx.lineWidth = Math.max(1, width / 390);
  for (let index = 0; index < 4; index += 1) {
    ctx.beginPath();
    ctx.moveTo(dockX + width * 0.035 + index * width * 0.055, dockY + height * 0.055);
    ctx.lineTo(dockX + width * 0.035 + index * width * 0.055, dockY + height * 0.15);
    ctx.stroke();
  }
  if (ropeTension > 0.04) {
    ctx.strokeStyle = rgba(skin.vessel.rope, 0.78 * ropeTension);
    ctx.lineWidth = Math.max(1, width / 420);
    ctx.beginPath();
    ctx.moveTo(width * 0.16 - dockOffset * 0.4, dockY + height * 0.035);
    ctx.quadraticCurveTo(width * 0.3, height * 0.73, width * 0.46, height * 0.81);
    ctx.stroke();
  }
  ctx.restore();
};

const drawCompass = (ctx: CanvasRenderingContext2D, width: number, height: number, skin: FocusSkin, progress: number) => {
  const compassProgress = clamp((progress - 0.66) / 0.2);
  if (compassProgress <= 0 || progress >= 0.88) return;
  const x = width * 0.5;
  const y = height * 0.28;
  const radius = Math.min(width, height) * 0.14;
  ctx.save();
  ctx.globalAlpha = Math.min(1, compassProgress * 1.6);
  ctx.strokeStyle = rgba(skin.palette.accent, 0.46);
  ctx.lineWidth = Math.max(1, width / 600);
  ctx.beginPath();
  ctx.arc(x, y, radius, Math.PI * 0.16, Math.PI * 0.84);
  ctx.stroke();
  ctx.strokeStyle = rgba(skin.palette.accent, 0.8);
  ctx.beginPath();
  const angle = Math.PI * (0.16 + 0.68 * compassProgress);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
  ctx.stroke();
  ctx.restore();
};

export function renderScene(options: SceneRenderOptions) {
  const { canvas, width, height, time, sceneState, progress, skin, reduceMotion, seed, harborSearchProgress = 0 } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, width, height);
  const searchProgress = clamp(harborSearchProgress);
  const profile = profileFor(sceneState, progress, searchProgress);
  const motion = reduceMotion ? 0.12 : profile.boatMotion;

  drawSky(ctx, width, height, skin, progress);
  drawHorizon(ctx, width, height, skin);
  drawFarWater(ctx, width, height, skin);
  drawMidSwell(ctx, width, height, skin, time, profile.waterSpeed, seed);
  drawLightPath(ctx, width, height, skin, profile.lightStrength);
  drawWindSheen(ctx, width, height, skin, time, profile.wind);
  drawNearWater(ctx, width, height, skin, time, profile.waterSpeed, reduceMotion, seed);
  drawLandmark(ctx, width, height, skin, sceneState, progress, profile.lightStrength);
  drawHarborLights(ctx, width, height, skin, sceneState, searchProgress, seed, profile.lightStrength);
  if (sceneState === 'HARBOR_REST') drawRestHarbor(ctx, width, height, skin, profile.lightStrength);
  if (sceneState === 'SEARCHING_HARBOR') drawCompass(ctx, width, height, skin, searchProgress);
  drawContactFoam(ctx, width, height, skin, profile.foam);
  drawDockAndRope(ctx, width, height, skin, profile.dockVisible, profile.dockParallax, profile.ropeTension);
  drawFirstPersonBoat(ctx, width, height, skin, sceneState, time, motion, reduceMotion);
  drawBoatRope(ctx, width, height, skin, time, motion);

  if (skin.id === 'FOG') {
    const fog = ctx.createLinearGradient(0, height * 0.24, 0, height * 0.7);
    fog.addColorStop(0, 'rgba(232, 237, 226, .14)');
    fog.addColorStop(1, 'rgba(232, 237, 226, 0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, height * 0.18, width, height * 0.52);
  }
}
