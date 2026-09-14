import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  {
    label: "Company Fact",
    tone: "info" as const,
    body: "Information stored directly in CorpNizam — a director's name, a shareholding, a document upload date.",
  },
  {
    label: "Verified Rule",
    tone: "success" as const,
    body: "Information supported by a compliance rule marked VERIFIED against an official source.",
  },
  {
    label: "AI Interpretation",
    tone: "warning" as const,
    body: "An AI-generated explanation connecting company facts to general concepts — never a substitute for legal advice.",
  },
  {
    label: "Lawyer Review",
    tone: "danger" as const,
    body: "Flagged as requiring professional/legal confirmation before it can be relied on.",
  },
];

export default function AskCorpNizamPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Ask CorpNizam</h1>
        <p className="mt-1 text-sm text-slate-500">
          Ask CorpNizam is being built to answer questions using your company data, corporate events,
          verified compliance rules, documents, and audit history — combined, never fabricated.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How answers will be labelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CATEGORIES.map((c) => (
            <div key={c.label} className="flex items-start gap-3">
              <Badge tone={c.tone}>{c.label}</Badge>
              <p className="text-sm text-slate-600">{c.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-sm text-slate-500">
            The deterministic company and compliance engine is the priority for this release. Ask
            CorpNizam&apos;s conversational interface is not yet connected to a live model.
          </p>
          <div className="flex gap-2">
            <Input placeholder="Ask a question about your company…" disabled />
            <Button disabled>Ask</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
