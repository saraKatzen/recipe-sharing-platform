from app import app  # ודאי שזה השם הנכון של הקובץ הראשי שלך
from db_instance import db
from models.user import User
from werkzeug.security import generate_password_hash


def encrypt_all_existing_passwords():
    """
    עובר על כל המשתמשים בבסיס הנתונים.
    אם הסיסמה שלהם עדיין לא מוצפנת - מצפין אותה.
    """
    with app.app_context():
        try:
            print("--- מתחיל בתהליך המרת סיסמאות ---")

            users = User.query.all()
            updated_count = 0
            skipped_count = 0

            for user in users:
                current_password = user.password

                # בדיקת בטיחות: האם הסיסמה כבר נראית מוצפנת?
                # סיסמאות של werkzeug מתחילות בדרך כלל ב-pbkdf2:sha256
                if current_password.startswith("pbkdf2:"):
                    print(f"משתמש {user.email}: הסיסמה כבר מוצפנת. מדלג.")
                    skipped_count += 1
                    continue

                # אם הגענו לפה, הסיסמה היא טקסט רגיל (למשל '123456')
                # נבצע הצפנה
                hashed_password = generate_password_hash(current_password)

                # נעדכן את האובייקט
                user.password = hashed_password
                updated_count += 1
                print(f"משתמש {user.email}: הסיסמה הוצפנה בהצלחה.")

            # שמירת כל השינויים במסד הנתונים בפעם אחת
            db.session.commit()

            print("------------------------------------------------")
            print("התהליך הסתיים.")
            print(f"סה'כ משתמשים שעודכנו: {updated_count}")
            print(f"סה'כ משתמשים שדולגו (כבר היו תקינים): {skipped_count}")

        except Exception as e:
            db.session.rollback()  # ביטול שינויים במקרה של תקלה
            print(f"שגיאה קריטית בתהליך: {e}")


if __name__ == "__main__":
    encrypt_all_existing_passwords()