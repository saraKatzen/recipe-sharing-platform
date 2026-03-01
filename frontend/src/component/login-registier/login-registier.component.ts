import { Component } from '@angular/core';
import { AuthService } from '../../app/services/servisclient.service'; 
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common'; 
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login-register',
  standalone: true, 
  imports: [
    FormsModule,   
    CommonModule   
  ],
  templateUrl: './login-registier.component.html',
  styleUrls: ['./login-registier.component.css']
})
export class LoginRegisterComponent {
  // משתנים שקשורים ל-HTML באמצעות [(ngModel)]
  username = '';
  password = '';
  email = '';

  // ניהול מצב התצוגה (כניסה או הרשמה)
  isLoginMode = true;
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) { }

  // פונקציה להחלפה בין מצב כניסה להרשמה (מופעלת בלחיצה על הקישור למטה)
  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = ''; // איפוס שגיאות במעבר
  }

  // הפונקציה המרכזית שמופעלת ב-ngSubmit
  onSubmit() {
    this.errorMessage = '';

    if (this.isLoginMode) {
      // לוגיקת התחברות
      const loginData = { email: this.email || this.username, password: this.password };

      this.authService.login(loginData).subscribe({
       next: (res) => {
        // שמירת פרטי המשתמש
        localStorage.setItem('user', JSON.stringify(res.user));

        // הצגת הודעת הצלחה קצרה וניווט
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true
        });

        Toast.fire({
          icon: 'success',
          title: `שלום ${res.user.name || ''}, התחברת בהצלחה!`
        }).then(() => {
          this.router.navigate(['/home']).then(nav => {
            if (!nav) console.error('ניווט לדף הבית נכשל. בדוק את ה-Routes.');
          });
        });
      },
      error: (err) => {
        this.errorMessage = 'אימייל או סיסמה שגויים';
        Swal.fire({
          title: 'שגיאת התחברות',
          text: 'פרטי הגישה שהזנת אינם תואמים את המערכת שלנו.',
          icon: 'error',
          confirmButtonColor: '#e67e22',
          confirmButtonText: 'נסה שוב'
        });
      }
    });

    } else {
      // לוגיקת הרשמה
    const registerData = {
      name: this.username,
      email: this.email,
      password: this.password
    };

    this.authService.register(registerData).subscribe({
      next: (res) => {
        Swal.fire({
          title: 'ברוכים הבאים!',
          text: 'ההרשמה הסתיימה בהצלחה. כעת תוכל להיכנס לחשבונך.',
          icon: 'success',
          confirmButtonColor: '#f39c12',
          confirmButtonText: 'מעבר להתחברות'
        }).then(() => {
          this.isLoginMode = true; // העברה אוטומטית למסך כניסה
        });
      },
      error: (err) => {
        console.error("שגיאה ברישום:", err);
        const msg = err.error?.message || 'ייתכן והמשתמש כבר קיים במערכת';
        Swal.fire({
          title: 'ההרשמה נכשלה',
          text: msg,
          icon: 'warning',
          confirmButtonColor: '#f39c12'
        });
      }
    });
  }
}
}