import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type ListEditorProps = {
  label: string;
  placeholder: string;
  items: Array<{ id: string; value: string }>;
  onChange: (items: Array<{ id: string; value: string }>) => void;
};

export function ListEditor({ label, placeholder, items, onChange }: ListEditorProps) {
  const { t } = useI18n();
  const addItem = () => {
    onChange([...items, { id: `item-${Date.now()}`, value: "" }]);
  };

  const updateItem = (id: string, value: string) => {
    onChange(items.map(item => (item.id === id ? { ...item, value } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button size="sm" variant="outline" onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" />
          {t("partnerSync.common.add")}
        </Button>
      </div>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex gap-2">
            <Input
              value={item.value}
              onChange={e => updateItem(item.id, e.target.value)}
              placeholder={placeholder}
            />
            <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
