import { GlobeSection } from "./GlobeSection";

export function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero — bg-brand-navy, 2단 레이아웃 */}
      <section className="bg-brand-navy text-white py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center min-h-[500px] gap-8">
          {/* 좌측: 텍스트 + CTA */}
          <div className="flex-1 flex flex-col justify-center gap-6 text-center md:text-left">
            <h1 className="text-6xl font-bold tracking-tight font-eluo">
              <span className="text-brand-yellow">ELUO</span> AI SKILL HUB
            </h1>
            <p className="text-lg text-white/80 max-w-xl">
              웹 에이전시의 기획·디자인·퍼블리싱·개발·QA 워크플로우를<br className="hidden md:block" /> 자동화하는 스킬을 검색하고 설치하세요.
            </p>
            <div>
              <a
                href="/signin"
                className="inline-flex items-center gap-2 bg-brand-yellow text-brand-navy font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                시작하기
              </a>
            </div>
          </div>

          {/* 우측: 글로브 (Client Component) */}
          <GlobeSection />
        </div>
      </section>

      {/* Features — bg-brand-light */}
      <section className="bg-brand-light py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-brand-navy text-center mb-10">
            주요 기능
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-brand-navy flex items-center justify-center mb-4">
                  <span className="text-brand-yellow text-lg font-bold">
                    {feature.icon}
                  </span>
                </div>
                <h3 className="font-semibold text-brand-navy mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-navy border-t border-white/10 py-6 px-6 text-center text-white/40 text-sm">
        © 2026 Eluo. All rights reserved.
      </footer>
    </main>
  );
}

const features = [
  {
    icon: "🔍",
    title: "스킬 검색",
    description:
      "직군별 자동화 스킬을 카테고리로 검색하고 즉시 설치할 수 있습니다.",
  },
  {
    icon: "⚡",
    title: "원클릭 실행",
    description: "Claude Code 플러그인으로 등록된 스킬을 바로 실행합니다.",
  },
  {
    icon: "🛠️",
    title: "스킬 관리",
    description: "관리자가 새 스킬을 등록하고 버전을 관리할 수 있습니다.",
  },
];
