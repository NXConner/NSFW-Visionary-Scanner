import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

export function FactorChecklistCard<K extends string>({
  title,
  keys,
  state,
  onToggle,
}: {
  title: string;
  keys: readonly K[];
  state: Partial<Record<K, boolean>>;
  onToggle: (k: K) => void;
}): JSX.Element {
  return (
    <Card className="border-border/50">
      <CardHeader className="py-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {keys.map(k => (
          <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={state[k] === true} onCheckedChange={() => onToggle(k)} />
            <span className="capitalize">{String(k).replaceAll("_", " ")}</span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
}
