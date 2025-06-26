"use server"

import { signIn as authSignIn } from "@/lib/auth"

export async function handleSignIn( formData: FormData ) {
  return authSignIn( "resend", formData )
}