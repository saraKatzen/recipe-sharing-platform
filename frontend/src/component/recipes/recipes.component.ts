import { FormsModule } from '@angular/forms';
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from '../../app/services/recipe.service';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './recipes.component.html',
  styleUrls: ['./recipes.component.css']
})
export class RecipeListComponent implements OnInit, AfterViewInit {

  allRecipes: any[] = [];      // כל המתכונים מהשרת
  filteredRecipes: any[] = []; // כל המתכונים אחרי סינון (חיפוש/קטגוריה)
  displayedRecipes: any[] = []; // רק המתכונים שרואים כרגע על המסך (לגלילה)

  selectedType: string = 'הכל';
  sortBy: string = 'none';
  searchTerm: string = '';
  selectedCategory: string = '';

  // משתנים לטעינה
  isLoading = true;          // טעינה ראשונית מהשרת
  isLoadingMore = false;     // טעינה של "עוד מתכונים" בגלילה
  recipesToShow = 9;         // כמה להראות בהתחלה (מתחילים ב-9)

  @ViewChild('loader') loader!: ElementRef; // ה"עין" על הנקודות למטה

  constructor(private recipeService: RecipeService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.isLoading = true; // מתחילים טעינה

    this.recipeService.getRecipes().subscribe({
      next: (data) => {
        // כאן אנחנו מדמים המתנה קטנה כדי שיראו את העיגול היפה (אופציונלי)
        setTimeout(() => {
          this.allRecipes = data;
          this.filteredRecipes = data;

          this.route.queryParams.subscribe(params => {
            if (params['search']) this.searchTerm = params['search'];
            if (params['category']) this.selectedCategory = params['category'];

            this.applyFilters(); // סינון ראשוני
            this.isLoading = false; // סיימנו לטעון!
          });
        }, 600); // דיליי של 0.6 שניות ליופי
      },
      error: (err) => {
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  // מפעילים את ה"עין" שתסתכל למטה
  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.isLoading && !this.isLoadingMore) {
        // אם הגענו למטה ויש עוד מתכונים להראות
        if (this.displayedRecipes.length < this.filteredRecipes.length) {
          this.loadMore();
        }
      }
    }, { threshold: 0.1 });

    // בדיקה שהאלמנט קיים לפני שמצמידים לו צופה
    const checkExist = setInterval(() => {
      if (this.loader) {
        observer.observe(this.loader.nativeElement);
        clearInterval(checkExist);
      }
    }, 500);
  }

  // פונקציה שטוענת עוד מתכונים בגלילה
  loadMore() {
    this.isLoadingMore = true;
    // השהייה מלאכותית כדי שיראו את הנקודות הקופצות
    setTimeout(() => {
      this.recipesToShow += 6; // מוסיפים עוד 6 מתכונים
      this.updateDisplayedRecipes();
      this.isLoadingMore = false;
    }, 800);
  }

  onSearchChange() {
    if (this.searchTerm.length > 0) {
      this.selectedCategory = '';
    }
    this.applyFilters();
  }

  applyFilters() {
    let temp = [...this.allRecipes];

    if (this.selectedType !== 'הכל') {
      temp = temp.filter(r => r.type?.trim() === this.selectedType.trim());
    }

    if (this.selectedCategory && !this.searchTerm) {
      temp = temp.filter(r => r.category?.trim() === this.selectedCategory.trim());
    }

    if (this.searchTerm) {
      const s = this.searchTerm.toLowerCase().trim();
      temp = temp.filter(r => {
        const title = r.title.toLowerCase();
        const cat = (r.category || '').toLowerCase();
        return title.includes(s) || s.includes(title) || cat.includes(s);
      });
    }

    if (this.sortBy === 'time') {
      temp.sort((a, b) => (a.prep_time || 0) - (b.prep_time || 0));
    } else if (this.sortBy === 'rating') {
      temp.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    this.filteredRecipes = temp;

    // בכל פעם שמסננים מחדש - מאפסים את הגלילה להתחלה
    this.recipesToShow = 9;
    this.updateDisplayedRecipes();
  }

  // פונקציה שגוזרת רק את הכמות שצריך להציג כרגע
  updateDisplayedRecipes() {
    this.displayedRecipes = this.filteredRecipes.slice(0, this.recipesToShow);
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedType = 'הכל';
    this.applyFilters();
  }
}