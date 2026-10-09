import { useRoute } from './lib/router';
import { AdminPage } from './screens/Admin';
import { RecapPage } from './screens/Recap';
import { RoomPage, TvPage } from './screens/Room';
import { CreateRoom, Home } from './screens/Start';

export function App() {
  const route = useRoute();
  switch (route.name) {
    case 'create':
      return <CreateRoom />;
    case 'room':
      return <RoomPage key={route.code} code={route.code} />;
    case 'tv':
      return <TvPage key={route.code} code={route.code} />;
    case 'recap':
      return <RecapPage key={route.id} id={route.id} />;
    case 'admin':
      return <AdminPage />;
    default:
      return <Home />;
  }
}
