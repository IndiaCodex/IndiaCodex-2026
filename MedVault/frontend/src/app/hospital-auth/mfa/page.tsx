"use client";

import { MfaScreen } from "@/components/shared/mfa-screen";

export default function HospitalMfa() {
  return <MfaScreen role="hospital" fallbackName="Nova Medica" fallbackEmail="admin@novamedica.org" accent="violet" />;
}
