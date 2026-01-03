import { useState, useEffect } from "react";
import { Star, GripVertical, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface QuickMenuItem {
  title: string;
  url: string;
  icon: any;
}

interface QuickMenuManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickMenuItems: QuickMenuItem[];
  onUpdate: (items: QuickMenuItem[]) => void;
  allMenuItems: QuickMenuItem[];
}

export function QuickMenuManager({
  open,
  onOpenChange,
  quickMenuItems,
  onUpdate,
  allMenuItems,
}: QuickMenuManagerProps) {
  const [items, setItems] = useState<QuickMenuItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    setItems(quickMenuItems);
  }, [quickMenuItems]);

  const handleRemove = (url: string) => {
    const newItems = items.filter((item) => item.url !== url);
    setItems(newItems);
  };

  const handleAdd = (item: QuickMenuItem) => {
    if (!items.find((i) => i.url === item.url)) {
      const newItems = [...items, item];
      setItems(newItems);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveItem(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSave = () => {
    onUpdate(items);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setItems(quickMenuItems);
    onOpenChange(false);
  };

  const isInQuickMenu = (url: string) => items.some((item) => item.url === url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 gap-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl">Kelola Quick Menu</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Tambahkan menu favorit Anda untuk akses cepat. Seret untuk mengubah urutan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 px-6 pb-4 overflow-y-auto">
          {/* Quick Menu Items */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Quick Menu ({items.length})
            </h3>
            <div className="border-2 rounded-lg p-4 min-h-[400px] bg-muted/20">
              {items.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Belum ada quick menu. Klik menu di samping untuk menambahkan.
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <div
                        key={item.url}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border bg-card cursor-move hover:bg-accent/50 transition-colors",
                          draggedIndex === index && "opacity-50"
                        )}
                      >
                        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                        <ItemIcon className="h-4 w-4 shrink-0" />
                        <span className="text-sm flex-1 truncate">{item.title}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => handleRemove(item.url)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* All Available Items */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Semua Menu
            </h3>
            <div className="border-2 rounded-lg p-4 h-[400px] overflow-y-auto bg-muted/20">
              <div className="space-y-1">
                {allMenuItems.map((item) => {
                  const ItemIcon = item.icon;
                  const inQuickMenu = isInQuickMenu(item.url);
                  return (
                    <div
                      key={item.url}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-colors",
                        inQuickMenu
                          ? "bg-primary/10 text-primary cursor-not-allowed"
                          : "hover:bg-accent cursor-pointer"
                      )}
                      onClick={() => !inQuickMenu && handleAdd(item)}
                    >
                      <ItemIcon className="h-4 w-4 shrink-0" />
                      <span className="text-sm flex-1 truncate">{item.title}</span>
                      {inQuickMenu && (
                        <Star className="h-4 w-4 fill-primary shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t bg-muted/30">
          <Button
            variant="outline"
            className="flex-1 rounded-lg"
            onClick={handleCancel}
          >
            Batal
          </Button>
          <Button
            className="flex-1 rounded-lg bg-slate-900 hover:bg-slate-800"
            onClick={handleSave}
          >
            Simpan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}