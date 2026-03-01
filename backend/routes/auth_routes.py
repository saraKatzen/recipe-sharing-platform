from flask import Blueprint, request, jsonify, current_app
from db_instance import db
from models.user import User
from werkzeug.security import generate_password_hash, check_password_hash

# יצירת Blueprint לאימות
auth_bp = Blueprint('auth_bp', __name__)

# 1.רישום משתמש חדש
@auth_bp.route('/register', methods=['POST'])
def register():
    # קבלת הנתונים מהבקשה
    data = request.get_json()
    # שימוש ב-app_context כדי להבטיח שהחיבור פעיל
    with current_app.app_context():
        try:
            # בדיקה אם המשתמש קיים
            existing_user = User.query.filter_by(email=data.get('email')).first()
            if existing_user:
                return jsonify({"message": "User already exists"}), 400
            #הצפנת הסיסמא
            hashed_password = generate_password_hash(data.get('password'))
            # יצירה
            new_user = User(
                email=data.get('email'),
                name=data.get('name'),
                password=hashed_password
            )
            # שמירת המשתמש החדש בבסיס הנתונים
            db.session.add(new_user)
            db.session.commit()
            return jsonify({"message": "User registered successfully"}), 201
        # טיפול בשגיאות כלליות
        except Exception as e:
            return jsonify({"message": "Server Error", "error": str(e)}), 500
# התחברות משתמש קיים
@auth_bp.route('/login', methods=['POST'])
def login():
    # קבלת הנתונים מהבקשה
    data = request.get_json()
    # חיפוש המשתמש לפי האימייל
    user = User.query.filter_by(email=data.get('email')).first()
    #  בדיקת הסיסמה באמצעות הפונקציה המיוחדת ---
    if user and check_password_hash(user.password, data.get('password')):
        # החזרת פרטי המשתמש (ללא הסיסמה)
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_approved_uploader": user.is_approved_uploader,
                "is_approved_contributor": user.is_approved_contributor,
                "request_pending": getattr(user, 'request_pending', False),
                # שליחת מספרי המתכונים שהמשתמש אהב
                "favorites": [recipe.id for recipe in user.favorites],
                "profile_image": user.profile_image if user.profile_image else None,
            }
        }), 200
# במקרה של כישלון באימות
    return jsonify({"message": "Invalid email or password"}), 401
# קבלת סטטוס משתמש
@auth_bp.route('/user-status/<int:user_id>', methods=['GET'])
def get_user_status(user_id):
    user = User.query.get_or_404(user_id)
    # בשביל התמונת פרופיל
    base_url = "http://127.0.0.1:5000/static/uploads/"
    return jsonify({
        "is_approved_uploader": user.is_approved_uploader,
        "request_pending": getattr(user, 'request_pending', False),
        "profile_image": base_url + user.profile_image if user.profile_image else None,
        "name": user.name
    }), 200


