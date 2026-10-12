import { useLang } from './lib/i18n';
import { useRoute } from './lib/router';
import { AdminPage } from './screens/Admin';
import { JesusPage } from './screens/Jesus';
import { DatenschutzPage, ImpressumPage } from './screens/Legal';
import { RecapPage } from './screens/Recap';
import { RoomPage, TvPage } from './screens/Room';
import { CreateRoom, Home } from './screens/Start';

export function App() {
  const route = useRoute();
  // Neu zeichnen, wenn die Sprache wechselt – alle Texte holen sich die aktuelle Sprache über t()
  useLang();
  switch (route.name) {
    case 'create':
      return <CreateRoom key={route.bot ? 'bot' : 'room'} bot={route.bot} />;
    case 'room':
      return <RoomPage key={route.code} code={route.code} />;
    case 'tv':
      return <TvPage key={route.code} code={route.code} />;
    case 'recap':
      return <RecapPage key={route.id} id={route.id} />;
    case 'admin':
      return <AdminPage />;
    case 'impressum':
      return <ImpressumPage />;
    case 'datenschutz':
      return <DatenschutzPage />;
    case 'jesus':
      return <JesusPage />;
    default:
      return <Home />;
  }
}
