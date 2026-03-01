import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecipeService } from "../../app/services/recipe.service";
import { RouterLink } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2'; // ייבוא הספרייה
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, CommonModule,],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  constructor(private router: Router) { }
  activeFaq: number | null = null;
  currentIngredient: string = '';
  selectedIngredients: string[] = [];
  faqs = [
    { q: 'איך עובד החיפוש לפי מקרר?', a: 'פשוט מכניסים את הרכיבים שיש לכם בבית בתיבת החיפוש, והאלגוריתם החכם שלנו יסנן עבורכם מתכונים שכוללים בדיוק את מה שיש לכם במזווה.' },
    { q: 'האם האתר בחינם?', a: 'בהחלט! כל המתכונים, הטיפים והכלים באתר פתוחים לקהל הרחב ללא עלות. המטרה שלנו היא להפיץ אהבה לאוכל טוב.' },
    { q: 'איך מעלים מתכון חדש?', a: 'לאחר הרשמה קצרה לאתר, תוכלו ללחוץ על כפתור "הוספת מתכון" בפרופיל האישי שלכם ולשתף את היצירות שלכם עם כל הקהילה.' },
    { q: 'האם המתכונים באתר כשרים?', a: 'כן, כל המתכונים המפורסמים באתר עוברים בדיקה כדי לוודא שהם מותאמים למטבח הכשר.' },
    { q: 'שכחתי סיסמה, מה עושים?', a: 'ניתן ללחוץ על "שכחתי סיסמה" בדף ההתחברות, ונשלח לכם קישור לאיפוס מיידי לכתובת המייל שנרשמתם איתה.' }
  ];
  // פונקציה לפתיחת וסגירת שאלות נפוצות
  toggleFaq(index: number) {
    this.activeFaq = this.activeFaq === index ? null : index;
  }
  // פונקציה לטיפול באירוע חיפוש מההירו
  onHeroSearch(event: any) {
    const searchTerm = event.target.value;
    if (searchTerm.length > 2) {
      // מעבר לדף המתכונים ושליחת מילת החיפוש בכתובת
      this.router.navigate(['/recipes'], { queryParams: { search: searchTerm } });
    }
  }
  // פונקציה ללחיצה על עיגול קטגוריה
  onCategoryClick(cat: string) {
    this.router.navigate(['/recipes'], { queryParams: { category: cat } });
  }

  // פונקציה להוספת רכיב לרשימה
  addIngredient() {
    if (this.currentIngredient.trim()) {
      this.selectedIngredients.push(this.currentIngredient.trim());
      this.currentIngredient = ''; // מנקה את השורה אחרי ההוספה
      console.log("הרכיבים שיש לי עכשיו:", this.selectedIngredients);
    }
  }
  // פונקציה להסרת רכיב (כשלוחצים על ה-X)
  removeIngredient(index: number) {
    this.selectedIngredients.splice(index, 1);
  }
  // פונקציה למעבר לדף החיפוש המורכב
  goToFridgeSearch() {
    this.router.navigate(['/search'], {
      state: { ingredients: this.selectedIngredients }
    });
  }

  counts: { [key: string]: number } = {
    recipes: 0,
    visitors: 0,
    chefs: 0,
    experience: 0
  };

  private hasAnimated = false;

  animateCounters() {
    const duration = 2000;
    this.counterEffect('recipes', 500, duration);
    this.counterEffect('visitors', 150, duration);
    this.counterEffect('chefs', 45, duration);
    this.counterEffect('experience', 10, duration);
  }
  ngOnInit() {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.hasAnimated) {
        this.animateCounters();
        this.hasAnimated = true;
      }
    }, { threshold: 0.5 }); // יתחיל כחצי מהמדור גלוי

    const target = document.querySelector('#stats-trigger');
    if (target) observer.observe(target);
  }
  counterEffect(key: string, target: number, duration: number) {
    let start = 0;
    const steps = duration / 16;
    const stepValue = target / steps;

    const timer = setInterval(() => {
      start += stepValue;

      if (start >= target) {
        this.counts[key] = target;
        clearInterval(timer);
      } else {
        this.counts[key] = Math.floor(start);
      }
    }, 16);
  }
}