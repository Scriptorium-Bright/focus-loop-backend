import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { FocusSkin } from '../domain/skins';
import type { SceneState } from '../domain/session/sessionTypes';
import { dawnStaticScenePathFor, dawnStaticScenePaths } from './dawnStaticScenes';
import { renderScene } from './sceneRenderer';

interface SceneCanvasProps {
  sceneState: SceneState;
  progress: number;
  skin: FocusSkin;
  reduceMotion: boolean;
  seed: number;
  harborSearchProgress?: number;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
  onFps?: (fps: number) => void;
  ariaLabel?: string;
}

export function SceneCanvas({
  sceneState,
  progress,
  skin,
  reduceMotion,
  seed,
  harborSearchProgress = 0,
  className = '',
  onClick,
  onError,
  onFps,
  ariaLabel = '1인칭 항해 장면',
}: SceneCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const onFpsRef = useRef(onFps);
  onFpsRef.current = onFps;
  const sceneRef = useRef({ sceneState, progress, skin, reduceMotion, seed, harborSearchProgress });
  sceneRef.current = { sceneState, progress, skin, reduceMotion, seed, harborSearchProgress };
  const [failed, setFailed] = useState(false);
  const isDawnStaticScene = skin.id === 'DAWN';

  useEffect(() => {
    if (!isDawnStaticScene) return undefined;
    const preload = dawnStaticScenePaths.map((path) => {
      const image = new Image();
      image.src = path;
      return image;
    });
    return () => preload.forEach((image) => { image.src = ''; });
  }, [isDawnStaticScene]);

  useEffect(() => {
    if (isDawnStaticScene) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    setFailed(false);
    let failureReported = false;
    const reportFailure = () => {
      if (failureReported) return;
      failureReported = true;
      setFailed(true);
      onErrorRef.current?.();
    };
    if (!canvas.getContext('2d')) {
      reportFailure();
      return undefined;
    }
    const host = canvas.parentElement;
    if (!host) return undefined;
    let frame = 0;
    let width = 0;
    let height = 0;
    let bufferWidth = 0;
    let bufferHeight = 0;
    let resizeObserver: ResizeObserver | undefined;
    let pageVisible = document.visibilityState !== 'hidden';
    let sampleStartedAt = 0;
    let sampleFrames = 0;
    let disposed = false;
    const scheduleDraw = () => {
      if (frame || disposed || !pageVisible) return;
      frame = requestAnimationFrame(draw);
    };
    const resize = () => {
      // Measure the canvas after CSS has assigned its layout size. Measuring
      // the parent and writing that value back to a percentage-height canvas
      // can make auto-sized cards grow on every ResizeObserver callback.
      const bounds = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, bounds.width || host.clientWidth);
      const nextHeight = Math.max(1, bounds.height || host.clientHeight);
      width = nextWidth;
      height = nextHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextBufferWidth = Math.floor(width * dpr);
      const nextBufferHeight = Math.floor(height * dpr);
      // Writing canvas.width or canvas.height clears the drawing buffer. Only
      // reset it when the effective pixel dimensions actually changed.
      if (nextBufferWidth !== bufferWidth || nextBufferHeight !== bufferHeight) {
        bufferWidth = nextBufferWidth;
        bufferHeight = nextBufferHeight;
        canvas.width = bufferWidth;
        canvas.height = bufferHeight;
        canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      scheduleDraw();
    };
    const draw = (time: number) => {
      frame = 0;
      try {
        if (!sampleStartedAt) sampleStartedAt = time;
        sampleFrames += 1;
        if (time - sampleStartedAt >= 1000) {
          onFpsRef.current?.(Math.round(sampleFrames * 1000 / (time - sampleStartedAt)));
          sampleStartedAt = time;
          sampleFrames = 0;
        }
        if (!width || !height) resize();
        const scene = sceneRef.current;
        renderScene({ canvas, width, height, time, ...scene });
      } catch {
        reportFailure();
      }
      const scene = sceneRef.current;
      if (pageVisible && (!scene.reduceMotion || scene.sceneState === 'SEARCHING_HARBOR')) scheduleDraw();
    };
    const onVisibility = () => {
      pageVisible = document.visibilityState !== 'hidden';
      if (!pageVisible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else scheduleDraw();
    };
    resize();
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
    } else {
      window.addEventListener('resize', resize);
    }
    document.addEventListener('visibilitychange', onVisibility);
    if (pageVisible) scheduleDraw();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isDawnStaticScene]);

  const revealWithKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (!onClick || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    onClick();
  };

  if (failed) {
    return (
      <div className={`scene-fallback ${className}`} role="img" aria-label={`${ariaLabel} 정적 화면`} onClick={onClick} tabIndex={onClick ? 0 : undefined} onKeyDown={revealWithKeyboard}>
        <div className="scene-fallback-horizon" />
        <div className="scene-fallback-bow" />
        <span>{skin.name}</span>
      </div>
    );
  }
  if (isDawnStaticScene) {
    return (
      <img
        src={dawnStaticScenePathFor(sceneState)}
        className={`scene-static-art ${className}`}
        role="img"
        aria-label={ariaLabel}
        onClick={onClick}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={revealWithKeyboard}
        onError={() => {
          setFailed(true);
          onErrorRef.current?.();
        }}
      />
    );
  }
  return (
    <canvas
      ref={canvasRef}
      className={`scene-canvas ${className}`}
      role="img"
      aria-label={ariaLabel}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={revealWithKeyboard}
    />
  );
}
