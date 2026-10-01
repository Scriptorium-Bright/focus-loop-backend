import type { ReactNode } from 'react';
import { Icon, IconButton } from './primitives';

export type AppScreen = 'HOME' | 'FOCUS' | 'REST' | 'LOGBOOK' | 'JOURNEYS' | 'SKINS' | 'SETTINGS';

const navItems: Array<{ screen: AppScreen; label: string; icon: 'anchor' | 'book' | 'skin' | 'arrow' }> = [
  { screen: 'HOME', label: '홈', icon: 'anchor' },
  { screen: 'JOURNEYS', label: '여정', icon: 'arrow' },
  { screen: 'LOGBOOK', label: '항해일지', icon: 'book' },
  { screen: 'SKINS', label: '환경', icon: 'skin' },
];

export function AppShell({
  screen,
  onNavigate,
  onSettings,
  children,
  showNav = true,
  soundEnabled,
  onSoundToggle,
}: {
  screen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  onSettings: () => void;
  children: ReactNode;
  showNav?: boolean;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
}) {
  return (
    <div className={`app-shell app-screen-${screen.toLowerCase()}`}>
      <header className="topbar">
        <button className="wordmark" type="button" onClick={() => onNavigate('HOME')} aria-label="FocusLoop 홈으로 이동">
          <span className="wordmark-mark">◒</span>
          <span>FocusLoop</span>
        </button>
        <div className="topbar-actions">
          {onSoundToggle && (
            <IconButton name={soundEnabled ? 'sound' : 'sound-off'} label={soundEnabled ? '소리 끄기' : '소리 켜기'} onClick={onSoundToggle} />
          )}
          <IconButton name="settings" label="설정 열기" onClick={onSettings} />
        </div>
      </header>
      <main className="app-main">{children}</main>
      {showNav && screen !== 'FOCUS' && screen !== 'REST' && (
        <nav className="bottom-nav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <button key={item.screen} className={screen === item.screen ? 'nav-item is-active' : 'nav-item'} type="button" aria-current={screen === item.screen ? 'page' : undefined} onClick={() => onNavigate(item.screen)}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
