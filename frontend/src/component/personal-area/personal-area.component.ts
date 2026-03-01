import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../app/services/recipe.service';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
@Component({
  selector: 'app-personal-area',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './personal-area.component.html',
  styleUrl: './personal-area.component.css'
})
export class PersonalAreaComponent implements OnInit {
  currentUser: any = null;
  userRecipes: any[] = [];
  favoriteRecipes: any[] = [];
  activeTab: string = 'favorites'; 

  isEditingName: boolean = false;
  newName: string = '';

  // כתובת השרת לתמונות
  private baseUrl = 'http://127.0.0.1:5000/static/uploads/';

  constructor(private recipeService: RecipeService, private router: Router) { }

  ngOnInit() {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (savedUser && savedUser.id) {
      this.currentUser = savedUser;
      this.loadUserData();

      // עדכון סטטוס המשתמש מהשרת
      this.recipeService.getUserStatus(savedUser.id).subscribe({
        next: (updatedFields) => {
          // עדכון המשתמש עם כל השדות שהגיעו מהשרת
          this.currentUser = { ...this.currentUser, ...updatedFields };

          // שמירה מעודכנת ב-localStorage כדי שגם ברענון הבא זה יהיה שם
          localStorage.setItem('user', JSON.stringify(this.currentUser));
        },
        error: (err) => console.error("Status update failed", err)
      });
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadUserData() {
    if (!this.currentUser) return;

    // טעינת המתכונים שהמשתמש העלה
    this.recipeService.getRecipesByUser(this.currentUser.id).subscribe({
      next: (res) => this.userRecipes = res,
      error: (err) => console.error("Error loading user recipes", err)
    });

    // טעינת המתכונים המועדפים
    this.recipeService.getFavorites(this.currentUser.id).subscribe({
      next: (res) => this.favoriteRecipes = res,
      error: (err) => console.error("Error loading favorites", err)
    });
  }

  //  בודקת אם הנתיב מלא או חלקי ומתקנת אותו
  getImageUrl(path: string): string {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return this.baseUrl + path;
  }
onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // הודעת "בטעינה" בזמן שהתמונה עולה
      Swal.fire({
        title: 'מעלה תמונה...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      this.recipeService.uploadProfileImage(this.currentUser.id, file).subscribe({
        next: (res: any) => {
          this.currentUser.profile_image = res.profile_image;
          localStorage.setItem('user', JSON.stringify(this.currentUser));
          Swal.close();
          Swal.fire('הצלחה!', 'תמונת הפרופיל עודכנה', 'success');
        },
        error: (err) => {
          Swal.close();
          Swal.fire('שגיאה', 'העלאת התמונה נכשלה', 'error');
        }
      });
    }
  }
  startEditName() {
    this.newName = this.currentUser.name;
    this.isEditingName = true;
  }
  saveName() {
    if (this.newName.trim() && this.newName !== this.currentUser.name) {
      this.recipeService.updateUserName(this.currentUser.id, this.newName).subscribe({
        next: () => {
          this.currentUser.name = this.newName;
          localStorage.setItem('user', JSON.stringify(this.currentUser));
          this.isEditingName = false;
          
          // הודעת הצלחה קטנה (Toast)
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'השם עודכן בהצלחה',
            showConfirmButton: false,
            timer: 2000
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire('אופס', 'שגיאה בעדכון השם, נסה שוב מאוחר יותר', 'error');
        }
      });
    } else {
      this.isEditingName = false;
    }
  }
sendRequest() {
    Swal.fire({
      title: 'שליחת בקשת הרשאה',
      text: 'האם תרצה לשלוח בקשה למנהל להפוך למעלה מתכונים?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'כן, שלח בקשה',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#f39c12'
    }).then((result) => {
      if (result.isConfirmed) {
        this.recipeService.requestContributorStatus(this.currentUser.id).subscribe({
          next: (res) => {
            Swal.fire('בקשתך נשלחה!', 'המנהל יבחן את בקשתך בקרוב.', 'success',);
            this.currentUser.request_pending = true;
            localStorage.setItem('user', JSON.stringify(this.currentUser));
          },
          error: (err) => Swal.fire('שגיאה', 'לא ניתן היה לשלוח את הבקשה', 'error')
        });
      }
    });
  }
  editRecipe(id: number) {
    this.router.navigate(['/edit-recipe', id]);
  }
}