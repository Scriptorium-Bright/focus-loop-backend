import { useEffect, useMemo, useReducer, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AmbientAudio } from '../audio/ambientAudio';
import { LocalAnalytics, taskLengthBucket } from '../analytics/analytics';
import { isSkinEntitled, normalizeEntitlementCache, type EntitlementCache } from '../domain/entitlements';
import { advanceJourney, defaultJourneys, getJourneyTask, type Journey } from '../domain/journeys';
import { logbookFromSession, type LogbookEntry } from '../domain/logbook';
import { createLogbookThumbnail } from '../logbook/logbookThumbnail';
import { defaultSkin, findSkin, skins } from '../domain/skins';
import { getFocusSeconds, getRestSeconds } from '../domain/session/timerClock';
import { initialSessionMachine, sessionReducer } from '../domain/session/sessionReducer';
import type { FocusMode, FocusSession, RestMode, SessionMachine, TimerMode } from '../domain/session/sessionTypes';
import { defaultTasks, type FocusTask } from '../domain/tasks';
import { defaultSettings, repository, type LocalSettings } from '../storage/localRepository';
import { downloadBlob, logbookToCsv } from '../storage/exportFormats';
import { enqueueSyncEvent } from '../sync/syncQueue';
import { logbookSyncEvent, logbookTombstoneEvent, sessionSyncEvent } from '../sync/syncEvents';
import { createFetchSyncTransport, flushSyncQueue } from '../sync/syncTransport';
import { createFetchPurchaseGateway, unavailablePurchaseGateway } from '../purchase/purchaseGateway';
import { getSceneProgress } from '../scene/sceneTiming';
import { AppShell, type AppScreen } from '../ui/AppShell';
import { FocusScreen } from '../ui/FocusScreen';
import { HomeScreen } from '../ui/HomeScreen';
import { JourneysScreen } from '../ui/JourneysScreen';
import { LogbookScreen } from '../ui/LogbookScreen';
import { Onboarding } from '../ui/Onboarding';
import { RestScreen } from '../ui/RestScreen';
import { SettingsScreen } from '../ui/SettingsScreen';
import { SkinsScreen } from '../ui/SkinsScreen';
import { SessionRecovery } from '../ui/SessionRecovery';

const statusScreen = (machine: SessionMachine): AppScreen => machine.status === 'RESTING' ? 'REST' : 'FOCUS';

function initialMachine() {
  return repository.loadSession() ?? { ...initialSessionMachine, now: Date.now() };
}

function materializeSession(machine: SessionMachine): FocusSession | null {
  if (!machine.session) return null;
  return {
    ...machine.session,
    status: machine.status,
    focusedSeconds: getFocusSeconds(machine.session, machine.now),
    restSeconds: getRestSeconds(machine.session, machine.now),
  };
}

