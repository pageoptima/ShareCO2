"use client"

import { useState } from "react"
import { z } from "zod"
import { handleSignIn } from "./auth-actions"

// Define validation schema
const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email address")
})

type FormErrors = {
  email?: string
}

export function SignInForm() {
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Validate the input
      SignInSchema.parse({ email })
      setErrors({})
      
      // Create FormData and submit
      const formData = new FormData()
      formData.append("email", email)
      
      // Call the server action
      await handleSignIn(formData)
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Extract validation errors
        const formattedErrors: FormErrors = {}
        error.errors.forEach((err) => {
          if (err.path[0]) {
            formattedErrors[err.path[0] as keyof FormErrors] = err.message
          }
        })
        setErrors(formattedErrors)
      } else {
        // Handle other errors
        console.error("Sign in error:", error)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          name="email"
          placeholder="Email"
          className="w-full p-3 border-0 rounded-lg bg-[#2F4F4F] text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]"
        />
        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full p-3 bg-[#2E7D32] text-white rounded-lg hover:bg-[#388E3C] transition-colors"
      >
        {isSubmitting ? "Sending..." : "Next"}
      </button>
    </form>
  );
}