import { redirect } from 'next/navigation';

export default function Home() {
  // This page is just for redirecting to the default locale.
  redirect('/en');
}
