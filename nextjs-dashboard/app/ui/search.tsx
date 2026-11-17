'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {useDebounceCallback} from "@/app/lib/hooks";

export default function Search({ placeholder }: { placeholder: string }) {

  const searchParams = useSearchParams(); // creates a URLSearchParams
  const pathname = usePathname(); // returns the current pathname (e.g., /dashboard/invoices)
  const { replace } = useRouter(); // replaces url to given


    const onSearchChange = useDebounceCallback((term: string) => {
      const params = new URLSearchParams(searchParams);
      // Updating url
      const pathname = usePathname();
      const { replace } = useRouter();
     
      if (term) {
        params.set('query', term);
      } else {
        params.delete('query');
      }
       console.log('Search term:', term, params.get('query'));
       replace(`${pathname}?${params.toString()}`);
    }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        defaultValue={searchParams.get('query')?.toString() || ''}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
