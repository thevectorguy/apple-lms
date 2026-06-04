import { notFound } from 'next/navigation'

import { NovaSessionReportPage } from '@/components/lms/nova-session-history'
import { practiceSessionHistory } from '@/lib/mock-data'

export default async function PracticeHistoryReportPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params
  const session = practiceSessionHistory.find((entry) => entry.id === sessionId)

  if (!session) {
    notFound()
  }

  return <NovaSessionReportPage session={session} />
}
