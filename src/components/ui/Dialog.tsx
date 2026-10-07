import {
    useEffect,
    useRef,
    type ReactNode,
  } from "react";
  
  import { X } from "lucide-react";
  
  type DialogProps = {
    open: boolean;
    title: string;
    description?: string;
    children: ReactNode;
    onClose?: () => void;
    dismissible?: boolean;
  };
  
  function Dialog({
    open,
    title,
    description,
    children,
    onClose,
    dismissible = true,
  }: DialogProps) {
    const dialogRef =
      useRef<HTMLDivElement | null>(null);
  
    useEffect(() => {
      if (!open) {
        return;
      }
  
      const dialog =
        dialogRef.current;
  
      if (!dialog) {
        return;
      }
  
      const previousActiveElement =
        document.activeElement as HTMLElement | null;
  
      const getFocusableElements = () =>
        dialog.querySelectorAll<HTMLElement>(
          [
            "button:not(:disabled)",
            "[href]",
            "input:not(:disabled)",
            "select:not(:disabled)",
            "textarea:not(:disabled)",
            '[tabindex]:not([tabindex="-1"])',
          ].join(",")
        );
  
      getFocusableElements()[0]?.focus();
  
      function handleKeyDown(
        event: KeyboardEvent
      ) {
        if (
          event.key === "Escape" &&
          dismissible &&
          onClose
        ) {
          event.preventDefault();
          onClose();
          return;
        }
  
        if (event.key !== "Tab") {
          return;
        }
  
        const elements =
          getFocusableElements();
  
        if (elements.length === 0) {
          event.preventDefault();
          return;
        }
  
        const firstElement =
          elements[0];
  
        const lastElement =
          elements[elements.length - 1];
  
        if (
          event.shiftKey &&
          document.activeElement === firstElement
        ) {
          event.preventDefault();
          lastElement.focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === lastElement
        ) {
          event.preventDefault();
          firstElement.focus();
        }
      }
  
      document.addEventListener(
        "keydown",
        handleKeyDown
      );
  
      return () => {
        document.removeEventListener(
          "keydown",
          handleKeyDown
        );
  
        previousActiveElement?.focus();
      };
    }, [
      open,
      dismissible,
      onClose,
    ]);
  
    if (!open) {
      return null;
    }
  
    function handleBackdropClick() {
      if (
        dismissible &&
        onClose
      ) {
        onClose();
      }
    }
  
    return (
      <div
        className="dialog-backdrop"
        onMouseDown={handleBackdropClick}
      >
        <div
          ref={dialogRef}
          className="dialog-surface"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby={
            description
              ? "dialog-description"
              : undefined
          }
          onMouseDown={(event) =>
            event.stopPropagation()
          }
        >
          <div className="dialog-header">
            <div className="dialog-heading">
              <h2 id="dialog-title">
                {title}
              </h2>
  
              {description && (
                <p id="dialog-description">
                  {description}
                </p>
              )}
            </div>
  
            {dismissible && onClose && (
              <button
                type="button"
                className="dialog-close"
                onClick={onClose}
                aria-label="Close dialog"
                data-tooltip="CLOSE"
              >
                <X
                  size={19}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
  
          <div className="dialog-content">
            {children}
          </div>
        </div>
      </div>
    );
  }
  
  export default Dialog;