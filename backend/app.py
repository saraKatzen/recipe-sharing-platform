from flask import Flask, request, jsonify
from flask_cors import CORS
from db_instance import db
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash
# ייבוא כל המודלים כדי ש-Alembic יכיר אותם
from models.user import User
from models.recipe import Recipe
from models.favorites import favorites_table
# ייבוא ה-Blueprints
from routes.auth_routes import auth_bp
from routes.admin_routes import admin_bp
from routes.recipe_routes import recipes_bp
# ----------------- הגדרות בסיסיות -----------------
app = Flask(__name__)
CORS(app)

# הגדרות בסיסיות של מסד הנתונים
UPLOAD_FOLDER = 'static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///your_database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# אתחול מסד הנתונים וההגירות
if not hasattr(app, 'extensions') or 'sqlalchemy' not in app.extensions:
    db.init_app(app)
migrate = Migrate(app, db)
# ----------------- רישום ה-Blueprints -----------------
#חיבור כל הדפים הראשיים לאפליקציה
app.register_blueprint(auth_bp)
app.register_blueprint(admin_bp)
app.register_blueprint(recipes_bp)
# --- התחלת קוד זמני לשינוי סיסמה והגדרת מנהל ---
with app.app_context():
    email_to_find = 's0548504567@gmail.com'
    user_to_admin = User.query.filter_by(email=email_to_find).first()

    if user_to_admin:
        # 1. הגדרת תפקיד מנהל
        user_to_admin.role = 'Admin'
        user_to_admin.is_approved_uploader = True
        new_password = "1111"
        user_to_admin.password = generate_password_hash(new_password)

        db.session.commit()
        print(f"--- בוצע! המשתמש {email_to_find} הוא עכשיו מנהל. ---")
        print(f"--- הסיסמה החדשה שלו היא: {new_password} ---")
    else:
        print("--- Error: User not found! ---")
# --- סוף קוד זמני ---
# ----------------- הפעלת השרת -----------------
if __name__ == '__main__':
    with app.app_context():
      db.create_all()  # יצירת הטבלאות אם לא קיימות
    app.run(debug=True)


