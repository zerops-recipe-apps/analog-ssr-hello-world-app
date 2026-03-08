import 'zone.js/node';
import { bootstrapApplication } from '@angular/platform-browser';
import { config } from './app/app.config.server';
import { AppComponent } from './app/app.component';

// Analog's Nitro plugin calls this function to render Angular pages server-side.
// The server config (app.config.server.ts) merges provideServerRendering()
// so Angular knows it is running in a Node.js context.
const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
