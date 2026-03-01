from flask import Blueprint, request, jsonify, current_app
from db_instance import db
from models.recipe import Recipe
from models.ingredient_entry import IngredientEntry
from models.user import User
from models.favorites import favorites_table
import json, os, shutil
from werkzeug.utils import secure_filename
from PIL import Image, ImageFilter,ImageEnhance

# יצירת Blueprint למתכונים
recipes_bp = Blueprint('recipes_bp', __name__)
# הוספת מתכון חדש עם יצירת גרסאות תמונה
@recipes_bp.route('/add-recipe', methods=['POST'])
def add_recipe():
    # 1. בדיקה מי המשתמש שמבקש להוסיף מתכון
    user_id = request.form.get('user_id')
    user = User.query.get(user_id)
    # 2. אם המשתמש לא קיים או שלא מאושר - חוסמים את הפעולה
    if not user or (user.role != 'Admin' and not user.is_approved_uploader):
        return jsonify({"message": "אין לך הרשאה מתאימה להעלאת מתכונים"}), 403
    try:
# 1. קבלת נתוני המתכון מהטופס
        title = request.form.get('title')
        recipe_type = request.form.get('type')
        instructions = request.form.get('instructions')
        prep_time = request.form.get('prep_time', type=int, default=0)
        user_id = request.form.get('user_id')
# 2. יצירת רשומה חדשה בטבלת המתכונים
        new_recipe = Recipe(
            title=title,# שם המתכון
            type=recipe_type,# סוג המתכון
            user_id=user_id,# מזהה המשתמש שהוסיף את המתכון
            category=request.form.get('category'), # קטגוריית המתכון
            instructions=instructions,# הוראות הכנה
            prep_time=prep_time,# זמן הכנה בדקות
            likes = 0, # אתחול,
            dislikes = 0,  # אתחול,
            num_ratings = 0,  # אתחול,
            rating = 0.0  # אתחול,
        )
# הוספת המתכון למסד הנתונים
        db.session.add(new_recipe)
#קבלת ה-ID שנוצר
        db.session.flush()
# 2. טיפול ברשימת הרכיבים
        ingredients_json = request.form.get('ingredients')
#בדיקה אם התקבלו רכיבים
        if ingredients_json:
            # הפיכת הטקסט חזרה למערך
            ingredients_data = json.loads(ingredients_json)
            # לולאה על כל רכיב במערך
            for ing in ingredients_data:
                # יצירת שורה חדשה בטבלת הרכיבים לכל רכיב ברשימה
                new_ing = IngredientEntry(
                    product=ing.get('product'),# שם המוצר
                    amount=ing.get('amount'),# כמות
                    unit=ing.get('unit'),# יחידת מידה
                    recipe_id=new_recipe.id  # קישור למתכון באמצעות ה-ID
                )
                db.session.add(new_ing)
# 3. יצירת תיקייה לשמירת התמונות של המתכון
        recipe_id_str = str(new_recipe.id)
# נתיב התיקייה במחשב
        recipe_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], recipe_id_str)
# יצירת התיקייה אם לא קיימת
        if not os.path.exists(recipe_folder):
            os.makedirs(recipe_folder)  # יצירת התיקייה במחשב
        # 4. טיפול בתמונה שהמשתמש העלה
        file = request.files.get('image')
        if file:
            # שמירת הקובץ המקורי
            filename = secure_filename(file.filename)
            # נתיב מלא לשמירה במחשב
            save_path = os.path.join(recipe_folder, filename)
            file.save(save_path)
