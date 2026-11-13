"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { publicApiGet, publicApiPost } from "@/lib/api";
import { toast } from "sonner";

type PaymentStatus = "idle" | "checking" | "pending" | "active" | "failed" | "error";

interface PaymentVerification {
  status: "active" | "pending" | "failed" | "inactive";
  expiresAt?: string | null;
  reference?: string;
  displayText?: string | null;
}

export default function SubscribePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("idle");
  const [reference, setReference] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoginVerified, setIsLoginVerified] = useState(false);

  const completeLogin = useCallback(async () => {
    const subscriptionToken = sessionStorage.getItem("subscriptionToken");
    if (!subscriptionToken) {
      toast.success("Payment confirmed. Your subscription is active.");
      return;
    }

    try {
      const session = await publicApiPost<{
        token: string;
        user: { id: string; username: string; role: string };
      }>("/auth/complete-login", {}, subscriptionToken);
      localStorage.setItem("authToken", session.token);
      localStorage.setItem("user", JSON.stringify(session.user));
      sessionStorage.removeItem("subscriptionToken");
      toast.success("Payment confirmed. Opening your dashboard...");
      router.replace("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Payment confirmed, but automatic sign-in failed: ${error.message}`
          : "Payment confirmed, but automatic sign-in failed. Please sign in."
      );
    }
  }, [router]);

  const verifyPayment = useCallback(async (
    paymentReference: string,
    showLoading = true
  ) => {
    setReference(paymentReference);
    if (showLoading) setPaymentStatus("checking");
    try {
      const result = await publicApiGet<PaymentVerification>(
        `/subscription/payments/verify/${encodeURIComponent(paymentReference)}`
      );
      setPaymentStatus(result.status === "inactive" ? "idle" : result.status);
      setExpiresAt(result.expiresAt || null);
      setVerificationMessage("");
      if (result.status === "active") {
        void completeLogin();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to verify payment.";
      setVerificationMessage(message);
      if (showLoading) {
        setPaymentStatus("error");
        toast.error(message);
      }
    }
  }, [completeLogin]);

  useEffect(() => {
    if (!sessionStorage.getItem("subscriptionToken")) {
      router.replace("/");
      return;
    }
    setIsLoginVerified(true);
    const query = new URLSearchParams(window.location.search);
    const paymentReference = query.get("reference") || query.get("trxref");
    if (paymentReference) {
      void verifyPayment(paymentReference);
      return;
    }

    const subscriptionToken = sessionStorage.getItem("subscriptionToken");
    if (!subscriptionToken) return;
    setPaymentStatus("checking");
    void publicApiGet<PaymentVerification>(
      "/subscription/status",
      subscriptionToken
    )
      .then((result) => {
        setExpiresAt(result.expiresAt || null);
        if (result.status === "active") {
          setPaymentStatus("active");
          void completeLogin();
        } else if (result.reference) {
          setReference(result.reference);
          setDisplayText(result.displayText || "");
          setPaymentStatus(result.status === "failed" ? "failed" : "pending");
        } else {
          setPaymentStatus("idle");
        }
      })
      .catch((error: unknown) => {
        setPaymentStatus("idle");
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to check subscription status."
        );
      });
  }, [completeLogin, router, verifyPayment]);

  useEffect(() => {
    if (paymentStatus !== "pending" || !reference) return;
    const timer = window.setInterval(() => {
      void verifyPayment(reference, false);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paymentStatus, reference, verifyPayment]);

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const subscriptionToken = sessionStorage.getItem("subscriptionToken");
      if (!subscriptionToken) {
        router.replace("/");
        return;
      }
      const checkout = await publicApiPost<{
        reference: string;
        status: "active" | "pending" | "failed";
        displayText: string;
        expiresAt?: string | null;
      }>("/subscription/payments/initialize", { phone }, subscriptionToken);
      setIsSubmitting(false);
      setReference(checkout.reference);
      setDisplayText(checkout.displayText);
      setExpiresAt(checkout.expiresAt || null);
      setPaymentStatus(checkout.status);
      if (checkout.status === "active") {
        void completeLogin();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start payment.");
      setIsSubmitting(false);
    }
  };

  if (!isLoginVerified) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ceramic-background via-white to-ceramic-secondary p-4">
        <Loader2 className="h-6 w-6 animate-spin text-ceramic-primary" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ceramic-background via-white to-ceramic-secondary p-4">
      <section className="w-full max-w-lg rounded-2xl border border-white/40 bg-white/90 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ceramic-primary text-white">
            <Smartphone className="h-7 w-7" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ceramic-primary">
            Mwazanga Hardware
          </p>
          <h1 className="mt-2 text-2xl font-bold text-ceramic-accent">
            Monthly subscription
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pay with M-Pesa through Paystack to unlock the dashboard and POS.
          </p>
        </div>

        <div className="mb-6 rounded-xl bg-ceramic-background p-5 text-center">
          <p className="text-sm text-muted-foreground">Monthly access</p>
          <p className="mt-1 text-3xl font-bold text-ceramic-accent">
            KSh 3,000
            <span className="text-base font-medium text-muted-foreground"> / month</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Access starts after payment. Renewal prompts are sent on the 1st
            of each month and must be approved on your phone. Access pauses if
            payment is not completed by expiry.
          </p>
        </div>

        {paymentStatus === "active" ? (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
            <p className="font-semibold text-foreground">Subscription active</p>
            {expiresAt && (
              <p className="text-sm text-muted-foreground">
                Access until {new Date(expiresAt).toLocaleDateString()}
              </p>
            )}
            <Button className="w-full" onClick={() => router.push("/")}>
              Continue to sign in
            </Button>
          </div>
        ) : paymentStatus === "checking" ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking payment...
          </div>
        ) : reference && (paymentStatus === "pending" || paymentStatus === "failed" || paymentStatus === "error") ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              {paymentStatus === "pending"
                ? displayText || "Approve the M-Pesa prompt on your phone. Access activates automatically after payment."
                : paymentStatus === "failed"
                  ? "The payment was not completed."
                  : "We could not verify the payment right now."}
            </p>
            {paymentStatus === "pending" && (
              <p className="text-xs text-muted-foreground">
                Waiting for payment confirmation. This page checks automatically.
              </p>
            )}
            {verificationMessage && (
              <p className="text-xs text-destructive">{verificationMessage}</p>
            )}
            <Button
              className="w-full"
              onClick={() => void verifyPayment(reference)}
            >
              Verify payment
            </Button>
            <button
              className="text-sm text-ceramic-primary hover:underline"
              onClick={() => {
                setReference("");
                setDisplayText("");
                setVerificationMessage("");
                setPaymentStatus("idle");
              }}
            >
              Start a new payment
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subscription-phone">M-Pesa phone number</Label>
              <Input
                id="subscription-phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0712 345 678"
              />
              <p className="text-xs text-muted-foreground">
                Use a Kenyan number starting with 07, 01, or +254.
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting to Paystack...
                </span>
              ) : (
                "Send M-Pesa payment prompt"
              )}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already subscribed?{" "}
          <Link href="/" className="font-medium text-ceramic-primary hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
