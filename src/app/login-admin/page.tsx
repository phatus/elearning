import { getAdminSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import LoginAdminClient from "./LoginAdminClient"

export const metadata = {
  title: "Login Admin | E-Learning MTsN 1 Pacitan",
  description: "Portal autentikasi Admin pengelola E-Learning MTsN 1 Pacitan."
}

export default async function LoginAdminPage() {
  const session = await getAdminSession()
  if (session) {
    redirect("/admin")
  }

  return <LoginAdminClient />
}
