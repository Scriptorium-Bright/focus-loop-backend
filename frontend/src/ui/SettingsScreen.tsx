import type { ReactNode } from 'react';
import type { LocalSettings } from '../storage/localRepository';
import { SectionHeading } from './primitives';

export function SettingsScreen({ settings, syncQueueCount, syncMessage, online, sceneFps, onRetrySync, onChange }: { settings: LocalSettings; syncQueueCount: number; syncMessage: string; online: boolean; sceneFps: number | null; onRetrySync: () => void; onChange: (settings: LocalSettings) => void }) {
  const update = (patch: Partial<LocalSettings>) => onChange({ ...settings, ...patch });
  return (
    <div className="content-screen screen-padding">
      <SectionHeading eyebrow="설정" title="편안한 항해를 위한 설정." detail="화면과 소리를 조용하게 조정할 수 있습니다." />
      <div className="settings-list">
        <SettingRow title="저장 방식" detail="이 기기의 local-first 저장소를 사용합니다.">
          <span className="settings-status" role="status">LOCAL</span>
        </SettingRow>
        <SettingRow title="동기화 대기" detail={syncMessage || (online ? '연결된 서버가 있으면 백그라운드로 전송합니다.' : '오프라인 상태입니다. 이벤트를 이 기기에 보관합니다.')}>
          <button className="settings-sync-button" type="button" onClick={onRetrySync}>{syncQueueCount > 0 ? `${syncQueueCount}개 재시도` : '확인'}</button>
        </SettingRow>
        <SettingRow title="최근 장면 FPS" detail="집중·휴식·환경 장면에서 마지막으로 측정한 값입니다.">
          <span className="settings-status" role="status">{sceneFps === null ? '측정 전' : `${sceneFps} FPS`}</span>
        </SettingRow>
        <SettingRow title="Reduce Motion" detail="Roll과 선수 움직임을 최소화합니다.">
          <button
            className={settings.reduceMotion ? 'switch is-on' : 'switch'}
            type="button"
            role="switch"
            aria-label="Reduce Motion"
            aria-checked={settings.reduceMotion}
            onClick={() => update({ reduceMotion: !settings.reduceMotion })}
          >
            <span />
          </button>
        </SettingRow>
        <SettingRow title="항해 장면 자동 숨김" detail="집중 화면의 조작 UI를 4~6초 뒤 숨깁니다.">
          <button
            className={settings.focusAutoHide ? 'switch is-on' : 'switch'}
            type="button"
            role="switch"
            aria-label="항해 장면 자동 숨김"
            aria-checked={settings.focusAutoHide}
            onClick={() => update({ focusAutoHide: !settings.focusAutoHide })}
          >
            <span />
          </button>
        </SettingRow>
        <SettingRow title="소리" detail="물결과 항구 사운드를 사용합니다.">
          <button
            className={settings.soundEnabled ? 'switch is-on' : 'switch'}
            type="button"
            role="switch"
            aria-label="소리"
            aria-checked={settings.soundEnabled}
            onClick={() => update({ soundEnabled: !settings.soundEnabled })}
          >
            <span />
          </button>
        </SettingRow>
        <label className="brightness-row">
          <span>
            <strong>화면 밝기</strong>
            <small>장면의 밝기만 조절합니다.</small>
          </span>
          <input
            aria-label="화면 밝기"
            type="range"
            min="0.75"
            max="1.2"
            step="0.05"
            value={settings.brightness}
            onChange={(event) => update({ brightness: Number(event.target.value) })}
          />
        </label>
      </div>
      <div className="settings-note">
        <span>⌘</span>
        <p>작업명은 원문 그대로 analytics로 보내지 않고 이 기기에 먼저 저장합니다.</p>
      </div>
    </div>
  );
}

function SettingRow({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return <div className="setting-row"><div><strong>{title}</strong><small>{detail}</small></div>{children}</div>;
}
