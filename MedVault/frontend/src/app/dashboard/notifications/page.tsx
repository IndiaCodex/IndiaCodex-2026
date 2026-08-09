"use client";

import { NotificationsPage } from "@/components/shared/notifications-page";
import { mockNotifications } from "@/lib/mock-data";

export default function UserNotifications() {
  return <NotificationsPage initial={mockNotifications} />;
}
