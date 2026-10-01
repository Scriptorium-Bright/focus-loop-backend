import { useState } from 'react';
import { ActionButton } from './primitives';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const pages = [
    { kicker: '작은 배에 올라', title: '해야 할 일을 정하고\n조용히 출항하세요.', body: '집중하는 동안 화면은 당신 곁에만 머뭅니다.' },
    { kicker: '잠시 멈춰도', title: '가까운 쉼터를\n찾아 정박합니다.', body: 'Pause를 누르면 시간이 먼저 멈추고, 항구 탐색은 건너뛸 수 있습니다.' },
  ];
  const page = pages[step];
  return (
    <div className="onboarding-backdrop">
      <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className={`onboarding-mini-scene onboarding-step-${step}`}>
          <span className="onboarding-sun" />
          <span className="onboarding-bow" />
        </div>
        <div className="onboarding-copy">
          <p className="eyebrow">{page.kicker}</p>
          <h1 id="onboarding-title">{page.title.split('\n').map((line) => <span key={line}>{line}<br /></span>)}</h1>
          <p>{page.body}</p>
        </div>
        <div className="onboarding-footer">
          <div className="onboarding-dots" aria-label={`${step + 1} / ${pages.length}`}>
            {pages.map((_, index) => <span key={index} className={index === step ? 'dot is-active' : 'dot'} />)}
          </div>
          <div className="onboarding-actions">
            <button className="text-button" type="button" onClick={onDone}>건너뛰기</button>
            <ActionButton type="button" onClick={() => step === pages.length - 1 ? onDone() : setStep(step + 1)}>
              {step === pages.length - 1 ? '시작하기' : '다음'}
            </ActionButton>
          </div>
        </div>
      </section>
    </div>
  );
}
