/**
 * useDragDropState.ts
 * 
 * Focused hook for drag and drop state management
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { useLogger } from '../useLogger';

export interface UseDragDropStateReturn {
  isDragOver: boolean;
  dragCounter: number;
  dropHandlers: {
    onDragEnter: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

export interface DragDropConfig {
  excludeSelector?: string;
  onFilesDropped: (files: FileList) => void;
}

export function useDragDropState({ 
  excludeSelector = '[data-no-drop="true"]',
  onFilesDropped 
}: DragDropConfig): UseDragDropStateReturn {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const { debug } = useLogger('useDragDropState');

  const shouldExclude = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof Element)) return false;
    const excludedElement = (target as Element).closest(excludeSelector);
    return !!excludedElement;
  }, [excludeSelector]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (shouldExclude(e.target)) return;

    if (e.dataTransfer.types.includes('Files')) {
      dragCounter.current++;
      if (dragCounter.current === 1) {
        setIsDragOver(true);
        debug('Drag enter - starting drag operation');
      }
    }
  }, [shouldExclude, debug]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (shouldExclude(e.target)) return;

    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
    }
  }, [shouldExclude]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (shouldExclude(e.target)) return;

    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
      debug('Drag leave - ending drag operation');
    }
  }, [shouldExclude, debug]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (shouldExclude(e.target)) return;

    dragCounter.current = 0;
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      debug(`Dropped ${files.length} files`);
      onFilesDropped(files);
    }
  }, [shouldExclude, onFilesDropped, debug]);

  useEffect(() => {
    return () => {
      dragCounter.current = 0;
      setIsDragOver(false);
    };
  }, []);

  return {
    isDragOver,
    dragCounter: dragCounter.current,
    dropHandlers: {
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop
    }
  };
} 