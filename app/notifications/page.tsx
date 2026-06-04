import type { Metadata } from 'next'

import { NotificationsAnnouncementPage } from '@/components/lms/notification-center'
import { currentUser, notifications } from '@/lib/mock-data'

export const metadata: Metadata = {
  title: 'Notifications and Announcements | Apple Partner Academy',
  description: 'A dedicated notification center for product updates, practice nudges, and team announcements.',
}

export default function NotificationsPage() {
  return (
    <NotificationsAnnouncementPage
      notifications={notifications}
      userName={currentUser.name.split(' ')[0] ?? currentUser.name}
      userAvatar={currentUser.avatar}
    />
  )
}
