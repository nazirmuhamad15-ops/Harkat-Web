'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from 'lucide-react';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleCreate = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  }

  return (
    <Select defaultValue={locale} onValueChange={handleCreate} disabled={isPending}>
      <SelectTrigger className="w-[80px] h-8 lg:w-[130px] lg:h-9 border-none bg-transparent hover:bg-gray-100 focus:ring-0 focus:ring-offset-0 gap-2">
        <Globe className="w-4 h-4 text-gray-500" />
        <SelectValue placeholder="Bahasa" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="id">Indonesia</SelectItem>
        <SelectItem value="en">English</SelectItem>
      </SelectContent>
    </Select>
  );
}
