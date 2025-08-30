"use client";
import React from "react";

interface BulkDeleteModalProps {
  bulk: string[] | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function BulkDeleteModal({ bulk, onConfirm, onCancel }: BulkDeleteModalProps) {
  if (!bulk) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 p-4 rounded w-full max-w-xs space-y-3 text-xs">
        <h3 className="font-semibold">Bulk delete {bulk.length} codes?</h3>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 px-3 py-1 rounded bg-red-600/80"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-1 rounded bg-neutral-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