# שמירת הנתיב היחסי במסד הנתונים
            new_recipe.image_path = f"{recipe_id_str}/{filename}"
            # 5. עיבוד עם Pillow בתוך התיקייה החדשה
            with Image.open(save_path) as img:
                # שחור לבן
                bw_name = "bw_" + filename
                img.convert('L').save(os.path.join(recipe_folder, bw_name))
                new_recipe.image_bw = f"{recipe_id_str}/{bw_name}"
                # סיבוב
                rot_name = "rot_" + filename
                img.rotate(90, expand=True).save(os.path.join(recipe_folder, rot_name))
                new_recipe.image_rotated = f"{recipe_id_str}/{rot_name}"
                #טשטוש
                image_blur_name = "blur_" + filename
                img.filter(ImageFilter.GaussianBlur(radius=5)).save(os.path.join(recipe_folder, image_blur_name))
                new_recipe.image_blur = f"{recipe_id_str}/{image_blur_name}"

                # 1. היפוך (נותן זווית צילום הפוכה)
                flip_name = "flip_" + filename
                img.transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(recipe_folder, flip_name))
                new_recipe.image_flip = f"{recipe_id_str}/{flip_name}"

                # 2. שיפור צבעים (מעלה את הרוויה ב-50% כדי שהאוכל ייראה חי)
                enhancer = ImageEnhance.Color(img)
                img_enhanced = enhancer.enhance(1.5)
                color_name = "color_" + filename
                img_enhanced.save(os.path.join(recipe_folder, color_name))
                new_recipe.image_color = f"{recipe_id_str}/{color_name}"
        db.session.commit()  # שמירה סופית של הכל
        return jsonify({"message": "Success"}), 201
# טיפול בשגיאות כלליות
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
# קבלת כל המתכונים
@recipes_bp.route('/recipes', methods=['GET'])
def get_recipes():
    try:
        # שליפת כל המתכונים מהמסד
        all_recipes = Recipe.query.all()
        # נתיב בסיסי לתמונות
        base_url = "http://127.0.0.1:5000/static/uploads/"
        # הכנת הפלט
        output = []
# לולאה על כל המתכונים
        for r in all_recipes:
            # בניית האובייקט לכל מתכון
            output.append({
                'id': r.id,# מזהה המתכון
                'title': r.title,# כותרת המתכון
                'type': r.type.strip() if r.type else "פרווה",  # סוג המתכון עם טיפול ברווחים
                'image_path': base_url + r.image_path if r.image_path else "",# נתיב התמונה המלא
                "likes": getattr(r, 'likes', 0) or 0,
                "dislikes": getattr(r, 'dislikes', 0) or 0,
                "rating": getattr(r, 'rating', 0.0) or 0.0,
                "num_ratings": getattr(r, 'num_ratings', 0) or 0,
                'category': r.category,
                "prep_time": r.prep_time  # זמן הכנה בדקות
            })
        return jsonify(output)
    # טיפול בשגיאות כלליות
    except Exception as e:
        print(f"Error in get_recipes: {e}")
        return jsonify({"error": str(e)}), 500
# חיפוש מתכונים לפי רכיבים
@recipes_bp.route('/search-by-ingredients', methods=['POST'])
def search_by_ingredients():
    # קבלת הנתונים מהבקשה
    data = request.get_json()
    # עיבוד רשימות הרכיבים שהתקבלו
    user_ingredients = [i.lower().strip() for i in data.get('ingredients', [])]
    # עיבוד רשימת רכיבי החובה
    must_have = [i.lower().strip() for i in data.get('must_have', [])]
# שליפת כל המתכונים מהמסד
    all_recipes = Recipe.query.all()
    results = []
# לולאה על כל המתכונים
    for recipe in all_recipes:
        # חילוץ שמות הרכיבים של המתכון
        recipe_ing_names = [ing.product.lower().strip() for ing in recipe.ingredients]
        # אם אין רכיבים במתכון, דלג עליו
        if not recipe_ing_names:
            continue
# בדיקת רכיבי חובה
        missing_must_have = False
        # לולאה על כל רכיב חובה
        for m in must_have:
            # אם רכיב חובה לא נמצא במתכון, דלג על המתכון
            if not any(m in r_ing for r_ing in recipe_ing_names):
                missing_must_have = True
                break
                # אם חסר רכיב חובה, דלג למתכון הבא
        if missing_must_have:
            continue

        # בדיקה כמה רכיבים מהרשימה של המשתמש קיימים במתכון
        matched_ingredients = []
        # לולאה על כל רכיב שהמשתמש סיפק
        for u_ing in user_ingredients:
            # חיפוש התאמות חלקיות בין רכיב המשתמש לרכיבי המתכון
            for r_ing in recipe_ing_names:
                # אם יש התאמה חלקית, הוסף לרשימת ההתאמות
                if u_ing in r_ing or r_ing in u_ing:
                    # הוספת הרכיב התואם לרשימה
                    matched_ingredients.append(r_ing)
                    break
