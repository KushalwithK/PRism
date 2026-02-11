"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, CreditCard, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface VerifyData {
  plan: string;
  usageLimit: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  paymentId: string;
}

interface PaymentSuccessModalProps {
  open: boolean;
  onClose: () => void;
  data: VerifyData | null;
  planName: string;
  planPrice: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function AnimatedCheck() {
  return (
    <motion.div
      className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
    >
      <svg
        className="h-10 w-10"
        viewBox="0 0 24 24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Circle */}
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-green-500/40"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
        />
        {/* Checkmark */}
        <motion.path
          d="M8 12.5l2.5 3L16 9"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-green-500"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, delay: 0.55, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
}

export function PaymentSuccessModal({
  open,
  onClose,
  data,
  planName,
  planPrice,
}: PaymentSuccessModalProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [open, handleEsc]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Header */}
            <div className="flex flex-col items-center px-6 pt-8 pb-2">
              <AnimatedCheck />
              <motion.h2
                className="mt-5 text-xl font-semibold"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Payment Successful!
              </motion.h2>
              <motion.p
                className="mt-1 text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                Your PRism {planName} plan is now active.
              </motion.p>
            </div>

            {/* Details */}
            <motion.div
              className="px-6 py-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3.5">
                {/* Plan */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap size={14} />
                    <span>Plan</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{data?.plan ?? planName.toUpperCase()}</Badge>
                    <span className="text-sm font-medium">{planPrice}/mo</span>
                  </div>
                </div>

                {data && (
                  <>
                    {/* Usage */}
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Zap size={14} />
                        <span>Usage Limit</span>
                      </div>
                      <span className="text-sm font-medium">
                        {data.usageLimit === -1
                          ? "Unlimited"
                          : `${data.usageLimit} generations/mo`}
                      </span>
                    </div>

                    {/* Billing Period */}
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={14} />
                        <span>Period</span>
                      </div>
                      <span className="text-sm font-medium">
                        {formatDate(data.currentPeriodStart)} &ndash;{" "}
                        {formatDate(data.currentPeriodEnd)}
                      </span>
                    </div>

                    {/* Payment ID */}
                    <div className="h-px bg-border" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CreditCard size={14} />
                        <span>Reference</span>
                      </div>
                      <span className="text-sm font-mono text-xs text-muted-foreground">
                        {data.paymentId.length > 22
                          ? `${data.paymentId.slice(0, 22)}...`
                          : data.paymentId}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </motion.div>

            {/* Footer */}
            <motion.div
              className="flex flex-col gap-2 px-6 pb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <Button
                className="w-full"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Go to Dashboard
              </Button>
              <Button variant="ghost" className="w-full" onClick={onClose}>
                Dismiss
              </Button>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
