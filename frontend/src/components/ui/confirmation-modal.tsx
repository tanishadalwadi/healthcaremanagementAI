/**
 * ConfirmationModal — "Mark ready for discharge" confirmation dialog.
 *
 * Phase 9D replaced the old instant-discharge flow. This modal now has
 * exactly one mode and one call site: the doctor's "Mark ready for
 * discharge…" button in patient-detail-view.tsx. On confirm it calls
 * requestDischarge() — the patient stays active until admin finalizes
 * via DischargeApprovalModal.
 *
 * Spec (design reference — the ONLY place shadows appear in the system):
 *   Overlay: position:fixed; inset:0; z-index:80; bg rgba(29,27,46,0.34)
 *   Card: bg #fff; border-radius:18px; padding:26px; width:400px; max-width:100%
 *   Shadow: 0 24px 60px -12px rgba(29,27,46,0.4)  ← sole permitted shadow
 *   Icon chip: 42×42px; radius:12px; bg:#FBE9DA; icon ti-clock-check 22px #9A6435
 *   Title: 16px/600
 *   Body: 12px/500/#6B6474; line-height:1.55; margin-top:8px
 *   Button row: flex; gap:10px; justify-content:flex-end; margin-top:22px
 *   Cancel: "Keep active"  border #C9BBDF / color #7C5FAE
 *   Confirm: "Mark ready"  bg/border #E08A4F
 *
 * Client component — manages focus trap via dialog semantics.
 */

"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export interface ConfirmationModalProps {
  isOpen: boolean;
  patientName: string;
  /** Number of treatment-plan items still pending — shown in body copy */
  pendingItemCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmationModal({
  isOpen,
  patientName,
  pendingItemCount,
  onClose,
  onConfirm,
}: ConfirmationModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button when the modal opens
  useEffect(() => {
    if (isOpen) {
      cancelRef.current?.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const pendingText =
    pendingItemCount === 0
      ? "All treatment-plan items are complete."
      : pendingItemCount === 1
      ? "One treatment-plan item is still pending."
      : `${pendingItemCount} treatment-plan items are still pending.`;

  const title        = `Mark ${patientName} ready for discharge?`;
  const body         = `This sends a discharge request to the admin queue. The patient stays active until admin reviews the discharge checklist, generates the summary and bill, and finalizes the discharge. ${pendingText}`;
  const confirmLabel = "Mark ready";
  const confirmColor = "#E08A4F";

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 80,
        background: "rgba(29,27,46,0.34)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 26,
          width: 400,
          maxWidth: "100%",
          boxShadow: "0 24px 60px -12px rgba(29,27,46,0.4)",
        }}
      >
        {/* Icon chip */}
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: "#FBE9DA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
          aria-hidden="true"
        >
          <span
            className="ti ti-clock-check"
            style={{ fontSize: 22, color: "#9A6435" }}
          />
        </div>

        {/* Title */}
        <div id="modal-title" style={{ fontSize: 16, fontWeight: 600 }}>
          {title}
        </div>

        {/* Body */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "#6B6474",
            lineHeight: 1.55,
            marginTop: 8,
          }}
        >
          {body}
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            gap: 10,
            justifyContent: "flex-end",
            marginTop: 22,
          }}
        >
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 600,
              padding: "10px 18px",
              borderRadius: 10,
              border: "1px solid #C9BBDF",
              background: "#fff",
              color: "#7C5FAE",
            }}
          >
            Keep active
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: 600,
              padding: "10px 18px",
              borderRadius: 10,
              border: `1px solid ${confirmColor}`,
              background: confirmColor,
              color: "#fff",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  // Render into document.body to escape any overflow:hidden ancestors
  return createPortal(modal, document.body);
}
