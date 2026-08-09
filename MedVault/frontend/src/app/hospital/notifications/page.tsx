"use client";

import { NotificationsPage } from "@/components/shared/notifications-page";

const items = [
  { id: "h1", title: "Payout settled", body: "₳3,150 for CLM-2026-2371 sent to your payout address.", at: "2026-07-12T09:30:00Z", read: false, kind: "success" },
  { id: "h2", title: "New claim submitted", body: "PT-2210 submitted CLM-2026-2398 (Surgery).", at: "2026-07-15T17:21:00Z", read: true, kind: "info" },
  { id: "h3", title: "Claim disputed", body: "CLM-2026-2355 was rejected — proof mismatch.", at: "2026-07-09T16:00:00Z", read: true, kind: "warning" },
];

export default function HospitalNotifications() {
  return <NotificationsPage initial={items} title="Hospital notifications" />;
}