# חישוב הציון כאחוז של הרכיבים התואמים
        matched_set = set(matched_ingredients)
        # חישוב הציון כאחוז של הרכיבים התואמים
        score = (len(matched_set) / len(recipe_ing_names)) * 100
# ניקוי נתיב התמונה
        clean_img = recipe.image_path.replace('static/uploads/', '').replace('uploads/', '') if recipe.image_path else ""
        if score > 0:  # מציג כל מה שיש לו התאמה כלשהי
            results.append({
                'id': recipe.id,# מזהה המתכון
                'title': recipe.title,# כותרת המתכון
                'score': round(score, 1),# ציון ההתאמה
                'have': list(matched_set),# רשימת הרכיבים התואמים
                'missing': list(set(recipe_ing_names) - matched_set),# רשימת הרכיבים החסרים
                'image_path': f"http://127.0.0.1:5000/static/uploads/{clean_img}" if clean_img else None# נתיב התמונה המלא
            })
# מיון התוצאות לפי הציון
    results.sort(key=lambda x: x['score'], reverse=True)
    return jsonify(results)
# קבלת כל הרכיבים הייחודיים
@recipes_bp.route('/all-ingredients', methods=['GET'])
def get_all_unique_ingredients():
    # שליפת כל המוצרים מהטבלה
    all_ings = IngredientEntry.query.with_entities(IngredientEntry.product).all()
    # ניקוי הנתונים: הורדת רווחים, הפיכה לאותיות קטנות (לאנגלית), וסינון אותיות בודדות
    cleaned_ingredients = set()
    # לולאה על כל הרכיבים
    for ing in all_ings:
        # הוספת שם המוצר לאחר ניקוי
        if ing.product:
            name = ing.product.strip()
            if len(name) > 1:  # סינון שמות של אות אחת
                cleaned_ingredients.add(name)# הוספה לסט

    # החזרה כרשימה ממוינת
    return jsonify(sorted(list(cleaned_ingredients)))

# קבלת מתכון לפי ID
@recipes_bp.route('/recipe/<int:id>', methods=['GET'])
def get_recipe(id):
    # שליפת המתכון לפי ה-ID
    recipe = Recipe.query.get_or_404(id)
# נתיב בסיסי לתמונות
    base_static_url = "http://127.0.0.1:5000/static/uploads/"
    # פונקציית עזר לניקוי נתיבים כפולים
    def clean_path(path):
        if not path: return ""
        #אם יש נתיב, מסיר את החלק המיותר
        return path.replace("static/uploads/", "").replace("uploads/", "")
    # 1. הכנת רשימת תמונות
    images = []
    # לולאה על כל שדה תמונה במתכון
    for img_field in [recipe.image_path, recipe.image_bw, recipe.image_rotated, recipe.image_flip, recipe.image_color,
        ]:
        # אם יש תמונה בשדה, מוסיפים אותה לרשימה לאחר ניקוי הנתיב
        if img_field:
            images.append(base_static_url + clean_path(img_field))
# 2. הכנת רשימת רכיבים
    ing_list = []
    # לולאה על כל רכיב במתכון
    for ing in recipe.ingredients:
        # הוספת פרטי הרכיב למערך
        ing_list.append({
            "product": ing.product,# שם המוצר
            "amount": ing.amount,# כמות
            "unit": ing.unit# יחידת מידה
        })
# החזרת כל פרטי המתכון בפורמט JSON
    return jsonify({
        "id": recipe.id,# מזהה המתכון
        "title": recipe.title,# כותרת המתכון
        "likes": recipe.likes or 0,  # הוספה
        "dislikes": recipe.dislikes or 0,  # הוספה
        "rating": recipe.rating or 0.0,  # הוספה
        "num_ratings": recipe.num_ratings or 0,  # הוספה
        "instructions": recipe.instructions,# הוראות הכנה
        "prep_time": recipe.prep_time,# זמן הכנה בדקות
        "type": recipe.type,# סוג המתכון
        "images": images,  # מערך של כתובות תמונה
        "ingredients": ing_list , # מערך של רכיבים
        "category": recipe.category,
    })

# 3. הוספת לייק למתכון
@recipes_bp.route('/recipe/<int:id>/like', methods=['POST'])
def like_recipe(id):
    # שליפת המתכון לפי ה-ID
    recipe = Recipe.query.get_or_404(id)
    # הוספת לייק
    recipe.likes = (recipe.likes or 0) + 1
    #שמירת השינוי במסד הנתונים
    db.session.commit()
    # החזרת מספר הלייקים המעודכן
    return jsonify({"likes": recipe.likes})
