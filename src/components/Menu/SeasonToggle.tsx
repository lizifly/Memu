import { useAppStore } from '@/store';
import type { SeasonMode } from '@/types/menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function SeasonToggle() {
  const { season, setSeason } = useAppStore();

  return (
    <Select value={season} onValueChange={(v) => setSeason(v as SeasonMode)}>
      <SelectTrigger className="w-[160px] h-11 text-base border-primary-500">
        <SelectValue placeholder="选择季节模式" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="default" className="text-base">🌿 默认模式</SelectItem>
        <SelectItem value="summer" className="text-base">☀️ 夏季模式</SelectItem>
        <SelectItem value="winter" className="text-base">❄️ 冬季模式</SelectItem>
      </SelectContent>
    </Select>
  );
}
