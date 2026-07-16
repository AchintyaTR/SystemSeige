import sqlite3

try:
    conn = sqlite3.connect('backend/finance.db')
    cursor = conn.cursor()
    cursor.execute('ALTER TABLE expenses ADD COLUMN amount_applied_to_debt FLOAT DEFAULT 0.0;')
    conn.commit()
    print("Column added successfully!")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("Column already exists!")
    else:
        print(f"OperationalError: {e}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