# 4. הוספת דיסלייק למתכון
@recipes_bp.route('/recipe/<int:id>/dislike', methods=['POST'])
def dislike_recipe(id):
    # שליפת המתכון לפי ה-ID
    recipe = Recipe.query.get_or_404(id)
    # הוספת דיסלייק
    recipe.dislikes = (recipe.dislikes or 0) + 1
    #שמירת השינוי במסד הנתונים
    db.session.commit()
    # החזרת מספר הדיסלייקים המעודכן
    return jsonify({"dislikes": recipe.dislikes})


# 6. ביטול לייק למתכון
@recipes_bp.route('/recipe/<int:id>/unlike', methods=['POST'])
def unlike_recipe(id):
    recipe = Recipe.query.get_or_404(id)
    # מוודאים שלא יורדים מתחת לאפס
    if recipe.likes and recipe.likes > 0:
        recipe.likes -= 1
    else:
        recipe.likes = 0

    db.session.commit()
    return jsonify({"likes": recipe.likes})
# 5. דירוג מתכון
@recipes_bp.route('/recipe/<int:id>/rate', methods=['POST'])
def rate_recipe(id):
    # קבלת הנתונים מהבקשה
    data = request.json
    # קבלת הציון החדש
    new_score = data.get('rating')
    # בדיקת תקינות הציון
    recipe = Recipe.query.get_or_404(id)
    # אתחול ערכים אם הם None
    curr_rating = recipe.rating or 0.0
    curr_num = recipe.num_ratings or 0
    # חישוב הממוצע החדש
    total_points = (curr_rating * curr_num) + new_score
    # עדכון הערכים במתכון
    recipe.num_ratings = curr_num + 1
    recipe.rating = total_points / recipe.num_ratings
# שמירת השינויים במסד הנתונים
    db.session.commit()
    return jsonify({
        "rating": round(recipe.rating, 1),
        "num_ratings": recipe.num_ratings
    })
# 7. קבלת כל הקטגוריות הייחודיות
@recipes_bp.route('/categories', methods=['GET'])
def get_categories():
    # מחזיר רשימה ייחודית של כל הקטגוריות שיש במתכונים כרגע
    categories = db.session.query(Recipe.category).distinct().all()
    return jsonify([c[0] for c in categories if c[0]])

# פונקציה 9: מועדפים
@recipes_bp.route('/users/<int:user_id>/favorites', methods=['GET'])
def get_user_favorites(user_id):
    user = User.query.get_or_404(user_id)
    base_url = "http://127.0.0.1:5000/static/uploads/"
    return jsonify([{
        'id': r.id,
        'title': r.title,
        'image_path': base_url + r.image_path if r.image_path else None
    } for r in user.favorites])

# פונקציה 8: המתכונים שלי
@recipes_bp.route('/recipes/user/<int:user_id>', methods=['GET'])
def get_user_recipes(user_id):
    recipes = Recipe.query.filter_by(user_id=user_id).all()
    base_url = "http://127.0.0.1:5000/static/uploads/"
    return jsonify([{
        'id': r.id,
        'title': r.title,
        'image_path': base_url + r.image_path if r.image_path else None
    } for r in recipes])

