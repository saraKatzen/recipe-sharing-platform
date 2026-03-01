from flask import Blueprint, request, jsonify, current_app
from db_instance import db
from models.user import User
from models.recipe import Recipe
from models.ingredient_entry import IngredientEntry
import os
import shutil
# יצירת Blueprint למנהל
admin_bp = Blueprint('admin_bp', __name__)

# 1. קבלת רשימת כל המשתמשים (למנהל בלבד)
@admin_bp.route('/admin/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "is_approved_uploader": u.is_approved_uploader,
        "profile_image": u.profile_image
    } for u in users])

# 2.  פונקציה למחיקת משתמש
@admin_bp.route('/admin/delete-user/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    # בדיקה שהמשתמש המוחק הוא אכן Admin
    user_to_delete = User.query.get_or_404(user_id)
    # הגנה: אי אפשר למחוק מנהלים אחרים דרך הפאנל הזה
    if user_to_delete.role == 'Admin':
        return jsonify({"error": "לא ניתן למחוק מנהל מערכת"}), 403
    db.session.delete(user_to_delete)
    db.session.commit()
    return jsonify({"message": "המשתמש נמחק בהצלחה"}), 200

#3.אישור משתמש ליוצר תוכן
@admin_bp.route('/admin/toggle-user-status/<int:user_id>', methods=['POST'])
def toggle_user_status(user_id):
    # שליפת המשתמש
    user = User.query.get_or_404(user_id)
    # הגנה: לא משנים סטטוס למנהל
    if user.role == 'Admin':
        return jsonify({"error": "לא ניתן לשנות סטטוס למנהל מערכת"}), 403
    # לוגיקה חכמה
    if user.role != 'Uploader':
        # --- פעולת שדרוג (Upgrade) ---
        user.role = 'Uploader'
        user.is_approved_uploader = True
        # אם הייתה בקשה ממתינה - סוגרים אותה
        user.request_pending = False
        action = "approved"
    else:
        # --- פעולת ביטול ---
        user.role = 'Reader'
        user.is_approved_uploader = False
        action = "revoked"

    db.session.commit()
    return jsonify({
        "message": f"User status {action}",
        "new_role": user.role,
        "is_approved": user.is_approved_uploader,
        # מחזירים גם את זה כדי שהצד-לקוח ידע להעלים אותו מרשימת הממתינים
        "request_pending": False
    }), 200
# 4. מחיקת מתכון (למנהל בלבד)
@admin_bp.route('/delete-recipe/<int:id>', methods=['DELETE'])
def delete_recipe(id):
# בדיקת הרשאות מנהל
    user_id = request.args.get('user_id')
    user = User.query.get(user_id)
#אם המשתמש לא קיים או שאינו מנהל, מחזיר שגיאה
    if not user or user.role != 'Admin':
        return jsonify({"message": "אין לך הרשאה למחוק מתכונים"}), 403
# קבלת המתכון לפי ה-ID
    recipe = Recipe.query.get_or_404(id)
    try:
        # מחיקת הרכיבים המקושרים למתכון
        IngredientEntry.query.filter_by(recipe_id=id).delete()
        #  מחיקת תיקיית התמונות מהדיסק
        recipe_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], str(id))
        #  בדיקה אם התיקייה קיימת לפני המחיקה
        if os.path.exists(recipe_folder):
            #  מחיקת התיקייה וכל תוכנה
            shutil.rmtree(recipe_folder)
# מחיקת המתכון מהבסיס נתונים
        db.session.delete(recipe)
        db.session.commit()
# החזרת תגובה מוצלחת
        return jsonify({"message": "המתכון נמחק בהצלחה"}), 200
    except Exception as e:
        # טיפול בשגיאות
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
# 5. קבלת רשימת משתמשים עם בקשות ממתינות (למנהל בלבד)
@admin_bp.route('/admin/pending-users', methods=['GET'])
def get_pending_users():
    # בדיקת הרשאות מנהל
    pending_users = User.query.filter_by(request_pending=True).all()
    users_list = []
    for user in pending_users:
        users_list.append({
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "profile_image": user.profile_image
        })
    return jsonify(users_list), 200

# 6. בקשה להפוך למשתמש מורשה (עבור המשתמש)
@admin_bp.route('/request-contributor/<int:user_id>', methods=['POST'])
def request_contributor(user_id):
    # מציאת המשתמש לפי ה-ID
    user = User.query.get(user_id)
    if user:
       # עדכון השדה לבקשה ממתינה
        user.request_pending = True
        db.session.commit()
        return jsonify({"message": "בקשתך נשלחה למנהל וממתינה לאישור"}), 200
    return jsonify({"error": "משתמש לא נמצא"}), 404




