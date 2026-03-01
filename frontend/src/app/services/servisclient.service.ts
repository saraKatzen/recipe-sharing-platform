import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
// שירות לטיפול באימות משתמשים (רישום, התחברות, התנתקות)
// זמין לכל האפליקציה בכל זמן
@Injectable({
  providedIn: 'root'
})
// מחלקת השירות
export class AuthService {
  private apiUrl = 'http://127.0.0.1:5000';
  constructor(private http: HttpClient, private router: Router) { }
//  בדיקה אם המשתמש מחובר
  get IsLoggedIn(): boolean {
    return localStorage.getItem('user') !== null;
  }
// קבלת שם המשתמש מה-localStorage
  get Username(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name || '';
  }
// קבלת תפקיד המשתמש מה-localStorage
  get UserRole(): string {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role || 'Reader';
  }
// בדיקה אם המשתמש הוא מנהל מערכת
  isAdmin(): boolean {
    return this.UserRole === 'Admin';
  }
// רישום משתמש חדש
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }
// התחברות משתמש קיים
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        // שמירה ל-localStorage ברגע ההתחברות כדי ש-IsLoggedIn יתעדכן
        if (res && res.user) {
          localStorage.setItem('user', JSON.stringify(res.user));
        }
      })
    );
  }
// התנתקות משתמש
  logout() {
    localStorage.removeItem('user');
    this.router.navigate(['/home']);
  }
}