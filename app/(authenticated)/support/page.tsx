"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, HelpCircle, Send } from "lucide-react";
import { toast } from "sonner";

export default function SupportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call to submit support request
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Mock delay
      toast.success("Support request submitted!", {
        description: "We'll get back to you within 24 hours.",
      });
      setFormData({ message: "" });
    } catch (error) {
      toast.error("Error", {
        description: "Failed to submit your request. Please try again.",
      });
      console.log("support page error: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A3C34] text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-emerald-600" />
            <h1 className="text-3xl font-bold">Support</h1>
          </div>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10 cursor-pointer"
            onClick={() => router.push("/")}
          >
            Back to Home
          </Button>
        </div>

        {/* Contact Form */}
        <div className="bg-[#2A4B44] p-6 rounded-lg shadow-lg mb-8">
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? "Submitting..." : "Send Message"}
            </Button>
          </form>
        </div>

        {/* FAQ Section */}
        <div className="bg-[#2A4B44] p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-2xl font-semibold mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">
                How do I reset my password?
              </h3>
              <p className="text-gray-400">
                You can reset your password by clicking `Forgot Password` on the
                login page and following the instructions sent to your email.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">
                How can I update my payment method?
              </h3>
              <p className="text-gray-400">
                Go to the Wallet section in your profile to add or update your
                payment methods securely.
              </p>
            </div>
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
          </div>
        </div>

        {/* Contact Information */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">
            Other Ways to Reach Us
          </h2>
          <div className="flex justify-center gap-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-emerald-600" />
              <span>support@example.com</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600" />
              <span>1800-123-4567</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
