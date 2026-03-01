import { Routes } from '@angular/router';
import { HomeComponent } from '../component/home/home.component';
import { RecipeListComponent } from '../component/recipes/recipes.component';
import { LoginRegisterComponent } from '../component/login-registier/login-registier.component'; 
import { PersonalAreaComponent } from '../component/personal-area/personal-area.component'; 
import { AdminAreaComponent } from '../component/admin-area/admin-area.component'; 
import { AddRecipeComponent } from '../component/add-recipe/add-recipe.component';
import { IngredientSearchComponent } from '../component/ingredient-search/ingredient-search.component';
import { RecipeDetailsComponent } from '../component/recipe-details/recipe-details.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'recipes', component: RecipeListComponent },
    { path: 'auth', component: LoginRegisterComponent }, 
    { path: 'profile', component: PersonalAreaComponent }, 
    { path: 'admin', component: AdminAreaComponent }, 
    { path: 'add-recipe', component: AddRecipeComponent },
    { path: 'search', component: IngredientSearchComponent },
    { path: 'recipe/:id', component: RecipeDetailsComponent },
    { path: 'edit-recipe/:id', component: AddRecipeComponent } 
];

