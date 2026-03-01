import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RecipeService } from '../../app/services/recipe.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
@Component({
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule,CommonModule],
  selector: 'app-add-recipe',
  templateUrl: './add-recipe.component.html',
  styleUrls: ['./add-recipe.component.css']
})
export class AddRecipeComponent implements OnInit {
  // מאפייני הרכיב
  recipeForm: FormGroup;
  isEditMode = false;
  recipeId: number | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private recipeService: RecipeService,
    // בודק אם אנחנו במצב עריכה
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.recipeForm = this.fb.group({
      title: ['', Validators.required],
      type: ['פרווה', Validators.required],
      category: ['', Validators.required],
      instructions: ['', Validators.required],
      prep_time: [0],
      ingredients: this.fb.array([]) // מערך רכיבים ריק
    });
  }

  ngOnInit() {
    // בדיקה: האם הגענו לפה דרך נתיב של עריכה?
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.recipeId = +id;
      this.loadRecipeForEdit(this.recipeId);
    } else {
      this.addIngredient(); // שורה ראשונה ריקה בהוספה חדשה
    }
  }

  get ingredients() {
    return this.recipeForm.get('ingredients') as FormArray;
  }

  addIngredient() {
    this.ingredients.push(this.fb.group({
      product: ['', Validators.required],
      amount: [null],
      unit: ['']
    }));
  }

  removeIngredient(index: number) {
    this.ingredients.removeAt(index);
  }

  loadRecipeForEdit(id: number) {
    this.recipeService.getRecipeById(id).subscribe(recipe => {
      this.recipeForm.patchValue(recipe);
      this.recipeForm.patchValue({ category: recipe.category ? recipe.category.trim() : '' });
      // מילוי הרכיבים מהשרת לתוך ה-FormArray
      const ingredientsArray = this.ingredients;
      ingredientsArray.clear();
      recipe.ingredients.forEach((ing: any) => {
        ingredientsArray.push(this.fb.group({
          product: [ing.product, Validators.required],
          amount: [ing.amount],
          unit: [ing.unit]
        }));
      });
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

onSubmit() {
  console.log("הטופס נשלח!");

  // בדיקת תקינות אחת בלבד
  if (this.recipeForm.invalid) {
    console.log("הטופס לא תקין:", this.recipeForm.value);
    return;
  }

  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  // הגנה קטנה: וודא שיש ID למשתמש לפני השליחה
  if (!userData.id) {
      console.error("לא נמצא מזהה משתמש");
      return; 
  }

  const formData = new FormData();
  
  formData.append('user_id', userData.id);
  formData.append('title', this.recipeForm.value.title);
  formData.append('type', this.recipeForm.value.type);
  formData.append('category', this.recipeForm.value.category);
  formData.append('instructions', this.recipeForm.value.instructions);
  formData.append('prep_time', this.recipeForm.value.prep_time.toString());
  formData.append('ingredients', JSON.stringify(this.recipeForm.value.ingredients));
  // הוספת קובץ תמונה אם נבחר
  if (this.selectedFile) {
      formData.append('image', this.selectedFile);
  }
  // לוגיקה מפוצלת: עריכה או יצירה
  if (this.isEditMode && this.recipeId) {
    // --- מצב עריכה ---
    this.recipeService.updateRecipe(this.recipeId, formData).subscribe({
      next: () => {
        this.showSuccessAlert('המתכון עודכן!', 'השינויים נשמרו בהצלחה');
      },
      error: (err) => {
        console.error('שגיאה בעדכון:', err);
        Swal.fire('שגיאה', 'משהו השתבש בעדכון המתכון', 'error');
      }
    });

  } else {
    // --- מצב יצירה חדשה ---
    this.recipeService.addRecipe(formData).subscribe({
      next: () => {
        this.showSuccessAlert('המתכון פורסם!', 'המתכון החדש נוסף למערכת');
      },
      error: (err) => {
        console.error('שגיאה ביצירה:', err);
        Swal.fire('שגיאה', 'משהו השתבש ביצירת המתכון', 'error');
      }
    });
  }
}
// פונקציית עזר למניעת שכפול קוד של ה-Swal
showSuccessAlert(title: string, text: string) {
    Swal.fire({
      title: title,
      text: text,
      icon: 'success',
      confirmButtonText: 'מעולה',
      confirmButtonColor: '#f7a100',
      allowOutsideClick: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/profile']);
      }
    });
}
}