// File: app/terms/page.tsx

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Terms &amp; Conditions</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            Welcome to <strong>Adrieluxe Digital Studio</strong>, owned and
            operated by <strong>Benjamin B</strong> (&quot;we&quot;,
            &quot;our&quot;, &quot;us&quot;), via{" "}
            <strong>startupsniff.com</strong>. These Terms &amp; Conditions
            govern your use of our web services, including website design,
            development, digital marketing, hosting, and related services
            (collectively, “Services”) in India. By using our Services, you
            agree to these Terms.
          </p>

          <h3>Key Points</h3>
          <ol>
            <li>
              <strong>Eligibility:</strong> You must be at least 18 years old.
            </li>
            <li>
              <strong>Service Requests &amp; Quotations:</strong> All requests
              are confirmed via email or proposal. A valid agreement forms the
              contract.
            </li>
            <li>
              <strong>Payment:</strong>
              <ul>
                <li>All prices are in INR.</li>
                <li>Advance payment is required before project initiation.</li>
                <li>
                  Third-party costs (domains, hosting, plugins) billed
                  separately.
                </li>
              </ul>
            </li>
            <li>
              <strong>Delivery / Timeline:</strong> Timelines are indicative;
              client delays may extend delivery.
            </li>
            <li>
              <strong>Client Responsibilities:</strong> Provide content,
              approvals, and legal rights to all materials.
            </li>
            <li>
              <strong>Intellectual Property:</strong> We retain ownership until
              full payment is received. After that, client-specific work is
              transferred to you.
            </li>
            <li>
              <strong>Confidentiality:</strong> Client information shared during
              projects is kept confidential.
            </li>
            <li>
              <strong>Revisions &amp; Support:</strong> Limited to agreed scope;
              additional work may incur charges.
            </li>
            <li>
              <strong>Limitation of Liability:</strong> Our liability is limited
              to fees paid for the service.
            </li>
            <li>
              <strong>Governing Law:</strong> All disputes are governed by
              Indian laws.
            </li>
          </ol>

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
