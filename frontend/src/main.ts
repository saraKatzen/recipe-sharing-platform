
// יבוא הפונקציה bootstrapApplication
import { bootstrapApplication } from '@angular/platform-browser';
// יבוא רכיב האפליקציה הראשי
import { AppComponent } from './app/app.component';
// יבוא תצורת האפליקציה
import { appConfig } from './app/app.config'; 

// אתחול האפליקציה עם הרכיב הראשי והתצורה
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));