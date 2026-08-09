"use client";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { formatAda } from "@/lib/format";
import { adminHospitals } from "@/lib/mock-data";
import { Star } from "lucide-react";
import * as React from "react";

export default function AdminHospitals() {
  const { toast } = useToast();
  const [hospitals, setHospitals] = React.useState(adminHospitals);

  return (
    <>
      <PageHeader title="Hospital management" description="Provider network verification and performance." />
      <Card className="p-0">
        <Table>
          <THead>
            <TR><TH>Hospital</TH><TH>Region</TH><TH>Status</TH><TH>Claims</TH><TH>Total payouts</TH><TH>Rating</TH><TH></TH></TR>
          </THead>
          <TBody>
            {hospitals.map((h) => (
              <TR key={h.id}>
                <TD className="font-medium">{h.name}</TD>
                <TD className="text-muted">{h.region}</TD>
                <TD>
                  {h.verified ? <Badge variant="success" dot>Verified</Badge> : <Badge variant="warning" dot>Pending</Badge>}
                </TD>
                <TD>{h.claims}</TD>
                <TD>{formatAda(h.payoutAda * 1_000_000)}</TD>
                <TD>
                  {h.rating > 0 ? (
                    <span className="flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 fill-amber text-amber" /> {h.rating}</span>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </TD>
                <TD>
                  {!h.verified && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => {
                        setHospitals(hospitals.map((x) => (x.id === h.id ? { ...x, verified: true } : x)));
                        toast("success", "Hospital verified", `${h.name} added to the network.`);
                      }}
                    >
                      Verify
                    </Button>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </>
  );
}
