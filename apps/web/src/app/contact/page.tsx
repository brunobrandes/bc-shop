import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { localeCookieName, resolveLocale } from "@/lib/i18n/locale";

export default async function ContactPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = resolveLocale(
    cookieStore.get(localeCookieName)?.value,
    headerStore.get("accept-language") ?? undefined,
  );
  redirect(`/${locale}/contact`);
}
