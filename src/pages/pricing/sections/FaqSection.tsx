import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { FAQ_ITEMS } from "../data";

export function FaqSection({ isHybridVersion }: { isHybridVersion: boolean }) {
  const items = FAQ_ITEMS.filter(it => (it.hybridOnly ? isHybridVersion : true));

  return (
    <div className="max-w-4xl mx-auto mt-16">
      <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {items.map(it => (
          <Card key={it.question}>
            <CardHeader>
              <CardTitle className="text-lg">{it.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{it.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
