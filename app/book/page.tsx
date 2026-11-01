import { redirect } from "next/navigation";

// Old /book address: booking now starts from the contact section (pay ₹199, then pick a time).
export default function BookPage() {
  redirect("/contact");
}
