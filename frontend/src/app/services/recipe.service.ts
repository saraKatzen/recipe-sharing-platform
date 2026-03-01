import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RecipeListComponent } from '../../component/recipes/recipes.component'; // ה-Interface שיצרנו קודם
import { Observable } from 'rxjs';
// שירות לטיפול במתכונים
// זמין לכל האפליקציה בכל זמן
@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private apiUrl = 'http://127.0.0.1:5000';
// בנאי השירות
  constructor(private http: HttpClient) { }
  // פונקציה להוספת מתכון חדש
  addRecipe(formData: FormData) {
    return this.http.post(`${this.apiUrl}/add-recipe`, formData);
  }
  // פונקציה לקבלת כל המתכונים
  getRecipes() {
    return this.http.get<RecipeListComponent[]>(`${this.apiUrl}/recipes`);
  }
  // פונקציה חדשה לחיפוש מתכונים לפי מרכיבים
  searchByIngredients(searchData: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/search-by-ingredients`, searchData);
  }
  // פונקציה לקבלת כל המרכיבים הזמינים
  getAllIngredients() {
    return this.http.get<string[]>(`${this.apiUrl}/all-ingredients`);
  }
  // פונקציה לקבלת מתכון לפי מזהה
  getRecipeById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/recipe/${id}`);
  }
  // 1. בקשת משתמש להפוך ליוצר תוכן
  requestContributorStatus(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/request-contributor/${userId}`, {});
  }

  // 2. אישור מנהל למשתמש (עבור דף המנהל)
  approveContributor(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/toggle-user-status/${userId}`, {});
  }

  // 3. שליפת כל המשתמשים שממתינים לאישור (כדי שהמנהל יראה רשימה)
  getPendingContributors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/pending-users`); 
  }
  // שליפת סטטוס עדכני של משתמש לפי ID
  getUserStatus(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/user-status/${userId}`);
  }
  // לייק
  updateLike(id: number, liked: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/recipe/${id}/like`, {});
  }

  // דיסלייק
  updateDislike(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/recipe/${id}/dislike`, {});
  }

  // דירוג
  submitRating(id: number, rating: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/recipe/${id}/rate`, { rating });
  }
  getPendingUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/pending-users`);
  }
  // פונקציה למחיקת מתכון
  deleteRecipe(recipeId: number, userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete-recipe/${recipeId}?user_id=${userId}`);
  }
  // פונקציה לביטול לייק (הורדה של הלייק)
  unlikeRecipe(recipeId: number) {
    return this.http.post<{ likes: number }>(`${this.apiUrl}/recipe/${recipeId}/unlike`, {});
  }
  // פונקציה לשליפת המתכונים שהמשתמש העלה
  getRecipesByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/recipes/user/${userId}`);
  }
  // הוספה/הסרה מהמועדפים
  toggleFavorite(userId: number, recipeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/favorites/${recipeId}`, {});
  }
  // שליפת רשימת המועדפים של משתמש)
  getFavorites(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/${userId}/favorites`);
  }
  // עדכון מתכון קיים
  updateRecipe(id: number, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/recipes/${id}`, formData);
  }
  // העלאת תמונת פרופיל
  uploadProfileImage(userId: number, imageFile: File) {
  const formData = new FormData();
  // מוסיפים את קובץ התמונה ל-FormData
  formData.append('image', imageFile);
  return this.http.post(`${this.apiUrl}/upload_profile_image/${userId}`, formData);
}
// עדכון שם משתמש
updateUserName(userId: number, newName: string) {
  return this.http.put(`${this.apiUrl}/users/${userId}/update-name`, { name: newName });
}
// שליפת כל המשתמשים
getAllUsers(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/admin/users`);
}
// מחיקת משתמש
deleteUser(userId: number): Observable<any> {
  return this.http.delete(`${this.apiUrl}/admin/delete-user/${userId}`);
}
 }