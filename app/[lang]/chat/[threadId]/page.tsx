import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDictionary, hasLocale } from "../../dictionaries";
import { loginPath } from "@/lib/auth-redirect";
import { SiteHeader } from "@/components/layout/site-header";
import { ChatThreadView } from "@/components/chat/chat-thread-view";

export default async function ChatThreadPage({
  params,
}: PageProps<"/[lang]/chat/[threadId]">) {
  const { lang, threadId } = await params;
  if (!hasLocale(lang)) notFound();

  const session = await auth();
  if (!session?.user) {
    redirect(await loginPath(lang));
  }
  if (session.user.userType !== "CUSTOMER") {
    redirect(`/${lang}`);
  }

  const dict = await getDictionary(lang);

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-background pb-16 md:pb-0">
      <SiteHeader
        lang={lang}
        dict={dict.siteHeader}
        common={dict.common}
        notificationsDict={dict.notifications}
      />
      <ChatThreadView
        threadId={threadId}
        lang={lang}
        dict={dict.chatThread}
        reportDict={dict.chatReport}
        common={dict.common}
      />
    </div>
  );
}
