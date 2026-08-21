import { redirect } from 'next/navigation';

export default function HistoryRedirect() {
  // Redirect to the actual booking history page
  redirect('/dashboard/booking/history');
  return null; // This component never renders because of the redirect
}
