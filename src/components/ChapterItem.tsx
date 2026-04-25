import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { GripVertical, Trash2, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

interface ChapterItemProps {
  id: string;
  index: number;
  title: string;
  onDelete: (id: string) => void;
}

export const ChapterItem: React.FC<ChapterItemProps> = ({ id, index, title, onDelete }) => {
  return (
    <Draggable draggableId={id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "group flex items-center gap-3 p-3 bg-white border border-editorial-border rounded-lg shadow-sm transition-all",
            snapshot.isDragging && "shadow-xl border-editorial-text rotate-1 scale-[1.02] z-50",
            !snapshot.isDragging && "hover:bg-editorial-hover"
          )}
        >
          <div {...provided.dragHandleProps} className="text-editorial-accent hover:text-editorial-text transition-colors">
            <GripVertical size={16} />
          </div>
          
          <div className="flex-shrink-0 w-6 h-6 bg-editorial-sidebar flex items-center justify-center rounded-sm border border-editorial-border text-editorial-accent font-mono text-[10px]">
            {index + 1}
          </div>

          <div className="flex-grow flex items-center gap-2 overflow-hidden">
            <span className="font-medium text-sm text-editorial-text truncate">{title}</span>
          </div>

          <button
            onClick={() => onDelete(id)}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-editorial-accent hover:text-red-600 hover:bg-red-50 rounded transition-all"
            title="Remove chapter"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </Draggable>
  );
};
