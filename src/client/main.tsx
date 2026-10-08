import '@fontsource/figtree/400.css';
import '@fontsource/figtree/600.css';
import '@fontsource/figtree/800.css';
import './styles.css';
import { render } from 'preact';
import { App } from './App';
import { initTheme } from './lib/theme';

initTheme();

render(<App />, document.getElementById('app')!);
