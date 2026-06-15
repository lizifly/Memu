import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/Common/ConfirmDialog';
import { WeekDetail } from './WeekDetail';
import { useHistoryStore } from '@/store/useHistoryStore';
import type { HistoryArchive } from '@/types/history';

function formatWeekLabel(archive: HistoryArchive): string {
  const start = archive.weekStart;
  const end = archive.weekEnd;
  // Extract year and week from weekId like "2024-W41"
  const match = archive.weekId.match(/^(\d{4})-W(\d+)$/);
  const yearWeek = match ? `${match[1]}年第${match[2]}周` : archive.weekId;
  // Format dates
  const startShort = start.slice(5).replace('-', '/');
  const endShort = end.slice(5).replace('-', '/');
  return `${yearWeek} (${startShort} - ${endShort})`;
}

export function HistoryTimeline() {
  const { archives, loadArchives, deleteArchive } = useHistoryStore();
  const [deleteTarget, setDeleteTarget] = useState<HistoryArchive | null>(null);

  useEffect(() => {
    loadArchives();
  }, [loadArchives]);

  const handleDelete = async () => {
    if (deleteTarget?.id != null) {
      await deleteArchive(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (archives.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">🕰️ 历史记录</h2>
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">暂无历史记录</p>
          <p className="text-sm mt-1">存档排餐计划后会显示在这里</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">🕰️ 历史记录</h2>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />

        <Accordion type="single" collapsible className="space-y-2">
          {archives.map((archive) => (
            <div key={archive.id} className="relative">
              {/* Timeline dot */}
              <div className="absolute -left-6 top-5 w-3 h-3 rounded-full bg-primary-500 border-2 border-white shadow" />

              <AccordionItem value={String(archive.id)} className="border rounded-lg bg-white shadow-sm">
                <AccordionTrigger className="px-4 text-base font-medium hover:no-underline">
                  <div className="flex items-center justify-between flex-1 pr-2">
                    <span>{formatWeekLabel(archive)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(archive);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <WeekDetail plan={archive.planData} />
                </AccordionContent>
              </AccordionItem>
            </div>
          ))}
        </Accordion>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除历史记录"
        description={deleteTarget ? `确定要删除「${formatWeekLabel(deleteTarget)}」的记录吗？` : ''}
        confirmText="删除"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
