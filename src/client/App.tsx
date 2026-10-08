import { useRoute } from './lib/router';
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
    default:
      return <Home />;
  }
}
