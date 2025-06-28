
import { redirect } from 'next/navigation';

export default function CricketPage() {
  // Redirect to football page as cricket is not a primary sport now.
  redirect('/sports/football');
}
