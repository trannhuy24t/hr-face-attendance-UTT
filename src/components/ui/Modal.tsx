import type { ReactNode } from "react";
import { CloseOutlined } from "@ant-design/icons";

interface ModalProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

export function Modal({ title, subtitle, onClose, children, footer, wide }: ModalProps) {
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`modal${wide ? " modal-wide" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <div className="modal-title">{title}</div>
            {subtitle ? <div className="modal-subtitle">{subtitle}</div> : null}
          </div>
          <button type="button" className="modal-close" aria-label="Đóng" onClick={onClose}>
            <CloseOutlined />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}
