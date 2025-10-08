import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none">
          <p>
            We at <strong>Adrieluxe Digital Studio</strong>, owned by{" "}
            <strong>Benjamin B</strong>, respect your privacy. This policy
            explains how we collect, use, and protect your information when you
            use our web services.
          </p>

          <h3>Highlights</h3>
          <ol>
            <li>
              <strong>Information Collected:</strong> Name, email, phone,
              business/project details, payment information, and assets
              submitted by you.
            </li>
            <li>
              <strong>Use of Information:</strong> Deliver services, process
              payments, communicate project updates, and improve our offerings.
            </li>
            <li>
              <strong>Sharing Information:</strong> Only with service providers,
              payment gateways, or as legally required in India.
            </li>
            <li>
              <strong>Cookies:</strong> Enhance website functionality and
              analytics.
            </li>
            <li>
              <strong>Data Security:</strong> Technical and administrative
              safeguards in place.
            </li>
            <li>
              <strong>Retention:</strong> Only as long as necessary or required
              under Indian law.
            </li>
            <li>
              <strong>Your Rights:</strong> Access, correction, deletion,
              withdrawal of consent, or complaints to Indian authorities.
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
