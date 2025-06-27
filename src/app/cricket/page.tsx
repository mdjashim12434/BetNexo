import { redirect } from 'next/navigation';

export default function CricketPage() {
  // Redirect to football page as cricket is removed
  redirect('/sports/football');
}
