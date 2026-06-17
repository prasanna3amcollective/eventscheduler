import { redirect } from 'next/navigation';

export default function RootPage() {
  // Automatically redirect the root URL to /home
  redirect('/home');
}
