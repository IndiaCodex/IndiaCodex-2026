'use client';

import React from 'react';
import { Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-primary" />
          Settings
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-muted">
            Global configuration and preferences will be available here soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
