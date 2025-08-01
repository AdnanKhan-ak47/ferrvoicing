import { redirect } from "next/navigation"

export default function HomePage() {
  // TODO
  // Check if user is logged in (you can replace this with actual auth logic)
  const isLoggedIn = false // Replace with actual auth check

  if (isLoggedIn) {
    redirect("/invoices")
  } else {
    redirect("/login")
  }
}
