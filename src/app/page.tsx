
import HomeClientPage from './HomeClientPage';

export default function HomePage() {
  // HomeClientPage now renders components that fetch their own data,
  // so no data needs to be passed from the page level.
  return <HomeClientPage />;
}
