"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, HelpCircle, Send, Home } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";

// Expected error response structure
interface ErrorResponse {
  message?: string;
}

export default function SupportPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    message: "",
  });

  const mutation = useMutation({
    mutationFn: async (submitData: { message: string; userId: string }) => {
      // Sanitize message on the client side
      const sanitizedMessage = DOMPurify.sanitize(submitData.message, {
        ALLOWED_TAGS: [], // Disallow all HTML tags
        ALLOWED_ATTR: [], // Disallow all attributes
      });

      if (!sanitizedMessage) {
        throw new Error("Message cannot be empty after sanitization");
      }

      const response = await axios.post("/api/support", {
        message: sanitizedMessage,
        userId: submitData.userId,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Support request submitted!", {
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ message: "" });
    },
    onError: (error: AxiosError<ErrorResponse>) => {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred. Please try again.";
      toast.error("Error", {
        description: errorMessage,
      });
      console.log("support page error: ", error);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Error", { description: "User session required. Please log in." });
      return;
    }
    mutation.mutate({ message: formData.message, userId: session.user.id });
  };

  return (
    <div className="min-h-screen bg-[#1A3C34] text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-8">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl font-bold">Support</h1>
          </div>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 w-full sm:w-auto cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Home className="h-5 w-5" />
            <span className="">Home</span>
          </Button>
        </div>

        {/* Contact Form */}
        <div className="bg-[#2A4B44] p-4 sm:p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
          <p className="text-gray-400 mb-6">
            Have a question or need assistance? Fill out the form below, and our
            team will get back to you as soon as possible.
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="message" className="text-white mb-2">
                Message
              </Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="How can we help you?"
                className="bg-[#1A3C34] border-emerald-600 text-white placeholder-gray-500"
                rows={8}
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto cursor-pointer"
            >
              <Send className="mr-2 h-5 w-5" />
              {mutation.isPending ? "Submitting..." : "Send Message"}
            </Button>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="bg-[#2A4B44] p-4 sm:p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">
                What should I do if I encounter a ride issue?
              </h3>
              <p className="text-gray-400">
                Please contact us using the form above or call our support line.
                Provide your ride ID from the Ride History page for faster
                assistance.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">
                What should I do if my carbon coin top-up failed but the amount was deducted from my bank account?
              </h3>
              <p className="text-gray-400">
                Contact us immediately using the form above or our support line. Provide your transaction ID, bank details, and top-up attempt timestamp for a quick investigation and refund processing if applicable.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">
                How can I change my email ID?
              </h3>
              <p className="text-gray-400">
                To change your email ID, please submit a support ticket using the form above. Our support team will review your request and assist you with the process.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-center mb-17">
          <h2 className="text-2xl font-semibold mb-4">
            Other Ways to Reach Us
          </h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <a
                href="mailto:info@pageoptima.com"
                className="text-white hover:text-emerald-400 hover:underline"
              >
                info@pageoptima.com
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <a
                href="tel:1800-123-4567"
                className="text-white hover:text-emerald-400 hover:underline"
              >
                +91 8509869611
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}