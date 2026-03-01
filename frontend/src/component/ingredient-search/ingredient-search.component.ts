import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../../app/services/recipe.service';
import { RouterLink } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ingredient-search',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ingredient-search.component.html',
  styleUrls: ['./ingredient-search.component.css']
})
export class IngredientSearchComponent implements OnInit {
  // משתני קלט
  ingredientInput: string = '';
  myIngredients: string[] = [];
  mustHaveIngredients: string[] = []; // רכיבי חובה

  // משתני עזר להשלמה אוטומטית
  allAvailableIngredients: string[] = [];
  filteredSuggestions: string[] = [];

  // משתני תוצאות
  searchResults: any[] = [];
  isLoading: boolean = false;

  constructor(private recipeService: RecipeService,private router: Router) { }

  ngOnInit() {
    // קבלת המידע שנשלח בדחיפה (state) מדף הבית
  const state = window.history.state;

  if (state && state.ingredients && Array.isArray(state.ingredients)) {
    // השמת הרכיבים שהגיעו במערך הקיים 
    this.myIngredients = state.ingredients;
    
    // הפעלת החיפוש באופן אוטומטי כדי שהמשתמש יראה תוצאות מיד
    this.performSearch();
  }
    // טעינת כל הרכיבים הקיימים בבסיס הנתונים לצורך ההשלמה האוטומטית
    this.recipeService.getAllIngredients().subscribe(data => {
      this.allAvailableIngredients = data;
      console.log("data", data);
    });
  }

  // עדכון רשימת ההצעות בזמן שהמשתמש מקליד
  onInputChange() {
    const query = this.ingredientInput.toLowerCase().trim();
    if (query.length > 1) {
      this.filteredSuggestions = this.allAvailableIngredients
        .filter(ing => ing.includes(query) && !this.myIngredients.includes(ing))
        .slice(0, 5);
    } else {
      this.filteredSuggestions = [];
    }
  }

  // הוספת רכיב מההצעות או בלחיצה על כפתור/Enter
  addIngredient(name?: string) {
    const val = (name || this.ingredientInput).toLowerCase().trim();
    if (val && !this.myIngredients.includes(val)) {
      this.myIngredients.push(val);
      this.ingredientInput = '';
      this.filteredSuggestions = [];
    }
  }

  // הפיכת רכיב ל"חובה" (Must-Have)
  toggleMustHave(ing: string) {
    if (this.mustHaveIngredients.includes(ing)) {
      this.mustHaveIngredients = this.mustHaveIngredients.filter(i => i !== ing);
    } else {
      this.mustHaveIngredients.push(ing);
    }
  }
// הסרת רכיב מהרשימה
  removeIngredient(index: number) {
    const ing = this.myIngredients[index];
    this.myIngredients.splice(index, 1);
    // אם הסרנו רכיב, נוודא שהוא הוסר גם מרשימת החובה
    this.mustHaveIngredients = this.mustHaveIngredients.filter(i => i !== ing);
  }
// פונקציית החיפוש המשודרגת עם גלילה לתוצאות
performSearch() {
  this.isLoading = true;
  const searchData = {
    ingredients: this.myIngredients,
    must_have: this.mustHaveIngredients
  };

  this.recipeService.searchByIngredients(searchData).subscribe({
    next: (data) => {
      this.searchResults = data;
      this.isLoading = false;

      // אם יש תוצאות, נחכה רגע שה-DOM יתעדכן ואז נגלול
      if (data.length > 0) {
        setTimeout(() => {
          this.scrollToResults();
        }, 100); // השהייה קלה כדי לוודא שהאלמנט נוצר ב-HTML
      }
    },
    error: (err) => {
      console.error(err);
      this.isLoading = false;
    }
  });
}

// פונקציית העזר לגלילה
scrollToResults() {
  const element = document.getElementById('results-section');
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth', // גלילה חלקה ולא קפיצה
      block: 'start'      // הגעה לראש האלמנט
    });
  }
}
  // פונקציה שקובעת את הצבע לפי אחוז ההתאמה
getScoreColor(score: number): string {
  if (score >= 80) {
    return '#28a745'; // ירוק כהה - התאמה מצוינת
  } else if (score >= 50) {
    return '#ffc107'; // צהוב/כתום - התאמה טובה
  } else {
    return '#dc3545'; // אדום - חסרים הרבה רכיבים
  }
}
}