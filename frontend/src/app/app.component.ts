import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// ייבוא ה-Service
import { AuthService } from './services/servisclient.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,//ניווט בין הרכיבים
    RouterLink,//קישורים לניווט
    RouterLinkActive,//הוספת מחלקות CSS לקישורים פעילים
    CommonModule,//נחוץ לרכיבים סטנדרטיים של אנגולר
    HttpClientModule,//נחוץ לביצוע קריאות HTTP מהלקוח לשרת
    FormsModule//נחוץ לטפסים ולקשירת נתונים
  ],
  templateUrl: './app.component.html',//נתיב לתבנית ה-HTML 
  styleUrls: ['./app.component.css']//נתיב לקובץ ה-CSS 
})
export class AppComponent {
  // בניית ה-Constructor עם ה-AuthService
  constructor(public authService: AuthService, private router: Router) { }
  // פונקציה לגלילה חלקה למקטע ספציפי בעמוד הבית
  scrollToSection(sectionId: string) {
    this.router.navigate(['/']).then(() => {
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    });
  }
  // פונקציה להתנתקות
  logout() {
    this.authService.logout();
  }
}