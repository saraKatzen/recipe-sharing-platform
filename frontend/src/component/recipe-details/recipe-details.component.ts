import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core'; import { ActivatedRoute } from '@angular/router';
import { RecipeService } from '../../app/services/recipe.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-recipe-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './recipe-details.component.html',
  styleUrls: ['./recipe-details.component.css']
})
export class RecipeDetailsComponent implements OnInit {

  recipe: any;
  showTimer = false;
  timeLeft: number = 0;
  timerInterval: any;
  timerRunning = false;
  isFocusMode = false;
  relatedRecipes: any[] = [];
  userRole: string = '';
  selectedImage: string = '';
  isFavorite = false;
  currentUser: any;
  isLoading = false;
  allRelatedRecipes: any[] = [];
  recipesToShow: number = 3;
  isLoadingMore = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService
  ) { }

  liked = false;
  likesCount = 0;

  ngOnInit() {
    this.route.params.subscribe(params => {
      const recipeId = params['id'];

      this.isLoading = true; // מתחילים טעינה
      this.recipe = null;
      this.selectedImage = '';
      this.relatedRecipes = [];
      this.allRelatedRecipes = [];
      this.recipesToShow = 3; // מאפסים את מספר המתכונים להצגה

      // קריאה לפונקציה הראשית
      this.loadRecipeData(recipeId);
    });
  }
  // 1. משתנה שמחזיק את האלמנט של הנקודות מה-HTML
  @ViewChild('loader') loader!: ElementRef;

  // 2. פונקציה מיוחדת שרצה אחרי שהדף גמר להצטייר (כדי שנוכל למצוא את הנקודות)
  ngAfterViewInit() {
    this.setupObserver();
  }

  // 3. הגדרת ה"עין" שמסתכלת מתי מגיעים למטה
  setupObserver() {
    const observer = new IntersectionObserver((entries) => {
      // אם הנקודות נכנסו למסך (isIntersecting) ואנחנו לא באמצע טעינה
      if (entries[0].isIntersecting && !this.isLoadingMore) {
        this.loadMoreRelated();
      }
    }, { threshold: 0.5 }); // טען כשרואים 50% מהנקודות

    // להתחיל להסתכל על הדיב של הנקודות (רק אם הוא קיים)
    // אנחנו משתמשים ב-Changes כדי לעקוב אם האלמנט מופיע/נעלם
    const checkExist = setInterval(() => {
      if (this.loader) {
        observer.observe(this.loader.nativeElement);
        clearInterval(checkExist);
      }
    }, 500);
  }
  // הפונקציה הראשית לטעינת המתכון 
  loadRecipeData(recipeId: any) {
    const rawUserData = localStorage.getItem('user');
    if (rawUserData && rawUserData !== '[object Object]') {
      try {
        this.currentUser = JSON.parse(rawUserData);
        this.userRole = this.currentUser.role;
      } catch (e) {
        console.error("שגיאה בפענוח נתוני משתמש", e);
      }
    }

    this.recipeService.getRecipeById(recipeId).subscribe({
      next: (data) => {
        this.isLoading = false; // סיימנו טעינה!
        this.recipe = data;
        this.likesCount = data.likes || 0;

        if (data.images && data.images.length > 0) {
          this.selectedImage = data.images[0];
        }

        const likedRecipes = JSON.parse(localStorage.getItem('likedRecipes') || '{}');
        this.liked = !!likedRecipes[recipeId];

        if (this.currentUser?.id) {
          this.recipeService.getFavorites(this.currentUser.id).subscribe({
            next: (favs) => {
              this.isFavorite = favs.some((f: any) => f.id === this.recipe.id);
            }
          });
        }

        // טעינת מתכונים קשורים
        this.recipeService.getRecipes().subscribe(all => {
          this.loadRelatedRecipes(all);
        });
      },
      error: (err) => {
        this.isLoading = false;
        console.error("שגיאה בקבלת המתכון:", err);
      }
    });
  }

  // פונקציה לסינון מתכונים קשורים
  loadRelatedRecipes(allRecipes: any[]) {
    if (!this.recipe || !this.recipe.category) {
      this.relatedRecipes = [];
      return;
    }

    const currentCategory = this.recipe.category.trim();

    this.allRelatedRecipes = allRecipes.filter(r =>
      r.category &&
      r.category.trim() === currentCategory &&
      r.id !== this.recipe.id
    );

    this.updateRelatedDisplay();
  }

  // פונקציה לעדכון התצוגה של מתכונים קשורים
  updateRelatedDisplay() {
    this.relatedRecipes = this.allRelatedRecipes.slice(0, this.recipesToShow);
  }

  // פונקציה לטעינת עוד מתכונים
  loadMoreRelated() {
    this.isLoadingMore = true; // מתחילים אנימציה

    // עושים "כאילו" חושבים למשך 800 מילי-שניות (כמעט שניה)
    setTimeout(() => {
      this.recipesToShow += 3;
      this.updateRelatedDisplay();
      this.isLoadingMore = false; // מסיימים אנימציה
    }, 800);
  }

  onToggleLike(recipeId: number) {
    const likedRecipes = JSON.parse(localStorage.getItem('likedRecipes') || '{}');
    const isCurrentlyLiked = likedRecipes[recipeId];
    if (isCurrentlyLiked) {
      this.liked = false;
      this.likesCount = Math.max(0, this.likesCount - 1);
      likedRecipes[recipeId] = false;
      this.recipeService.unlikeRecipe(recipeId).subscribe({
        next: (res: any) => this.likesCount = res.likes,
        error: () => {
          this.liked = true;
          this.likesCount++;
        }
      });
    } else {
      this.liked = true;
      this.likesCount++;
      likedRecipes[recipeId] = true;
      this.recipeService.updateLike(recipeId, true).subscribe({
        next: (res: any) => this.likesCount = res.likes,
        error: () => {
          this.liked = false;
          this.likesCount--;
        }
      });
    }
    localStorage.setItem('likedRecipes', JSON.stringify(likedRecipes));
  }

  onDislike(recipeId: number) {
    this.recipeService.updateDislike(recipeId).subscribe(res => {
      this.recipe.dislikes = res.dislikes;
    });
  }

  onRate(recipeId: number, stars: number) {
    this.recipeService.submitRating(recipeId, stars).subscribe({
      next: (res) => {
        this.recipe.rating = res.rating;
        this.recipe.num_ratings = res.num_ratings;
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'תודה על הדירוג!' });
      },
      error: () => Swal.fire('אופס', 'הדירוג לא נשמר, נסה שוב', 'error')
    });
  }

  onToggleFavorite(recipeId: number) {
    if (!this.currentUser?.id) {
      Swal.fire({
        title: 'עוד רגע...',
        text: 'יש להתחבר למערכת כדי לשמור מתכונים במועדפים',
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'מעבר להתחברות',
        cancelButtonText: 'ביטול',
        confirmButtonColor: '#f39c12'
      }).then((result) => {
        if (result.isConfirmed) this.router.navigate(['/login']);
      });
      return;
    }

    this.recipeService.toggleFavorite(this.currentUser.id, recipeId).subscribe({
      next: (res) => {
        this.isFavorite = !this.isFavorite;
        const Toast = Swal.mixin({
          toast: true,
          position: 'bottom-start',
          showConfirmButton: false,
          timer: 2000
        });
        Toast.fire({
          icon: 'success',
          title: this.isFavorite ? 'התווסף למועדפים' : 'הוסר מהמועדפים'
        });
      }
    });
  }

  onDelete() {
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    Swal.fire({
      title: 'למחוק את המתכון?',
      text: "לא תוכל לשחזר את המתכון לאחר המחיקה!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e74c3c',
      cancelButtonColor: '#95a5a6',
      confirmButtonText: 'כן, מחק אותו',
      cancelButtonText: 'ביטול'
    }).then((result) => {
      if (result.isConfirmed) {
        this.recipeService.deleteRecipe(this.recipe.id, userId).subscribe({
          next: () => {
            Swal.fire('נמחק!', 'המתכון הוסר מהמערכת.', 'success').then(() => {
              this.router.navigate(['/recipes']);
            });
          },
          error: () => Swal.fire('שגיאה', 'מחיקת המתכון נכשלה', 'error')
        });
      }
    });
  }

  goToGallery() {
    window.location.href = '/recipes';
  }

  nextImage() {
    const next = (this.currentImageIndex + 1) % this.recipe.images.length;
    this.changeImage(next);
  }

  currentImageIndex = 0;

  prevImage() {
    const prev = (this.currentImageIndex - 1 + this.recipe.images.length) % this.recipe.images.length;
    this.changeImage(prev);
  }

  isFading = false;

  changeImage(index: number) {
    this.isFading = false;
    setTimeout(() => {
      this.currentImageIndex = index;
      this.selectedImage = this.recipe.images[index];
      this.isFading = true;
    }, 150);
  }

  async downloadImage() {
    if (!this.selectedImage) return;
    try {
      const response = await fetch(this.selectedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `מתכון-${this.recipe?.title || 'image'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      window.open(this.selectedImage, '_blank');
    }
  }

  toggleTimer() {
    this.showTimer = !this.showTimer;
    if (this.showTimer && this.timeLeft === 0) {
      this.timeLeft = this.recipe.prep_time * 60;
    }
  }

  startTimer() {
    if (this.timerRunning) return;
    this.timerRunning = true;
    this.timerInterval = setInterval(() => {
      if (this.timeLeft > 0) {
        this.timeLeft--;
      } else {
        this.pauseTimer();
        Swal.fire({
          title: 'הזמן נגמר!',
          text: `המתכון "${this.recipe.title}" מוכן?`,
          icon: 'info',
          confirmButtonText: 'מעולה!',
          confirmButtonColor: '#f39c12'
        });
      }
    }, 1000);
  }

  pauseTimer() {
    clearInterval(this.timerInterval);
    this.timerRunning = false;
  }

  resetTimer() {
    this.pauseTimer();
    this.timeLeft = this.recipe.prep_time * 60;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  toggleFocusMode() {
    this.isFocusMode = !this.isFocusMode;
    if (this.isFocusMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToRecipe(id: string | number) {
    this.router.navigate(['/recipe', id]).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}