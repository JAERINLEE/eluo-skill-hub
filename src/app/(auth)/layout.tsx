/**
 * 인증 페이지 전용 레이아웃 (서버 컴포넌트)
 *
 * /login, /signup 라우트에 적용되는 레이아웃.
 * 사이드바와 헤더 없이 중앙 정렬 카드 형태로 인증 폼을 표시한다.
 */
export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
