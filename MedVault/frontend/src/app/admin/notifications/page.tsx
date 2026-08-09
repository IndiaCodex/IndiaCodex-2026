"use client";

import { NotificationsPage } from "@/components/shared/notifications-page";

const items = [
  { id: "a1", title: "High-severity fraud alert", body: "Duplicate claim pattern detected on CLM-2026-2405.", at: "2026-07-18T04:23:00Z", read: false, kind: "error" },
  { id: "a2", title: "Allocation near cap", body: "Treasury deployment at 78% of the 80% cap.", at: "2026-07-18T09:00:00Z", read: false, kind: "warning" },
  { id: "a3", title: "Yield distribution complete", body: "Epoch 2026-07 distributed ₳12,400 to the pool.", at: "2026-07-18T22:11:00Z", read: false, kind: "success" },
  { id: "a4", title: "Hospital verification request", body: "Aurora Care Group submitted onboarding documents.", at: "2026-07-14T13:30:00Z", read: true, kind: "info" },
];

export default function AdminNotifications() {
  return <NotificationsPage initial={items} title="Admin notifications" />;
}
