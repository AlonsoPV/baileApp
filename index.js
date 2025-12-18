// index.js
import { registerRootComponent } from "expo";
import { installGlobalErrorHandler } from "./src/lib/errorHandler";
import App from "./App";

// ✅ Install global error handler BEFORE registering the app
// This prevents SIGABRT crashes from unhandled JavaScript exceptions
installGlobalErrorHandler();

registerRootComponent(App);
