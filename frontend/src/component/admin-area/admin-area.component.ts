import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../app/services/recipe.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-admin-area',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-area.component.html',
  styleUrl: './admin-area.component.css'
})
export class AdminAreaComponent implements OnInit {
  // בתוך המחלקה AdminPanelComponent
  pendingUsers: any[] = [];
  allUsers: any[] = [];
  viewMode: 'pending' | 'all' = 'pending'; // מצב תצוגה ברירת מחדל
  user: any;
  constructor(private recipeService: RecipeService) { }


  ngOnInit() {
    this.recipeService.getPendingUsers().subscribe(users => {
      this.loadPendingUsers();
      this.loadAllUsers();
      this.pendingUsers = users;
      console.log("Pending users received:", users); 
    });
  }
  // שליפת כל המשתמשים מהשרת
  loadAllUsers() {
    this.recipeService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users;
      },
      error: (err) => console.error('שגיאה בטעינת כל המשתמשים', err)
    });
  }
  // שליפת הרשימה מהשרת
  loadPendingUsers() {
    this.recipeService.getPendingContributors().subscribe({
      next: (data) => {
        this.pendingUsers = data;
      },
      error: (err) => console.error('שגיאה בטעינת משתמשים:', err)
    });
  }
  // אישור משתמש
  approveUser(userId: number) {
    this.recipeService.approveContributor(userId).subscribe({
      next: (res) => {
        Swal.fire({
          title: 'בוצע!',
          text: 'המשתמש אושר כיוצר תוכן בהצלחה',
          icon: 'success',
          confirmButtonColor: '#27ae60',
          timer: 2000 // ההודעה תיסגר לבד אחרי 2 שניות
        });

        // עדכון הרשימות מקומית
        this.pendingUsers = this.pendingUsers.filter(u => u.id !== userId);
        this.loadAllUsers(); // רענון הרשימה הכללית כדי לראות את שינוי הסטטוס
      },
      error: (err) => {
        console.error('שגיאה באישור משתמש:', err);
        Swal.fire('שגיאה', 'לא הצלחנו לאשר את המשתמש', 'error');
      }
    });
  }
  // מחיקת משתמש עם אישור כפול
  deleteUser(userId: number) {
    Swal.fire({
      title: 'האם אתה בטוח?',
      text: "לא תוכל לשחזר את נתוני המשתמש לאחר המחיקה!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'כן, מחק אותו!',
      cancelButtonText: 'ביטול'
    }).then((result) => {
      if (result.isConfirmed) {
        this.recipeService.deleteUser(userId).subscribe({
          next: () => {
            this.allUsers = this.allUsers.filter(u => u.id !== userId);
            this.pendingUsers = this.pendingUsers.filter(u => u.id !== userId);

            Swal.fire({
              title: 'נמחק!',
              text: 'המשתמש הוסר מהמערכת.',
              icon: 'success',
              confirmButtonColor: '#27ae60'
            });
          },
          error: (err) => {
            console.error(err);
            Swal.fire({
              title: 'פעולה נכשלה',
              text: 'אירעה שגיאה (ייתכן שניסית למחוק מנהל מערכת)',
              icon: 'error'
            });
          }
        });
      }
    });
  }
  // בסיס ה-URL לתמונות
  private baseUrl = 'http://127.0.0.1:5000/static/uploads/';

  // בודקת אם הנתיב מלא או חלקי ומתקנת אותו
  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return this.baseUrl + path;
  }
  // פונקציות עזר לחישוב הסטטיסטיקה
  // ספירת כלל המשתמשים
  getTotalUsers() {
    return this.allUsers.length;
  }
  // ספירת משתמשים לפי תפקיד
  getUploaderCount() {
    return this.allUsers.filter(u => u.role === 'Uploader').length;
  }
  // ספירת מנהלים
  getAdminCount() {
    return this.allUsers.filter(u => u.role === 'Admin').length;
  }
} 