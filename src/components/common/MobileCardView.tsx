import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

interface MobileCardViewProps {
  data: any[];
  columns: Column[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  getRowClassName?: (item: any) => string;
  startIndex?: number;
}

export function MobileCardView({
  data,
  columns,
  onEdit,
  onDelete,
  getRowClassName,
  startIndex = 0,
}: MobileCardViewProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Tidak ada data
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const customClassName = getRowClassName ? getRowClassName(item) : '';
        
        return (
          <Card key={item.id || index} className={cn("p-4 space-y-2.5", customClassName)}>
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                {columns.map((column) => {
                  const cellValue = column.key === 'no' 
                    ? startIndex + index + 1 
                    : (item[column.key] || "-");
                  
                  const isReactElement = typeof cellValue === 'object' && cellValue !== null && 'type' in cellValue;
                  
                  return (
                    <div key={column.key} className="flex items-start gap-3">
                      <span className="text-xs font-medium text-muted-foreground min-w-[80px] pt-0.5">
                        {column.label}:
                      </span>
                      <span className={cn(
                        "text-sm flex-1",
                        column.align === 'right' ? "text-right" : ""
                      )}>
                        {isReactElement ? cellValue : String(cellValue)}
                      </span>
                    </div>
                  );
                })}
              </div>
              
              {(onEdit || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 ml-2 flex-shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(item)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(item)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