#10. עדכון מתכון קיים עם תמונה
@recipes_bp.route('/api/recipes/<int:recipe_id>', methods=['PUT', 'OPTIONS'])
def update_recipe(recipe_id):
    # 1. טיפול בבקשות מקדימות של הדפדפן
    if request.method == 'OPTIONS':
        return jsonify({"success": True}), 200
    try:
        # 2. שליפת המתכון
        recipe = Recipe.query.get_or_404(recipe_id)

        # 3. עדכון שדות בסיסיים
        recipe.title = request.form.get('title')
        recipe.type = request.form.get('type')
        recipe.category = request.form.get('category')
        recipe.instructions = request.form.get('instructions')
        recipe.prep_time = request.form.get('prep_time')

        # 4. עדכון רכיבים (מחיקה ויצירה מחדש)
        ingredients_json = request.form.get('ingredients')
        if ingredients_json:
            IngredientEntry.query.filter_by(recipe_id=recipe.id).delete()
            ingredients_data = json.loads(ingredients_json)
            for ing in ingredients_data:
                new_ing = IngredientEntry(
                    product=ing.get('product'),
                    amount=ing.get('amount'),
                    unit=ing.get('unit'),
                    recipe_id=recipe.id
                )
                db.session.add(new_ing)

        # 5. טיפול בתמונה (אם הועלתה חדשה)
        if 'image' in request.files:
            file = request.files['image']
            if file.filename != '':
                filename = secure_filename(file.filename)

                # יצירת התיקייה אם צריך
                recipe_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], str(recipe.id))
                if not os.path.exists(recipe_folder):
                    os.makedirs(recipe_folder)

                save_path = os.path.join(recipe_folder, filename)
                file.save(save_path)

                # עדכון הנתיב הראשי במסד
                recipe_id_str = str(recipe.id)
                recipe.image_path = f"{recipe_id_str}/{filename}"

                with Image.open(save_path) as img:
                    # שחור לבן
                    bw_name = "bw_" + filename
                    img.convert('L').save(os.path.join(recipe_folder, bw_name))
                    recipe.image_bw = f"{recipe_id_str}/{bw_name}"

                    # סיבוב
                    rot_name = "rot_" + filename
                    img.rotate(90, expand=True).save(os.path.join(recipe_folder, rot_name))
                    recipe.image_rotated = f"{recipe_id_str}/{rot_name}"

                    # טשטוש
                    image_blur_name = "blur_" + filename
                    img.filter(ImageFilter.GaussianBlur(radius=5)).save(os.path.join(recipe_folder, image_blur_name))
                    recipe.image_blur = f"{recipe_id_str}/{image_blur_name}"

                    # היפוך מראה
                    flip_name = "flip_" + filename
                    img.transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(recipe_folder, flip_name))
                    recipe.image_flip = f"{recipe_id_str}/{flip_name}"

                    # חיזוק צבעים
                    enhancer = ImageEnhance.Color(img)
                    img_enhanced = enhancer.enhance(1.5)
                    color_name = "color_" + filename
                    img_enhanced.save(os.path.join(recipe_folder, color_name))
                    recipe.image_color = f"{recipe_id_str}/{color_name}"
                # -------------------------------------------------------

        # 6. שמירה סופית
        db.session.commit()
        return jsonify({"message": "המתכון עודכן בהצלחה!"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Update Error: {str(e)}")
        return jsonify({"error": str(e)}), 500


# הוספה או הסרה מהמועדפים
@recipes_bp.route('/users/<int:user_id>/favorites/<int:recipe_id>', methods=['POST'])
def toggle_favorite(user_id, recipe_id):
    user = User.query.get_or_404(user_id)
    recipe = Recipe.query.get_or_404(recipe_id)

    if recipe in user.favorites:
        user.favorites.remove(recipe)
        message = "הוסר מהמועדפים"
    else:
        user.favorites.append(recipe)
        message = "נוסף למועדפים"

    db.session.commit()
    return jsonify({"message": message, "is_favorite": recipe in user.favorites})

#11. העלאת תמונת פרופיל משתמש
@recipes_bp.route('/upload_profile_image/<int:user_id>', methods=['POST'])
def upload_profile_image(user_id):
    file = request.files.get('image')
    user = User.query.get_or_404(user_id)

    if file:
        filename = secure_filename(f"profile_{user_id}_{file.filename}")
        # יצירת נתיב שמירה
        profile_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'profiles')
        if not os.path.exists(profile_folder):
            os.makedirs(profile_folder)

        save_path = os.path.join(profile_folder, filename)
        file.save(save_path)

        # שמירת הנתיב היחסי ב-DB
        user.profile_image = f"profiles/{filename}"
        db.session.commit()

        return jsonify({
            "profile_image": f"http://127.0.0.1:5000/static/uploads/profiles/{filename}",
            "message": "Success"
        }), 200

# עדכון שם משתמש
@recipes_bp.route('/users/<int:user_id>/update-name', methods=['PUT'])
def update_user_name(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    if 'name' in data:
        user.name = data['name']
        db.session.commit()
        return jsonify({"message": "Name updated successfully"}), 200
    return jsonify({"error": "No name provided"}), 400
