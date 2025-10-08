import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function RefundPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Refund &amp; Cancellation Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            Applicable to all web services purchased via{" "}
            <strong>startupsniff.com</strong>.
          </p>

          <h3>Strictly Non-Refundable</h3>
          <p>
            All services provided by <strong>Adrieluxe Digital Studio</strong>{" "}
            are strictly non-refundable under any circumstances.
          </p>

          <Separator />

          <h4>Owner &amp; Contact</h4>
          <p>
            <strong>Owner:</strong> Benjamin B
            <br />
            <strong>Email:</strong> contact@adrieluxedigitalstudio.com
            <br />
            <strong>Phone:</strong> +91 97873 33558
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
