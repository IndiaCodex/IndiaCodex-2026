"use client";

import { GradientAreaChart } from "@/components/charts/area-chart";
import { SimpleBarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { hospitalRevenueSeries } from "@/lib/mock-data";
import { Download } from "lucide-react";

const byProcedure = [
  { label: "Surgery", value: 14.2 },
  { label: "Emergency", value: 8.7 },
  { label: "Imaging", value: 6.4 },
  { label: "Consult", value: 4.9 },
  { label: "Therapy", value: 2.8 },
  { label: "Lab", value: 1.9 },
];

export default function HospitalAnalytics() {
  const { toast } = useToast();
  return (
    <>
      <PageHeader
        title="Earnings analytics"
        description="Insurance revenue trends across procedures and time."
        actions={
          <Button variant="secondary" onClick={() => toast("success", "Report exported", "analytics_jul_2026.pdf downloaded.")}>
            <Download className="h-4 w-4" /> Export report
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Monthly insurance revenue</CardTitle>
              <p className="mt-1 text-xs text-subtle">₳ thousands received from pool</p>
            </div>
            <Badge variant="success" dot>+10.5%</Badge>
          </CardHeader>
          <GradientAreaChart data={hospitalRevenueSeries} dataKey="revenue" color="#8b5cf6" valueFormatter={(v) => `₳${v}k`} />
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Revenue by procedure</CardTitle>
              <p className="mt-1 text-xs text-subtle">₳ thousands, trailing 6 months</p>
            </div>
          </CardHeader>
          <SimpleBarChart data={byProcedure} dataKey="value" color="#22d3ee" valueFormatter={(v) => `₳${v}k`} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Claim outcomes</CardTitle>
              <p className="mt-1 text-xs text-subtle">Trailing 90 days</p>
            </div>
          </CardHeader>
          <div className="mx-auto max-w-sm">
            <DonutChart
              data={[
                { name: "Paid", value: 68, color: "#10b981" },
                { name: "Approved", value: 14, color: "#22d3ee" },
                { name: "In review", value: 12, color: "#8b5cf6" },
                { name: "Rejected", value: 6, color: "#f43f5e" },
              ]}
              centerValue="92.4%"
              centerLabel="approval rate"
            />
          </div>
        </Card>
      </div>
    </>
  );
}
