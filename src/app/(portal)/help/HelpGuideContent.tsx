'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import './help-guide.css';

const CopyIcon = () => (
  <svg
    className="btn-copy__icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
);

export default function HelpGuideContent() {
  const rootRef = useRef<HTMLDivElement>(null);

  // Clipboard copy
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.btn-copy');
      if (!btn) return;

      const codeBlock = btn.closest('.code-block');
      if (!codeBlock) return;

      const pre = codeBlock.querySelector('.code-block__body pre');
      if (!pre) return;

      navigator.clipboard.writeText(pre.textContent ?? '').then(() => {
        btn.classList.add('is-copied');
        toast.success('클립보드에 복사되었습니다');
        setTimeout(() => btn.classList.remove('is-copied'), 2000);
      });
    };

    root.addEventListener('click', handleClick);
    return () => root.removeEventListener('click', handleClick);
  }, []);

  // Scroll fade-in
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const targets = root.querySelectorAll('.fade-in');
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="help-guide" ref={rootRef}>
      {/* Hero */}
      <section className="guide-hero">
        <div className="container">
          <div className="guide-hero__badge">
            <span>v1.2.0</span>
            <span>Setup Guide</span>
          </div>
          <h1 className="guide-hero__title">설치 가이드</h1>
          <p className="guide-hero__desc">
            스킬 폴더를 다운로드하고 바로 사용하기까지, 4단계로 안내합니다.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="section">
        <div className="container container--narrow">
          {/* Prerequisites */}
          <div className="info-box" style={{ marginBottom: 'var(--space-10)' }}>
            <div className="info-box__title">사전 준비</div>
            <ul className="info-box__list">
              <li>인터넷 연결</li>
              <li>터미널 기본 사용 (복사-붙여넣기 수준)</li>
              <li>
                Anthropic 계정 (
                <a
                  href="https://claude.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-navy)', textDecoration: 'underline' }}
                >
                  claude.ai
                </a>
                에서 무료 가입)
              </li>
            </ul>
          </div>

          {/* ═══ Step 0: Claude Code 설치 ═══ */}
          <div className="guide-step">
            <div className="guide-step__header">
              <span className="guide-step__num guide-step__num--skip">0</span>
              <div>
                <div className="guide-step__title">Claude Code 설치</div>
                <div className="guide-step__subtitle">
                  이미 설치되어 있다면 이 단계를 건너뛰세요.
                </div>
              </div>
            </div>
            <div className="guide-step__body">
              {/* 설치 확인 */}
              <div className="info-box">
                <div className="info-box__title">설치 여부 확인</div>
                <p
                  style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  터미널에서 아래 명령어를 실행합니다.
                </p>
                <div className="code-block" style={{ marginBottom: 'var(--space-2)' }}>
                  <div className="code-block__body">
                    <pre>claude --version</pre>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  버전 번호가 출력되면 <strong>Step 1</strong>로 이동하세요.
                  <br />
                  <code>찾을 수 없습니다</code> 에러가 나오면 아래 설치를 진행합니다.
                </p>
              </div>

              {/* Windows */}
              <span className="os-label">Windows</span>
              <div className="code-block" style={{ marginBottom: 'var(--space-1)' }}>
                <div className="code-block__header">
                  <span className="code-block__label">PowerShell (관리자)</span>
                  <button className="btn-copy" type="button">
                    <CopyIcon /> 복사
                  </button>
                </div>
                <div className="code-block__body">
                  <pre>irm https://claude.ai/install.ps1 | iex</pre>
                </div>
              </div>
              <p
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Git for Windows가 필요합니다. 미설치 시:{' '}
                <code>winget install --id Git.Git -e</code>
              </p>

              {/* macOS */}
              <span className="os-label">macOS</span>
              <div className="code-block" style={{ marginBottom: 'var(--space-1)' }}>
                <div className="code-block__header">
                  <span className="code-block__label">Terminal</span>
                  <button className="btn-copy" type="button">
                    <CopyIcon /> 복사
                  </button>
                </div>
                <div className="code-block__body">
                  <pre>curl -fsSL https://claude.ai/install.sh | bash</pre>
                </div>
              </div>
              <p
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                Node.js 불필요. 설치 후 터미널을 재시작하세요.
              </p>

              {/* 인증 */}
              <div className="info-box">
                <div className="info-box__title">설치 후 최초 인증</div>
                <div className="code-block" style={{ marginBottom: 'var(--space-2)' }}>
                  <div className="code-block__body">
                    <pre>claude</pre>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  처음 실행하면 브라우저가 열리며 Anthropic 계정 로그인을 요청합니다.
                  <br />
                  로그인 완료 후 터미널로 돌아오면 인증 완료입니다.
                </p>
              </div>
            </div>
          </div>

          {/* ═══ Step 1: 스킬 폴더 다운로드 ═══ */}
          <div className="guide-step">
            <div className="guide-step__header">
              <span className="guide-step__num">1</span>
              <div>
                <div className="guide-step__title">스킬 폴더 다운로드</div>
                <div className="guide-step__subtitle">
                  필요한 스킬만 골라서 다운로드합니다. 각 폴더는 자기완결형이므로 하나만
                  받아도 바로 사용할 수 있습니다.
                </div>
              </div>
            </div>
            <div className="guide-step__body">
              <div className="info-box">
                <div className="info-box__title">다운로드 방법</div>
                <p
                  style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  엘루오 허브에서 다운로드 받은 ZIP 파일을 압축 해제합니다.
                </p>
              </div>
            </div>
          </div>

          {/* ═══ Step 2: 폴더에서 실행 ═══ */}
          <div className="guide-step">
            <div className="guide-step__header">
              <span className="guide-step__num">2</span>
              <div>
                <div className="guide-step__title">스킬 폴더에서 Claude Code 실행</div>
                <div className="guide-step__subtitle">
                  다운로드한 폴더를 열고 Claude Code를 실행합니다.
                </div>
              </div>
            </div>
            <div className="guide-step__body">
              <div className="code-block" style={{ marginBottom: 'var(--space-4)' }}>
                <div className="code-block__header">
                  <span className="code-block__label">폴더 구조</span>
                </div>
                <div className="code-block__body">
                  <pre style={{ color: '#E2E8F0' }}>
                    {`plan-req/                    ← 이 폴더에서 Claude Code 실행
├── .claude/                 ← 스킬 설정 (자동 인식, 수정 불필요)
├── README.md                ← 사용 설명
├── input/                   ← 참고 자료 넣는 곳
└── output/                  ← 산출물이 여기에 생성됩니다`}
                  </pre>
                </div>
              </div>

              <div className="info-box">
                <div className="info-box__title">참고 자료 넣기 (선택)</div>
                <p
                  style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-secondary)',
                    marginBottom: 'var(--space-2)',
                  }}
                >
                  <code>input/</code> 폴더에 아래 자료를 넣으면 산출물 품질이 향상됩니다.
                </p>
                <ul className="info-box__list">
                  <li>제안서, RFP</li>
                  <li>디자인 시안 (이미지, PDF)</li>
                  <li>현행 사이트 분석 자료</li>
                  <li>벤치마킹 레퍼런스</li>
                </ul>
              </div>

              <details className="collapsible">
                <summary>PROJECT.md 직접 작성하기 (선택)</summary>
                <div
                  style={{
                    padding: 'var(--space-2) 0 0 var(--space-3)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 'var(--font-sm)',
                      color: 'var(--color-text-secondary)',
                      marginBottom: 'var(--space-2)',
                    }}
                  >
                    보통은 스킬이 자동 생성하지만, 미리 작성해 두면 질문 없이 바로
                    진행됩니다.
                  </p>
                  <div className="code-block">
                    <div className="code-block__header">
                      <span className="code-block__label">PROJECT.md</span>
                      <button className="btn-copy" type="button">
                        <CopyIcon /> 복사
                      </button>
                    </div>
                    <div className="code-block__body">
                      <pre style={{ color: '#E2E8F0' }}>
                        {`# 프로젝트명

## 개요
- 고객사: OOO
- 프로젝트 유형: 신규 구축 / 리뉴얼 / 운영
- 오픈 예정일: YYYY-MM-DD

## 주요 요구사항
- (고객이 전달한 핵심 내용을 기술)`}
                      </pre>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* ═══ Step 3: 동작 테스트 ═══ */}
          <div className="guide-step">
            <div className="guide-step__header">
              <span className="guide-step__num">3</span>
              <div>
                <div className="guide-step__title">동작 테스트</div>
                <div className="guide-step__subtitle">
                  자연어로 요청하면 산출물이 자동 생성됩니다.
                </div>
              </div>
            </div>
            <div className="guide-step__body">
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div className="test-prompt">
                  <span style={{ fontSize: 'var(--font-base)' }}>&#x1F4AC;</span>
                  &quot;요구사항 정리해줘&quot;
                </div>
              </div>
              <p
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <code>output/</code> 폴더에 산출물 파일이 생성되면 설치 완료입니다.
              </p>

              <div className="info-box">
                <div className="info-box__title">스킬별 예시 발화</div>
                <ul className="info-box__list">
                  <li>
                    <strong>plan-qst</strong> &mdash; &quot;고객한테 뭘 물어봐야
                    하지?&quot;
                  </li>
                  <li>
                    <strong>plan-req</strong> &mdash; &quot;요구사항 정리해줘&quot;
                  </li>
                  <li>
                    <strong>plan-fn</strong> &mdash; &quot;기능 정의해줘&quot;
                  </li>
                  <li>
                    <strong>plan-ia</strong> &mdash; &quot;사이트 구조 잡아줘&quot;
                  </li>
                  <li>
                    <strong>plan-wbs</strong> &mdash; &quot;일정 산정해줘&quot;
                  </li>
                  <li>
                    <strong>plan-sb</strong> &mdash; &quot;화면 설계해줘&quot;
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <hr className="guide-divider" />

          {/* ═══ 사용법 ═══ */}
          <h2 style={{ marginBottom: 'var(--space-6)' }}>사용법</h2>

          <h3 style={{ fontSize: 'var(--font-base)', marginBottom: 'var(--space-3)' }}>
            자연어로 요청
          </h3>
          <p
            style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            각 스킬 폴더에서 Claude Code를 실행한 뒤, 자연어로 요청하면 자동으로 적절한
            스킬이 호출됩니다.
          </p>

          <div className="code-block" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="code-block__header">
              <span className="code-block__label">자연어 예시</span>
            </div>
            <div className="code-block__body">
              <pre style={{ color: '#E2E8F0' }}>
                {`"이 사이트 기획해줘"             → 기획 산출물 자동 생성
"요구사항 정리해줘"                → REQ 스킬 호출
"기능 정의해줘"                   → FN 스킬 호출
"고객한테 뭘 물어봐야 하지?"       → QST 스킬 호출`}
              </pre>
            </div>
          </div>

          <hr className="guide-divider" />

          {/* ═══ 부가 정보 ═══ */}
          <h2 style={{ marginBottom: 'var(--space-6)' }}>알아두면 좋은 것</h2>

          <div
            style={{
              display: 'grid',
              gap: 'var(--space-4)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <div className="info-box">
              <div className="info-box__title">업데이트</div>
              <p
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                새 버전을 배포받으면 스킬 폴더의 <code>.claude/</code>만 덮어쓰기합니다.
                <br />
                <code>input/</code>, <code>output/</code> 등 작업 데이터는 영향 없습니다.
              </p>
            </div>

            <div className="info-box">
              <div className="info-box__title">제거</div>
              <p
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                스킬 폴더를 삭제합니다. 산출물을 보관하려면 <code>output/</code>만 별도로
                백업하세요.
              </p>
            </div>
          </div>

          <hr className="guide-divider" />

          {/* ═══ FAQ ═══ */}
          <h2 style={{ marginBottom: 'var(--space-6)' }}>FAQ</h2>

          <div className="faq-item">
            <div className="faq-item__q">
              Q. 스킬 폴더를 여러 개 동시에 쓸 수 있나요?
            </div>
            <p className="faq-item__a">
              네. 각 폴더는 독립적입니다. 여러 프로젝트에 같은 스킬 폴더를 복사해서
              사용해도 됩니다.
            </p>
          </div>

          <div className="faq-item">
            <div className="faq-item__q">
              Q. 선행 산출물 없이 특정 스킬만 실행할 수 있나요?
            </div>
            <p className="faq-item__a">
              네. 예를 들어 REQ 없이 FN을 직접 실행할 수 있습니다.
              <br />
              다만 선행 산출물이 <code>output/</code>에 있으면 자동으로 참조하여 품질이 더
              좋아집니다.
            </p>
          </div>

          <div className="faq-item">
            <div className="faq-item__q">
              Q. 팀원마다 다른 스킬을 쓸 수 있나요?
            </div>
            <p className="faq-item__a">
              네. 필요한 스킬 폴더만 각자 다운로드하면 됩니다. 서로 충돌하지 않습니다.
            </p>
          </div>

          <div className="faq-item">
            <div className="faq-item__q">
              Q. 오프라인에서도 사용 가능한가요?
            </div>
            <p className="faq-item__a">
              스킬 폴더 자체는 로컬에 있어 오프라인 접근이 가능하지만, Claude Code는
              Anthropic API에 접속해야 하므로{' '}
              <strong>인터넷 연결이 필요</strong>합니다.
            </p>
          </div>

          <hr className="guide-divider" />

          {/* ═══ 처음 쓰는 분을 위한 가이드 ═══ */}
          <h2 style={{ marginBottom: 'var(--space-6)' }}>
            처음 쓰는 분을 위한 가이드
          </h2>

          <h3
            style={{
              fontSize: 'var(--font-base)',
              marginBottom: 'var(--space-3)',
            }}
          >
            이게 정상인가요?
          </h3>
          <p
            style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Claude Code를 처음 사용하면 화면이 낯설 수 있습니다. 아래를 참고하세요.
          </p>

          <div
            style={{
              display: 'grid',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div
              className="info-box"
              style={{ borderLeft: '3px solid #22C55E' }}
            >
              <div className="info-box__title" style={{ color: '#16A34A' }}>
                정상입니다
              </div>
              <ul className="info-box__list">
                <li>텍스트가 실시간으로 타이핑되듯 나타남</li>
                <li>
                  파일을 읽거나 쓰겠다는 <strong>권한 요청</strong> 팝업이 뜸 &rarr;{' '}
                  <code>Allow</code> 누르면 됩니다
                </li>
                <li>
                  중간에 &quot;thinking...&quot; 표시와 함께 잠시 멈춤 (최대
                  30초~1분)
                </li>
                <li>여러 파일을 연속으로 생성하면서 진행 상황을 보여줌</li>
                <li>
                  <code>output/</code>에 HTML 파일이 생성됨
                </li>
              </ul>
            </div>

            <div
              className="info-box"
              style={{ borderLeft: '3px solid #EF4444' }}
            >
              <div className="info-box__title" style={{ color: '#DC2626' }}>
                문제가 있는 경우
              </div>
              <ul className="info-box__list">
                <li>
                  빨간색 에러 메시지가 나타남 &rarr; 아래{' '}
                  <strong>문제 해결</strong> 참고
                </li>
                <li>
                  아무 반응 없이 5분 이상 멈춰 있음 &rarr; <code>Ctrl+C</code>로
                  종료 후 재실행
                </li>
                <li>
                  &quot;API key&quot; 또는 &quot;authentication&quot; 관련 메시지
                  &rarr; <code>claude</code> 다시 입력하여 로그인
                </li>
                <li>
                  산출물이 전혀 생성되지 않음 &rarr; 스킬 폴더 안에서 실행했는지
                  확인
                </li>
              </ul>
            </div>
          </div>

          {/* 중간에 멈췄을 때 */}
          <h3
            style={{
              fontSize: 'var(--font-base)',
              marginBottom: 'var(--space-3)',
            }}
          >
            중간에 멈추거나 껐다 켰을 때
          </h3>

          <div
            style={{
              display: 'grid',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div className="info-box">
              <div className="info-box__title">
                Claude Code가 중간에 멈춘 경우
              </div>
              <ol
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-text-secondary)',
                  paddingLeft: 'var(--space-5)',
                  margin: 0,
                  listStyle: 'decimal',
                }}
              >
                <li style={{ padding: '3px 0' }}>
                  <code>Ctrl+C</code>를 눌러 완전히 종료합니다.
                </li>
                <li style={{ padding: '3px 0' }}>
                  같은 스킬 폴더에서 다시 <code>claude</code>를 실행합니다.
                </li>
                <li style={{ padding: '3px 0' }}>
                  &quot;이어서 해줘&quot; 또는 &quot;아까 하던 거
                  계속해줘&quot;라고 말합니다.
                </li>
              </ol>
              <p
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--color-text-secondary)',
                  marginTop: 'var(--space-2)',
                }}
              >
                <code>output/</code>에 이미 생성된 파일은 사라지지 않습니다. 안심하세요.
              </p>
            </div>

            <div className="info-box">
              <div className="info-box__title">터미널을 실수로 껐을 때</div>
              <ol
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-text-secondary)',
                  paddingLeft: 'var(--space-5)',
                  margin: 0,
                  listStyle: 'decimal',
                }}
              >
                <li style={{ padding: '3px 0' }}>터미널을 다시 엽니다.</li>
                <li style={{ padding: '3px 0' }}>
                  스킬 폴더로 이동합니다. (예: <code>cd D:\plan-req</code>)
                </li>
                <li style={{ padding: '3px 0' }}>
                  <code>claude</code>를 입력합니다.
                </li>
                <li style={{ padding: '3px 0' }}>
                  이전에 하던 작업을 자연어로 다시 요청합니다.
                </li>
              </ol>
            </div>
          </div>

          {/* 권한 요청 */}
          <h3
            style={{
              fontSize: 'var(--font-base)',
              marginBottom: 'var(--space-3)',
            }}
          >
            권한 요청이 나올 때
          </h3>
          <div className="info-box" style={{ marginBottom: 'var(--space-6)' }}>
            <p
              style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Claude Code가 파일을 읽거나 생성할 때 권한을 요청합니다. 이것은{' '}
              <strong>보안 기능</strong>입니다.
            </p>
            <ul className="info-box__list">
              <li>
                <strong>Allow once</strong> &mdash; 이번 한 번만 허용
              </li>
              <li>
                <strong>Allow always</strong> &mdash; 이 유형의 작업을 항상 허용
                (편한 옵션)
              </li>
              <li>
                <strong>Deny</strong> &mdash; 거부 (잘못된 파일에 접근하려 할 때)
              </li>
            </ul>
            <p
              style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--space-2)',
              }}
            >
              스킬 폴더 내 파일(<code>output/</code>, <code>input/</code> 등)에 대한
              요청은 <strong>Allow</strong>해도 안전합니다.
            </p>
          </div>

          <hr className="guide-divider" />

          {/* ═══ IDE 연동 (선택) ═══ */}
          <h2 style={{ marginBottom: 'var(--space-2)' }}>
            IDE 연동{' '}
            <span
              style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 'var(--weight-regular)',
                color: 'var(--color-text-secondary)',
              }}
            >
              (선택)
            </span>
          </h2>
          <p
            style={{
              fontSize: 'var(--font-sm)',
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-6)',
            }}
          >
            Claude Code는 터미널만으로 모든 기능을 사용할 수 있습니다. IDE 연동은 선택
            사항이지만, 에디터와 함께 사용하면 더 편리합니다.
          </p>

          {/* 상황별 추천 */}
          <div className="table-wrap" style={{ marginBottom: 'var(--space-6)' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>상황</th>
                  <th>추천 방식</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>처음 시작하는 분</td>
                  <td>터미널 단독 (가장 간단)</td>
                </tr>
                <tr>
                  <td>VS Code를 사용 중인 분</td>
                  <td>VS Code 확장 프로그램</td>
                </tr>
                <tr>
                  <td>JetBrains를 사용 중인 분</td>
                  <td>공식 플러그인</td>
                </tr>
                <tr>
                  <td>서버·원격 환경</td>
                  <td>터미널 단독</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VS Code */}
          <h3
            style={{
              fontSize: 'var(--font-base)',
              marginBottom: 'var(--space-3)',
            }}
          >
            VS Code 연동
          </h3>
          <div
            style={{
              display: 'grid',
              gap: 'var(--space-3)',
              marginBottom: 'var(--space-6)',
            }}
          >
            <div className="info-box">
              <div className="info-box__title">1. 확장 프로그램 설치</div>
              <ol
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-text-secondary)',
                  paddingLeft: 'var(--space-5)',
                  margin: 0,
                  listStyle: 'decimal',
                }}
              >
                <li style={{ padding: '3px 0' }}>VS Code 실행</li>
                <li style={{ padding: '3px 0' }}>
                  확장 프로그램 탭 열기 (<code>Ctrl+Shift+X</code> /{' '}
                  <code>Cmd+Shift+X</code>)
                </li>
                <li style={{ padding: '3px 0' }}>
                  <code>Claude Code</code> 검색
                </li>
                <li style={{ padding: '3px 0' }}>
                  Anthropic 공식 확장 프로그램 설치
                </li>
              </ol>
            </div>
            <div className="info-box">
              <div className="info-box__title">2. 실행 방법</div>
              <ul className="info-box__list">
                <li>
                  통합 터미널 열기 (<code>Ctrl+`</code> / <code>Cmd+`</code>)
                  &rarr; <code>claude</code> 입력
                </li>
                <li>또는 좌측 활동 표시줄에서 Claude 아이콘 클릭</li>
              </ul>
            </div>
            <div className="info-box">
              <div className="info-box__title">권장 설정</div>
              <p
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-2)',
                }}
              >
                VS Code <code>settings.json</code>에 추가하면 편리합니다.
              </p>
              <div className="code-block">
                <div className="code-block__header">
                  <span className="code-block__label">settings.json</span>
                  <button className="btn-copy" type="button">
                    <CopyIcon /> 복사
                  </button>
                </div>
                <div className="code-block__body">
                  <pre>
                    {`{
  "files.autoSave": "afterDelay"
}`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* JetBrains */}
          <h3
            style={{
              fontSize: 'var(--font-base)',
              marginBottom: 'var(--space-3)',
            }}
          >
            JetBrains 연동
          </h3>
          <div className="info-box" style={{ marginBottom: 'var(--space-6)' }}>
            <p
              style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--color-text-secondary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              IntelliJ IDEA, PyCharm, WebStorm, GoLand 등에서 사용할 수 있습니다.
            </p>
            <ol
              style={{
                fontSize: 'var(--font-sm)',
                color: 'var(--color-text-secondary)',
                paddingLeft: 'var(--space-5)',
                margin: 0,
                listStyle: 'decimal',
              }}
            >
              <li style={{ padding: '3px 0' }}>
                Settings 열기 (<code>Ctrl+Alt+S</code> / <code>Cmd+,</code>)
              </li>
              <li style={{ padding: '3px 0' }}>
                <strong>Plugins</strong> &rarr; <strong>Marketplace</strong> 탭
              </li>
              <li style={{ padding: '3px 0' }}>
                <code>Claude Code</code> 검색 &rarr; 공식 플러그인 설치
              </li>
              <li style={{ padding: '3px 0' }}>IDE 재시작</li>
              <li style={{ padding: '3px 0' }}>
                <strong>Tools</strong> &rarr; <strong>Claude Code</strong> 선택
              </li>
            </ol>
          </div>

          {/* 공통 주의사항 */}
          <div
            className="info-box"
            style={{
              borderLeft: '3px solid var(--color-navy)',
              marginBottom: 'var(--space-8)',
            }}
          >
            <div className="info-box__title">공통 주의사항</div>
            <ul className="info-box__list">
              <li>
                IDE 연동 전 Claude.ai 계정 로그인이 완료되어 있어야 합니다.
              </li>
              <li>
                Claude Code는 현재 열려 있는 폴더를 작업 공간으로 인식합니다.{' '}
                <strong>반드시 스킬 폴더를 열어두세요.</strong>
              </li>
              <li>설정 변경 후 터미널 재시작이 필요할 수 있습니다.</li>
            </ul>
          </div>

          <hr className="guide-divider" />

          {/* ═══ 문제 해결 ═══ */}
          <h2 style={{ marginBottom: 'var(--space-6)' }}>문제 해결</h2>

          <div className="trouble-wrap" style={{ marginBottom: 'var(--space-6)' }}>
            <table className="trouble-table">
              <thead>
                <tr>
                  <th>증상</th>
                  <th>원인</th>
                  <th>해결</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>claude: command not found</code>
                  </td>
                  <td>Claude Code 미설치 또는 PATH 미등록</td>
                  <td>
                    Step 0으로 돌아가 설치. 설치 후{' '}
                    <strong>터미널을 완전히 닫고</strong> 새로 열기
                  </td>
                </tr>
                <tr>
                  <td>자연어 요청에 반응 안 함</td>
                  <td>Claude Code 재시작 필요</td>
                  <td>
                    <code>Ctrl+C</code>로 종료 후 재실행
                  </td>
                </tr>
                <tr>
                  <td>산출물이 생성되지 않음</td>
                  <td>스킬 폴더 밖에서 실행</td>
                  <td>
                    반드시 스킬 폴더 <strong>안에서</strong> Claude Code 실행
                  </td>
                </tr>
                <tr>
                  <td>스킬이 동작 안 함</td>
                  <td>
                    <code>.claude/</code> 경로 오류
                  </td>
                  <td>
                    <code>.claude/skills/</code> 하위에 스킬 폴더가 있는지 확인
                  </td>
                </tr>
                <tr>
                  <td>빨간색 에러 후 멈춤</td>
                  <td>API 연결 또는 토큰 문제</td>
                  <td>
                    <code>Ctrl+C</code> &rarr; 인터넷 연결 확인 &rarr;{' '}
                    <code>claude</code> 재실행
                  </td>
                </tr>
                <tr>
                  <td>PowerShell 실행 정책 오류</td>
                  <td>스크립트 실행 차단</td>
                  <td>
                    관리자 PowerShell에서{' '}
                    <code>Set-ExecutionPolicy RemoteSigned</code>
                  </td>
                </tr>
                <tr>
                  <td>Python 관련 에러</td>
                  <td>Python 미설치 또는 PATH 미등록</td>
                  <td>아래 &quot;Python 환경&quot; 섹션 참고</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Python 환경 */}
          <details
            className="collapsible"
            style={{ marginBottom: 'var(--space-8)' }}
          >
            <summary>Python 환경 설정 (필요한 경우만)</summary>
            <div style={{ padding: 'var(--space-3) 0 0 var(--space-3)' }}>
              <p
                style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                대부분의 기획 스킬은 Python이 필요 없습니다.
                <br />
                일부 고급 기능(사이트 스크린샷 등)에서 Python을 요구할 수 있습니다.
              </p>

              <span className="os-label">Windows</span>
              <div className="code-block" style={{ marginBottom: 'var(--space-1)' }}>
                <div className="code-block__header">
                  <span className="code-block__label">PowerShell</span>
                  <button className="btn-copy" type="button">
                    <CopyIcon /> 복사
                  </button>
                </div>
                <div className="code-block__body">
                  <pre>winget install --id Python.Python.3.12 -e</pre>
                </div>
              </div>
              <p
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                설치 후 터미널을 재시작해야 <code>python</code> 명령어가 인식됩니다.
              </p>

              <span className="os-label">macOS</span>
              <div className="code-block" style={{ marginBottom: 'var(--space-1)' }}>
                <div className="code-block__header">
                  <span className="code-block__label">Terminal</span>
                  <button className="btn-copy" type="button">
                    <CopyIcon /> 복사
                  </button>
                </div>
                <div className="code-block__body">
                  <pre>brew install python@3.12</pre>
                </div>
              </div>
              <p
                style={{
                  fontSize: 'var(--font-xs)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                Homebrew가 없으면:{' '}
                <code>
                  /bin/bash -c &quot;$(curl -fsSL
                  https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)&quot;
                </code>
              </p>

              <div className="info-box">
                <div className="info-box__title">설치 확인</div>
                <div
                  className="code-block"
                  style={{ marginBottom: 'var(--space-2)' }}
                >
                  <div className="code-block__body">
                    <pre>python --version</pre>
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 'var(--font-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <code>Python 3.x.x</code>가 출력되면 정상입니다.
                </p>
              </div>
            </div>
          </details>
        </div>
      </section>
    </div>
  );
}