export default function App() {
  const [machine, dispatch] = useReducer(sessionReducer, undefined, initialMachine);
  const [screen, setScreen] = useState<AppScreen>(() => {
    const stored = initialMachine();
    return stored.session && stored.status !== 'READY' ? statusScreen(stored) : 'HOME';
  });
  const [settings, setSettings] = useState<LocalSettings>(() => ({ ...defaultSettings, ...repository.loadSettings() }));
  const [tasks, setTasks] = useState<FocusTask[]>(() => repository.loadTasks(defaultTasks));
  const [journeys, setJourneys] = useState<Journey[]>(() => repository.loadJourneys(defaultJourneys));
  const [logbook, setLogbook] = useState<LogbookEntry[]>(() => repository.loadLogbook());
  const [mode, setMode] = useState<FocusMode>('QUICK');
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(tasks[0]?.id);
  const [selectedJourneyId, setSelectedJourneyId] = useState(journeys[0]?.id ?? '');
  const [timerMode, setTimerMode] = useState<TimerMode>('COUNTDOWN');
  const [plannedSeconds, setPlannedSeconds] = useState(1500);
  const [audioError, setAudioError] = useState(false);
  const [exportError, setExportError] = useState(false);
  const [syncQueue, setSyncQueue] = useState(() => repository.loadSyncQueue());
  const [syncMessage, setSyncMessage] = useState('');
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [entitlements, setEntitlements] = useState<EntitlementCache>(() => repository.loadEntitlements());
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [sceneFps, setSceneFps] = useState<number | null>(null);
  const [recoveryPending, setRecoveryPending] = useState(() => {
    const stored = repository.loadSession();
    return Boolean(stored?.session && stored.status !== 'READY');
  });
  const audioRef = useRef<AmbientAudio>();
  const analyticsRef = useRef(new LocalAnalytics());
  const machineRef = useRef(machine);
  machineRef.current = machine;

  if (!audioRef.current) audioRef.current = new AmbientAudio();

  const selectedSkin = findSkin(settings.skinId || defaultSkin.id);
  const sessionSkin = findSkin(machine.session?.skinId ?? selectedSkin.id);
  const entitlementSkinIds = skins.filter((skin) => isSkinEntitled(entitlements, skin.id)).map((skin) => skin.id);
  const unlockedSkinIds = [...new Set([...entitlementSkinIds, ...(journeys.some((journey) => journey.completedAt) ? ['FOG'] : [])])];
  const liveSession = machine.session ? materializeSession(machine) : null;
  const focusSeconds = liveSession?.focusedSeconds ?? 0;
  const isSession = Boolean(machine.session && machine.status !== 'READY');

  const queueSync = (event: ReturnType<typeof sessionSyncEvent> | ReturnType<typeof logbookSyncEvent> | ReturnType<typeof logbookTombstoneEvent> | undefined) => {
    if (!event) return;
    const current = repository.loadSyncQueue();
    const next = enqueueSyncEvent(current, event);
    if (next.length === current.length) return;
    repository.saveSyncQueue(next);
    setSyncQueue(next);
  };

  useEffect(() => {
    const interval = window.setInterval(() => dispatch({ type: 'TICK', now: Date.now() }), 250);
    const onVisibility = () => dispatch({ type: 'TICK', now: Date.now() });
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const persistenceKey = machine.status === 'READY'
    ? 'READY'
    : JSON.stringify({ status: machine.status, sceneState: machine.sceneState, session: machine.session });

  useEffect(() => {
    if (machine.status === 'READY') repository.clearSession();
    else {
      repository.saveSession(machine);
      queueSync(sessionSyncEvent(machine));
    }
    if (machine.session && machine.status !== 'READY') setScreen(statusScreen(machine));
  }, [persistenceKey]);

  useEffect(() => {
    const refresh = () => setSyncQueue(repository.loadSyncQueue());
    const interval = window.setInterval(refresh, 15_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  useEffect(() => {
    const persist = () => {
      const current = machineRef.current;
      if (current.status !== 'READY') repository.saveSession(current);
    };
    const snapshotInterval = window.setInterval(persist, 15_000);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') persist();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(snapshotInterval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => repository.saveSettings(settings), [settings]);
  useEffect(() => repository.saveTasks(tasks), [tasks]);
  useEffect(() => repository.saveJourneys(journeys), [journeys]);
  useEffect(() => repository.saveLogbook(logbook), [logbook]);
  useEffect(() => repository.saveEntitlements(entitlements), [entitlements]);

  useEffect(() => {
    analyticsRef.current.track('app_opened', { source: 'web', platform: 'web' });
  }, []);

  useEffect(() => {
    if (!isSession && screen === 'HOME') analyticsRef.current.track('home_viewed', { mode, skin_id: selectedSkin.id });
  }, [isSession, mode, screen, selectedSkin.id]);

  useEffect(() => {
    if (machine.status !== 'DEPARTING') return undefined;
    const timeout = window.setTimeout(() => dispatch({ type: 'DEPARTURE_END', now: Date.now() }), settings.reduceMotion ? 800 : 2400);
    return () => window.clearTimeout(timeout);
  }, [machine.status, settings.reduceMotion]);

  useEffect(() => {
    if (machine.status !== 'RESUMING') return undefined;
    const timeout = window.setTimeout(() => dispatch({ type: 'RESUMING_END', now: Date.now() }), settings.reduceMotion ? 650 : 1800);
    return () => window.clearTimeout(timeout);
  }, [machine.status, settings.reduceMotion]);

  useEffect(() => {
    if (machine.status !== 'ARRIVING') return undefined;
    const timeout = window.setTimeout(() => dispatch({ type: 'ARRIVAL_END', now: Date.now() }), settings.reduceMotion ? 800 : 2400);
    return () => window.clearTimeout(timeout);
  }, [machine.status, settings.reduceMotion]);

  useEffect(() => {
    if (machine.status === 'READY' || !settings.soundEnabled) audioRef.current?.stop();
  }, [machine.status, settings.soundEnabled]);

  useEffect(() => {
    if (machine.status === 'READY' || !settings.soundEnabled) return;
    const transitionProgress = getSceneProgress(machine, settings.reduceMotion);
    const castOffMix = Math.min(1, Math.max(0, (transitionProgress - 1.5 / 2.4) / (1 / 2.4)));
    const leavingMix = Math.min(1, Math.max(0, (transitionProgress - 0.3 / 1.8) / (1.5 / 1.8)));
    const scale = machine.sceneState === 'HARBOR_REST'
      ? 0.3
      : machine.sceneState === 'SEARCHING_HARBOR'
        ? 0.55
        : machine.sceneState === 'APPROACHING_DESTINATION'
          ? 1 - transitionProgress * 0.72
          : machine.sceneState === 'CAST_OFF' || machine.sceneState === 'LEAVING_HARBOR'
            ? 0.55 + (machine.sceneState === 'CAST_OFF' ? castOffMix : leavingMix) * 0.45
            : machine.sceneState === 'ARRIVED'
              ? 0.22
              : 1;
    audioRef.current?.setProfile({
      ...sessionSkin.audio,
      water: sessionSkin.audio.water * scale,
      swell: sessionSkin.audio.swell * scale,
    });
  }, [machine.now, machine.sceneState, machine.status, sessionSkin.audio, settings.reduceMotion, settings.soundEnabled]);

  useEffect(() => {
    if (machine.status === 'READY') setRecoveryPending(false);
  }, [machine.status]);

  const activeTask = useMemo(() => {
    if (mode === 'JOURNEY') {
      const journey = journeys.find((item) => item.id === selectedJourneyId);
      return journey ? getJourneyTask(journey, tasks) : undefined;
    }
    return tasks.find((task) => task.id === selectedTaskId);
  }, [journeys, mode, selectedJourneyId, selectedTaskId, tasks]);

  const start = () => {
    const title = mode === 'QUICK' ? taskTitle.trim() : activeTask?.title ?? taskTitle.trim();
    if (!title || (mode !== 'QUICK' && !activeTask)) return;
    analyticsRef.current.track('task_entered', { length_bucket: taskLengthBucket(title) });
    analyticsRef.current.track('duration_selected', { timer_mode: timerMode, planned_seconds: plannedSeconds });
    analyticsRef.current.track('session_start_requested', { mode, skin_id: selectedSkin.id });
    analyticsRef.current.track('departure_started', { skin_id: selectedSkin.id });
    startAudio(selectedSkin);
    dispatch({ type: 'START', now: Date.now(), taskTitle: title, taskId: mode === 'QUICK' ? undefined : activeTask?.id, journeyId: mode === 'JOURNEY' ? selectedJourneyId : undefined, mode, timerMode, plannedSeconds, skinId: selectedSkin.id, seed: Math.floor(Math.random() * 100000) });
    setScreen('FOCUS');
  };

  const saveCompletion = (taskCompleted: boolean, note: string) => {
    const session = materializeSession(machine);
    if (!session) return;
    const completedAt = Date.now();
    const entry = logbookFromSession({ ...session, taskCompleted, note }, completedAt);
    setLogbook((current) => [entry, ...current.filter((item) => item.id !== entry.id)]);
    queueSync(logbookSyncEvent(entry));
    analyticsRef.current.track('task_completion_selected', { completed: taskCompleted });
    analyticsRef.current.track('logbook_saved', { mode: session.mode, skin_id: session.skinId });
    if (taskCompleted && session.taskId) setTasks((current) => current.map((task) => task.id === session.taskId ? { ...task, completed: true } : task));
    if (taskCompleted && session.mode === 'JOURNEY' && session.taskId && session.journeyId) {
      setJourneys((current) => current.map((journey) => journey.id === session.journeyId
        ? advanceJourney(journey, tasks, session.taskId!, session.focusedSeconds, completedAt)
        : journey));
    }
    dispatch({ type: 'SAVE', now: completedAt, taskCompleted, note });
    // Clear the recoverable in-flight snapshot immediately. The reducer and
    // persistence effect will converge to READY as well, but an explicit
    // clear prevents a fast reload from resurrecting the just-saved voyage.
    repository.clearSession();
    setScreen('HOME');
    setTaskTitle(session.taskTitle);
  };

  const deleteLogbookEntry = (entry: LogbookEntry) => {
    if (window.confirm(`"${entry.title}" 기록을 삭제할까요?`)) {
      setLogbook((current) => current.filter((item) => item.id !== entry.id));
      queueSync(logbookTombstoneEvent(entry.id));
    }
  };

  const deleteAllLogbook = () => {
    if (logbook.length > 0 && window.confirm('항해일지 기록을 모두 삭제할까요?')) {
      setLogbook([]);
      logbook.forEach((entry) => queueSync(logbookTombstoneEvent(entry.id)));
    }
  };

  const exportLocalData = () => {
    const content = repository.exportData({ settings, tasks, journeys, logbook, session: machine, syncQueue });
    downloadBlob(content, 'application/json', `focusloop-export-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const exportLogbookCsv = () => {
    downloadBlob(logbookToCsv(logbook), 'text/csv;charset=utf-8', `focusloop-logbook-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const exportLogbookImage = async (entry: LogbookEntry) => {
    try {
      const blob = await createLogbookThumbnail(entry, findSkin(entry.skinId));
      if (!blob) {
        setExportError(true);
        return;
      }
      downloadBlob(blob, 'image/png', `focusloop-voyage-${entry.id}.png`);
    } catch {
      setExportError(true);
    }
  };

  const retrySync = async () => {
    if (!online) {
      setSyncMessage('오프라인 상태라 대기열을 유지합니다.');
      return;
    }
    const endpoint = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_FOCUSLOOP_SYNC_URL;
    if (!endpoint) {
      setSyncMessage('동기화 서버가 설정되지 않아 이 기기에 보관합니다.');
      return;
    }
    const result = await flushSyncQueue(repository.loadSyncQueue(), createFetchSyncTransport(endpoint), Date.now());
    repository.saveSyncQueue(result.queue);
    setSyncQueue(result.queue);
    setSyncMessage(result.failed > 0 ? `${result.sent}개 전송, ${result.failed}개 재시도 대기` : `${result.sent}개 전송 완료`);
  };

  const purchaseSkin = async (skinId: string) => {
    setPurchaseMessage('구매 상태를 확인하는 중입니다.');
    analyticsRef.current.track('skin_purchase_started', { skin_id: skinId });
    const endpoint = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_FOCUSLOOP_PURCHASE_URL;
    const gateway = endpoint ? createFetchPurchaseGateway(endpoint) : unavailablePurchaseGateway;
    const result = await gateway.purchaseSkin(skinId);
    if (result.status === 'SUCCESS' && result.entitlements) {
      setEntitlements(normalizeEntitlementCache(result.entitlements));
      setPurchaseMessage('구매한 환경을 오프라인에서도 사용할 수 있도록 저장했습니다.');
      analyticsRef.current.track('skin_purchase_completed', { skin_id: skinId });
      return;
    }
    setPurchaseMessage(result.message || (result.status === 'UNAVAILABLE' ? '구매 서버가 설정되지 않았습니다.' : '구매를 완료하지 못했습니다.'));
  };

  const restoreEntitlements = async () => {
    setPurchaseMessage('구매 내역을 복원하는 중입니다.');
    const endpoint = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_FOCUSLOOP_PURCHASE_URL;
    const gateway = endpoint ? createFetchPurchaseGateway(endpoint) : unavailablePurchaseGateway;
    const result = await gateway.restoreEntitlements();
    if (result.status === 'SUCCESS' && result.entitlements) {
      setEntitlements(normalizeEntitlementCache(result.entitlements));
      setPurchaseMessage('구매 내역을 복원했습니다.');
      return;
    }
    setPurchaseMessage(result.message || (result.status === 'UNAVAILABLE' ? '권한 복원 서버가 설정되지 않았습니다.' : '구매 내역을 복원하지 못했습니다.'));
  };

  useEffect(() => {
    const endpoint = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_FOCUSLOOP_SYNC_URL;
    if (!online || !endpoint || syncQueue.length === 0) return;
    void retrySync();
  }, [online, syncQueue.length]);

  const abort = () => {
    if (!machine.session) return;
    if (window.confirm('이번 항해를 중간 정박으로 기록할까요?')) dispatch({ type: 'ABORT', now: Date.now() });
  };

  const recordRecoveredSession = () => {
    dispatch({ type: 'ABORT', now: Date.now() });
    setRecoveryPending(false);
  };

  const continueFromEntry = (entry: LogbookEntry) => {
    setMode('QUICK');
    setTaskTitle(entry.title);
    setTimerMode('STOPWATCH');
    setPlannedSeconds(1500);
    startDirect(entry.title, undefined, 'QUICK', 'STOPWATCH');
  };

  const startJourney = (journey: Journey) => {
    const task = getJourneyTask(journey, tasks);
    if (!task) return;
    setSelectedJourneyId(journey.id);
    setMode('JOURNEY');
    startDirect(task.title, task.id, 'JOURNEY', 'COUNTDOWN', task.estimatedSeconds, journey.id);
  };

  const createJourney = (title: string) => {
    const suffix = Date.now().toString(36);
    const taskId = `task-${suffix}`;
    const stageId = `stage-${suffix}`;
    setTasks((current) => [...current, { id: taskId, title: `${title} 첫 작업`, estimatedSeconds: 1500, completed: false, journeyId: `journey-${suffix}`, stageId }]);
    setJourneys((current) => [...current, { id: `journey-${suffix}`, title, stages: [{ id: stageId, title: '첫 단계', taskIds: [taskId], completed: false }], activeTaskId: taskId, accumulatedSeconds: 0 }]);
  };

  const promoteToDaily = (entry: LogbookEntry) => {
    const existing = tasks.find((task) => !task.journeyId && task.title === entry.title);
    const taskId = existing?.id ?? `task-${Date.now().toString(36)}`;
    if (!existing) {
      setTasks((current) => [...current, { id: taskId, title: entry.title, estimatedSeconds: entry.plannedSeconds || 1500, completed: false }]);
    }
    setMode('DAILY');
    setSelectedTaskId(taskId);
    setTaskTitle(entry.title);
    setPlannedSeconds(entry.plannedSeconds || 1500);
    setScreen('HOME');
  };

  const promoteToJourney = (entry: LogbookEntry) => {
    const suffix = Date.now().toString(36);
    const journeyId = `journey-${suffix}`;
    const stageId = `stage-${suffix}`;
    const taskId = `task-${suffix}`;
    setTasks((current) => [...current, { id: taskId, title: entry.title, estimatedSeconds: entry.plannedSeconds || 1500, completed: false, journeyId, stageId }]);
    setJourneys((current) => [...current, { id: journeyId, title: `${entry.title} 여정`, stages: [{ id: stageId, title: '첫 단계', taskIds: [taskId], completed: false }], activeTaskId: taskId, accumulatedSeconds: 0 }]);
    setMode('JOURNEY');
    setSelectedJourneyId(journeyId);
    setTaskTitle(entry.title);
    setPlannedSeconds(entry.plannedSeconds || 1500);
    setScreen('HOME');
  };

  const startDirect = (title: string, taskId: string | undefined, nextMode: FocusMode, nextTimerMode: TimerMode, seconds = plannedSeconds, journeyId = selectedJourneyId) => {
    setSelectedJourneyId(journeyId);
    startAudio(selectedSkin);
    dispatch({ type: 'START', now: Date.now(), taskTitle: title, taskId, journeyId: nextMode === 'JOURNEY' ? journeyId : undefined, mode: nextMode, timerMode: nextTimerMode, plannedSeconds: seconds, skinId: selectedSkin.id, seed: Math.floor(Math.random() * 100000) });
    setScreen('FOCUS');
  };

  const changeSettings = (next: LocalSettings) => {
    setSettings(next);
    audioRef.current?.setEnabled(next.soundEnabled);
    if (!next.soundEnabled) setAudioError(false);
  };

  const startAudio = (skin: typeof selectedSkin) => {
    audioRef.current?.setEnabled(settings.soundEnabled);
    if (!settings.soundEnabled) return true;
    audioRef.current?.setProfile(skin.audio);
    const started = audioRef.current?.start(skin.audio) ?? false;
    if (!started) setAudioError(true);
    return started;
  };

  const toggleSound = () => {
    const next = !settings.soundEnabled;
    changeSettings({ ...settings, soundEnabled: next });
    if (next && machine.status !== 'READY') {
      audioRef.current?.setEnabled(true);
      audioRef.current?.setProfile(sessionSkin.audio);
      if (!audioRef.current?.start(sessionSkin.audio)) setAudioError(true);
    }
  };

  const handlePause = () => {
    analyticsRef.current.track('pause_requested', { focused_seconds: focusSeconds });
    dispatch({ type: 'PAUSE', now: Date.now() });
  };

  const handleRestModeChange = (restMode: RestMode) => {
    analyticsRef.current.track('rest_started', { rest_mode: restMode });
    dispatch({ type: 'REST_START', now: Date.now(), mode: restMode });
  };

  const handleResume = () => {
    analyticsRef.current.track('resume_requested', { pause_index: machine.session?.pauseCount ?? 0 });
    dispatch({ type: 'RESUME', now: Date.now() });
  };

  const handleFocusSceneFailure = () => {
    if (machine.status === 'HARBOR_SEARCH') dispatch({ type: 'HARBOR_SEARCH_SKIP', now: Date.now(), harborId: `${sessionSkin.id.toLowerCase()}-harbor-1` });
    else if (machine.status === 'ARRIVING') dispatch({ type: 'ARRIVAL_END', now: Date.now() });
    else if (machine.status === 'DEPARTING') dispatch({ type: 'SKIP_DEPARTURE', now: Date.now() });
  };

  const rootStyle = { '--scene-brightness': settings.brightness } as CSSProperties;
  const noticeMessage = audioError ? '소리를 재생할 수 없어 무음으로 항해를 계속합니다.' : exportError ? '항해일지 이미지를 만들 수 없습니다.' : !online ? '오프라인 상태 · 세션과 기록은 이 기기에 저장됩니다.' : undefined;
  // A persisted in-flight session owns the shell until it reaches SAVE. This
  // prevents navigating to Home and dispatching a second START over it.
  let content: ReactNode;
  if (isSession && machine.status === 'RESTING') {
    content = <RestScreen machine={machine} skin={sessionSkin} reduceMotion={settings.reduceMotion} soundEnabled={settings.soundEnabled} onSoundToggle={toggleSound} onModeChange={handleRestModeChange} onResume={handleResume} onEnd={() => dispatch({ type: 'END_SESSION', now: Date.now() })} onSceneFailure={() => dispatch({ type: 'END_SESSION', now: Date.now() })} onFps={setSceneFps} />;
  } else if (isSession) {
    content = <FocusScreen machine={machine} skin={sessionSkin} focusSeconds={focusSeconds} reduceMotion={settings.reduceMotion} focusAutoHide={settings.focusAutoHide} soundEnabled={settings.soundEnabled} onSoundToggle={toggleSound} onPause={handlePause} onSearchSkip={() => dispatch({ type: 'HARBOR_SEARCH_SKIP', now: Date.now(), harborId: `${sessionSkin.id.toLowerCase()}-harbor-1` })} onSearchCancel={() => dispatch({ type: 'HARBOR_SEARCH_CANCEL', now: Date.now() })} onComplete={() => dispatch({ type: 'COMPLETE_EARLY', now: Date.now() })} onAbort={abort} onSceneFailure={handleFocusSceneFailure} onSave={saveCompletion} onFps={setSceneFps} />;
  } else {
    switch (screen) {
      case 'JOURNEYS':
        content = <JourneysScreen journeys={journeys} tasks={tasks} entries={logbook} onStart={startJourney} onCreate={createJourney} />;
        break;
      case 'LOGBOOK':
        content = <LogbookScreen entries={logbook} skins={skins} onContinue={continueFromEntry} onDelete={deleteLogbookEntry} onDeleteAll={deleteAllLogbook} onExport={exportLocalData} onExportCsv={exportLogbookCsv} onExportImage={exportLogbookImage} onPromoteToDaily={promoteToDaily} onPromoteToJourney={promoteToJourney} />;
        break;
      case 'SKINS':
        content = <SkinsScreen skins={skins} selectedSkinId={selectedSkin.id} unlockedSkinIds={unlockedSkinIds} reduceMotion={settings.reduceMotion} soundEnabled={settings.soundEnabled} purchaseMessage={purchaseMessage} onApply={(id) => changeSettings({ ...settings, skinId: id })} onPurchase={purchaseSkin} onRestore={restoreEntitlements} onPreview={(id) => analyticsRef.current.track('skin_previewed', { skin_id: id, duration: 11 })} onFps={setSceneFps} />;
        break;
      case 'SETTINGS':
        content = <SettingsScreen settings={settings} syncQueueCount={syncQueue.length} syncMessage={syncMessage} online={online} sceneFps={sceneFps} onRetrySync={retrySync} onChange={changeSettings} />;
        break;
      case 'HOME':
      default:
        content = <HomeScreen mode={mode} onModeChange={setMode} taskTitle={taskTitle} onTaskTitleChange={setTaskTitle} timerMode={timerMode} onTimerModeChange={setTimerMode} plannedSeconds={plannedSeconds} onPlannedSecondsChange={setPlannedSeconds} selectedSkin={selectedSkin} reduceMotion={settings.reduceMotion} onSkinChange={(id) => changeSettings({ ...settings, skinId: id })} skins={skins} tasks={tasks} selectedTaskId={selectedTaskId} onTaskChange={(task) => { setSelectedTaskId(task.id); setTaskTitle(task.title); setPlannedSeconds(task.estimatedSeconds); }} onAddTask={(title) => { const id = `task-${Date.now().toString(36)}`; setTasks((current) => [...current, { id, title, estimatedSeconds: plannedSeconds, completed: false }]); setSelectedTaskId(id); setTaskTitle(title); }} journeys={journeys} selectedJourneyId={selectedJourneyId} onJourneyChange={setSelectedJourneyId} onStart={start} onOpenSkins={() => setScreen('SKINS')} recentTitle={logbook[0]?.title} />;
        break;
    }
  }

  return <div style={rootStyle}>{<AppShell screen={isSession ? statusScreen(machine) : screen} onNavigate={setScreen} onSettings={() => setScreen('SETTINGS')} showNav={!isSession} soundEnabled={settings.soundEnabled} onSoundToggle={!isSession ? toggleSound : undefined}>{content}</AppShell>}{noticeMessage && <div className="app-notice" role="status"><span>{noticeMessage}</span><button type="button" className="app-notice-close" aria-label="안내 닫기" onClick={() => { setAudioError(false); setExportError(false); }}>닫기</button></div>}{recoveryPending && isSession && <SessionRecovery machine={machine} skin={sessionSkin} reduceMotion={settings.reduceMotion} onContinue={() => setRecoveryPending(false)} onRecord={recordRecoveredSession} />}{!settings.onboardingSeen && !isSession && <Onboarding onDone={() => changeSettings({ ...settings, onboardingSeen: true })} />}</div>;
}
