import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title?: string;
}

export default function PdfViewerModal({ isOpen, onClose, fileUrl, title = 'Xem Giáo Trình' }: PdfViewerModalProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [containerWidth, setContainerWidth] = useState<number>();
  const [isLoading, setIsLoading] = useState(true);

  // Measure container for optimal mobile scaling
  const onWrapperRef = (ref: HTMLDivElement | null) => {
    if (ref) {
      setContainerWidth(ref.getBoundingClientRect().width);
    }
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      // Reset state on open when file changes or newly opened
      setPageNumber(1);
      setScale(1.0);
      setIsLoading(true);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, fileUrl]); // Removed onClose from dependencies to prevent unintended resets

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setIsLoading(false);
  }

  function changePage(offset: number) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function zoomIn() {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  }

  function zoomOut() {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-6 animate-in fade-in duration-300">
      <div 
        className="relative w-full h-full sm:h-full max-h-[95vh] sm:max-w-6xl card-hand-drawn bg-surface flex flex-col overflow-hidden shadow-hard-lg sm:rotate-1"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Playful tape on top left */}
        <div className="absolute top-2 left-6 w-16 h-5 bg-black/10 -rotate-3 z-20"></div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b-[3px] border-ink bg-surface-soft shrink-0 z-10">
          <h2 className="heading-hand-drawn text-2xl sm:text-3xl text-ink truncate pr-4 ml-6">{title}</h2>
          <div className="flex items-center gap-2 sm:gap-4">
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-4 py-2 font-bold font-sans text-brand-navy hover:text-white bg-surface hover:bg-brand-navy border-2 border-ink wobbly-border-sm transition-all shadow-[2px_2px_0px_#2d2d2d] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <ExternalLink strokeWidth={2.5} className="w-5 h-5" />
              Mở lớn hơn
            </a>
            <button
              onClick={onClose}
              className="w-10 h-10 wobbly-border border-2 border-transparent hover:border-ink flex items-center justify-center text-ink hover:bg-white active:bg-stone transition-all shrink-0"
              title="Đóng (Esc)"
            >
              <X strokeWidth={3} className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b-[3px] border-ink bg-surface shrink-0 gap-2 overflow-x-auto z-10 wobbly-border-sm m-2">
          <div className="flex items-center gap-2">
            <button
              disabled={pageNumber <= 1}
              onClick={previousPage}
              className="w-10 h-10 border-2 border-ink rounded-full bg-canvas flex items-center justify-center hover:bg-white disabled:opacity-40 disabled:hover:bg-canvas disabled:border-slate active:bg-slate/20 transition-all shadow-[2px_2px_0px_#2d2d2d] active:shadow-none active:-translate-y-[-2px] active:-translate-x-[-2px]"
            >
              <ChevronLeft strokeWidth={3} className="w-6 h-6 -ml-0.5 mt-0.5" />
            </button>
            <span className="text-xl font-bold font-sans text-ink min-w-[70px] text-center bg-surface-soft px-3 py-1 border-2 border-ink/40 wobbly-border-sm -rotate-1">
              {pageNumber} / {numPages || '--'}
            </span>
            <button
              disabled={pageNumber >= (numPages || 1)}
              onClick={nextPage}
              className="w-10 h-10 border-2 border-ink rounded-full bg-canvas flex items-center justify-center hover:bg-white disabled:opacity-40 disabled:hover:bg-canvas disabled:border-slate active:bg-slate/20 transition-all shadow-[2px_2px_0px_#2d2d2d] active:shadow-none active:-translate-y-[-2px] active:-translate-x-[-2px]"
            >
              <ChevronRight strokeWidth={3} className="w-6 h-6 mr-0.5 mt-0.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 max-w-[200px] sm:max-w-none ml-auto">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.6}
              className="w-10 h-10 border-2 border-ink flex items-center justify-center hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent transition-all shadow-[1px_1px_0px_#2d2d2d] active:shadow-none active:translate-y-[1px] active:translate-x-[1px] wobbly-border-sm"
              title="Thu nhỏ"
            >
              <ZoomOut strokeWidth={2.5} className="w-5 h-5" />
            </button>
            <span className="text-lg font-bold font-display text-ink w-14 text-center select-none hidden sm:inline-block rotate-2">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="w-10 h-10 border-2 border-ink flex items-center justify-center hover:bg-surface-soft disabled:opacity-40 disabled:hover:bg-transparent transition-all shadow-[1px_1px_0px_#2d2d2d] active:shadow-none active:translate-y-[1px] active:translate-x-[1px] wobbly-border-sm"
              title="Phóng to"
            >
              <ZoomIn strokeWidth={2.5} className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PDF Body */}
        <div 
          className="flex-1 w-full bg-canvas overflow-auto relative flex justify-center CustomScrollbar" 
          ref={onWrapperRef}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="py-6 px-4 md:px-8 min-h-max flex flex-col items-center">
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex flex-col items-center justify-center p-10 text-ink bg-surface border-[3px] border-ink wobbly-border-md shadow-hard rotate-1 mt-10">
                  <div className="w-12 h-12 rounded-full border-4 border-ink/20 border-t-ink animate-spin mb-4" />
                  <p className="font-bold font-sans text-xl">Đang tải tài liệu...</p>
                </div>
              }
              error={
                <div className="p-8 text-center text-ink bg-semantic-error/10 border-[3px] border-semantic-error wobbly-border-md shadow-hard max-w-sm mt-10 -rotate-1">
                  <p className="font-bold font-sans text-2xl mb-2 text-semantic-error underline decoration-wavy decoration-2">Lỗi tải PDF</p>
                  <p className="font-sans text-lg mb-6">Xin lỗi nha! Không thể hiển thị tài liệu này. Hãy chọn mở bằng thẻ mới nhé.</p>
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn-hand-drawn-secondary px-4 py-3 inline-flex items-center justify-center text-lg w-full">
                    Mở thẻ mới
                  </a>
                </div>
              }
              className="flex flex-col items-center"
            >
              {numPages && containerWidth && (
                <div className="shadow-hard-lg overflow-hidden bg-white border-[3px] border-ink wobbly-border relative p-2">
                  <Page 
                    pageNumber={pageNumber} 
                    scale={scale}
                    width={containerWidth ? Math.min(containerWidth - 32, 1000) : undefined}
                    className="max-w-full"
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    loading={
                      <div className="flex items-center justify-center w-full h-[600px] text-slate">
                        <div className="w-8 h-8 rounded-full border-[3px] border-ink/20 border-t-ink animate-spin" />
                      </div>
                    }
                  />
                  
                  {/* Invisible touch zones for easy mobile navigation */}
                  <div 
                    className="absolute top-0 bottom-0 left-0 w-1/4 z-10 cursor-pointer" 
                    onClick={(e) => {
                      if (pageNumber > 1) { 
                        e.preventDefault(); 
                        previousPage(); 
                      }
                    }} 
                    title="Trang trước"
                  />
                  <div 
                    className="absolute top-0 bottom-0 right-0 w-1/4 z-10 cursor-pointer" 
                    onClick={(e) => {
                      if (pageNumber < numPages) { 
                        e.preventDefault(); 
                        nextPage(); 
                      }
                    }} 
                    title="Trang sau"
                  />
                </div>
              )}
            </Document>
            
            {!isLoading && (
              <div className="mt-8 text-lg font-sans text-slate md:hidden pb-10 text-center border-[2px] border-dashed border-ink/20 p-2 wobbly-border-sm rotate-1">
                👉 Chạm vào 2 bên mép dọc tài liệu để lật trang nhé 👈
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
