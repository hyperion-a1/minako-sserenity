import { ArrowDown, ArrowUp, Images, LayoutList, Minus, Plus, Trash2, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { newGiveawayBlock, type GiveawayBlock } from "@/lib/minako/giveaway-message";
import { GIVEAWAY_MESSAGE_LIMITS } from "@/lib/minako/validation";
import { TextAreaField, TextField, ToggleRow, Segmented } from "./fields";

const TYPES = [
  { type: "text", label: "Texto", icon: Type },
  { type: "section", label: "Seção", icon: LayoutList },
  { type: "gallery", label: "Galeria de mídia", icon: Images },
  { type: "separator", label: "Separador", icon: Minus },
] as const;

export function GiveawayMessageEditor({ blocks, message, onChange }: { blocks: GiveawayBlock[]; message: string; onChange: (blocks: GiveawayBlock[]) => void }) {
  const change = (index: number, next: GiveawayBlock) => onChange(blocks.map((b, i) => i === index ? next : b));
  const move = (index: number, direction: number) => {
    const next = [...blocks];
    const current = next[index];
    const other = next[index + direction];
    if (!current || !other) return;
    next[index] = other;
    next[index + direction] = current;
    onChange(next);
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2" aria-label="Adicionar componente">
      {TYPES.map(({ type, label, icon: Icon }) => <Button key={type} size="sm" variant="outline" disabled={blocks.length >= GIVEAWAY_MESSAGE_LIMITS.blocks} onClick={() => {
        const first: GiveawayBlock[] = blocks.length ? blocks : [{ type: "text", content: message }];
        onChange([...first, newGiveawayBlock(type)]);
      }}><Icon />{label}</Button>)}
    </div>
    {blocks.map((b, index) => <div key={`${index}-${b.type}`} className="space-y-4 rounded-lg border-2 border-border bg-background p-3 sm:p-4">
      <div className="flex items-center gap-1">
        <h3 className="min-w-0 flex-1 text-sm font-semibold">{index + 1}. {TYPES.find((t) => t.type === b.type)?.label}</h3>
        <Button variant="ghost" size="icon" aria-label={`Mover bloco ${index + 1} para cima`} title="Mover para cima" disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp /></Button>
        <Button variant="ghost" size="icon" aria-label={`Mover bloco ${index + 1} para baixo`} title="Mover para baixo" disabled={index === blocks.length - 1} onClick={() => move(index, 1)}><ArrowDown /></Button>
        <Button variant="ghost" size="icon" aria-label={`Excluir bloco ${index + 1}`} title="Excluir bloco" onClick={() => onChange(blocks.filter((_, i) => i !== index))}><Trash2 /></Button>
      </div>
      {(b.type === "text" || b.type === "section") && <TextAreaField label={`Texto do bloco ${index + 1}`} value={b.content} rows={4} maxLength={GIVEAWAY_MESSAGE_LIMITS.text} onChange={(content) => change(index, { ...b, content })} />}
      {b.type === "section" && <TextField label="Miniatura da seção" placeholder="https://" value={b.thumbnail} maxLength={GIVEAWAY_MESSAGE_LIMITS.url} onChange={(thumbnail) => change(index, { ...b, thumbnail })} />}
      {b.type === "separator" && <>
        <ToggleRow label="Mostrar linha divisória" checked={b.divider} onChange={(divider) => change(index, { ...b, divider })} />
        <Segmented label="Espaçamento" options={[{ value: "small", label: "Pequeno" }, { value: "large", label: "Grande" }]} value={b.spacing} onChange={(spacing) => change(index, { ...b, spacing })} />
      </>}
      {b.type === "gallery" && <div className="space-y-3">
        {b.urls.map((url, n) => <div className="flex items-end gap-1" key={n}>
          <div className="min-w-0 flex-1"><TextField label={`Mídia ${n + 1}`} placeholder="https://" value={url} maxLength={GIVEAWAY_MESSAGE_LIMITS.url} onChange={(value) => change(index, { ...b, urls: b.urls.map((old, i) => i === n ? value : old) })} /></div>
          <Button variant="ghost" size="icon" aria-label={`Excluir mídia ${n + 1} do bloco ${index + 1}`} title="Excluir mídia" onClick={() => change(index, { ...b, urls: b.urls.filter((_, i) => i !== n) })}><Trash2 /></Button>
        </div>)}
        <Button variant="outline" size="sm" disabled={b.urls.length >= GIVEAWAY_MESSAGE_LIMITS.gallery} onClick={() => change(index, { ...b, urls: [...b.urls, ""] })}><Plus />Adicionar mídia</Button>
      </div>}
    </div>)}
  </div>;
}