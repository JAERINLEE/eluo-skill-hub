"use client";

import dynamic from "next/dynamic";

const InteractiveGlobe = dynamic(
  () =>
    import("@/shared/ui/interactive-globe").then((m) => m.InteractiveGlobe),
  {
    ssr: false,
    loading: () => <div className="w-[460px] h-[460px]" />,
  }
);

export function GlobeSection() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[360px]">
      <InteractiveGlobe size={460} />
    </div>
  );
}
