'use client';

import { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPE = 'application/pdf';

interface PdfUploadProps {
  onFileSelected: (file: File) => void;
  onFileRemoved?: () => void;
  onUploadComplete?: (fileUrl: string) => void;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (file.type !== ACCEPTED_TYPE) {
    return 'Solo se aceptan archivos PDF';
  }
  if (file.size > MAX_FILE_SIZE) {
    return `El archivo excede el límite de ${formatFileSize(MAX_FILE_SIZE)}`;
  }
  return null;
}

export function PdfUpload({
  onFileSelected,
  onFileRemoved,
  isUploading = false,
  uploadProgress = 0,
  error: externalError,
  disabled = false,
  className,
}: PdfUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const displayError = externalError ?? validationError;

  const handleFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        return;
      }
      setValidationError(null);
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleRemove = useCallback(() => {
    setSelectedFile(null);
    setValidationError(null);
    if (inputRef.current) inputRef.current.value = '';
    onFileRemoved?.();
  }, [onFileRemoved]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, isUploading, handleFile],
  );

  const openFilePicker = useCallback(() => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  }, [disabled, isUploading]);

  if (selectedFile && !validationError) {
    return (
      <div className={cn('flex flex-col', className)}>
        <div
          className={cn(
            'flex items-center gap-4 rounded-xl border border-outline-variant/20 bg-surface-container-lowest p-4',
            'transition-all duration-200',
          )}
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-error-container/30">
            <span className="material-symbols-outlined text-[24px] text-error">
              picture_as_pdf
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-body font-medium text-on-surface">
              {selectedFile.name}
            </p>
            <p className="text-xs font-body text-on-surface-variant/60">
              {formatFileSize(selectedFile.size)}
            </p>

            {isUploading && (
              <div className="mt-2 flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-outline-variant/15">
                  <div
                    className="h-full rounded-full bg-tertiary transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(uploadProgress, 100)}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs font-body text-tertiary">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
            )}
          </div>

          {!isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              aria-label="Quitar archivo"
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                'text-on-surface-variant/40 transition-all duration-200',
                'hover:bg-error-container/20 hover:text-error',
                'disabled:opacity-40 disabled:pointer-events-none',
              )}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {displayError && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-error-container/15 px-3 py-2">
            <span className="material-symbols-outlined text-[16px] text-error">error</span>
            <p className="text-xs font-body text-error">{displayError}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFilePicker}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
        aria-label="Zona de carga de PDF. Arrastrá un archivo o hacé click para seleccionar."
        aria-disabled={disabled || isUploading}
        className={cn(
          'group relative flex cursor-pointer flex-col items-center justify-center',
          'rounded-xl border-2 border-dashed px-6 py-10',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/40 focus-visible:ring-offset-2',
          isDragging
            ? 'border-tertiary bg-tertiary/5'
            : 'border-outline-variant/30 bg-surface-container-lowest hover:border-outline-variant/50 hover:bg-surface-container-low/50',
          (disabled || isUploading) && 'pointer-events-none opacity-50',
        )}
      >
        <span
          className={cn(
            'material-symbols-outlined mb-3 text-[40px] transition-all duration-200',
            isDragging
              ? 'text-tertiary scale-110'
              : 'text-on-surface-variant/40 group-hover:text-on-surface-variant/60',
          )}
        >
          upload_file
        </span>

        <p
          className={cn(
            'text-center text-sm font-body font-medium transition-colors duration-200',
            isDragging ? 'text-tertiary' : 'text-on-surface-variant',
          )}
        >
          Arrastrá tu programa o planificación aquí
        </p>

        <p className="mt-1.5 text-center text-xs font-body text-on-surface-variant/50">
          PDF, máximo 10 MB
        </p>

        <p className="mt-3 text-center text-xs font-body">
          <span className="text-tertiary hover:underline">o seleccioná un archivo</span>
        </p>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPE}
          onChange={handleInputChange}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {displayError && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-error-container/15 px-3 py-2">
          <span className="material-symbols-outlined text-[16px] text-error">error</span>
          <p className="text-xs font-body text-error">{displayError}</p>
        </div>
      )}
    </div>
  );
}
