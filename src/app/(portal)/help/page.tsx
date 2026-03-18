import type { Metadata } from 'next';
import HelpGuideContent from './HelpGuideContent';

export const metadata: Metadata = {
  title: '도움말',
};

export default function HelpPage() {
  return <HelpGuideContent />;
}
