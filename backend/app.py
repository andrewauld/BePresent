from bson import ObjectId
from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from functools import wraps
from google.cloud import storage
import uuid
import certifi

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev_secret_key') # Change this in production!
CORS(app)
api = Blueprint("api", __name__)

client = MongoClient(os.environ["MONGODB_URI"], tls=True, tlsCAFile=certifi.where())
db = client["CoreSystem"]
users_collection = db["users"]
modules_collection = db["modules"]
module_participants_collection = db["module_participants"]
lecture_attendances_collection = db["lecture_attendances"]

GCP_IMAGES_BUCKET_NAME = "bepresentimages"
GCP_CREDENTIALS_FILE_PATH = "gcp-credentials.json"

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.removeprefix("Bearer ").strip()
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users_collection.find_one({"username": data['username']})
            if not current_user:
                return jsonify({'message': 'Token is invalid!'}), 404
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def generate_token(username: str):
    return jwt.encode({
        'username': username,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
    }, app.config['SECRET_KEY'], algorithm="HS256")

@api.post("/users/register")
def register():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip()
    password = data.get("password") or ""

    if not username or not email or not password:
        return {"message": "Missing required parameters"}, 400

    existing = users_collection.find_one(
        {"$or": [{"username": username}, {"email": email}]},
        {"_id": 1, "username": 1, "email": 1},
    )

    if existing:
        return jsonify({"message": "User already exists"}), 409

    password_hash = generate_password_hash(password)

    result = users_collection.insert_one({"username": username, "email": email, "password_hash": password_hash})

    token = generate_token(username)

    return jsonify({'token': token})

@api.post("/users/login")
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("email") or data.get("username") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return jsonify({"message": "Missing required parameters"}), 400

    user = users_collection.find_one(
        {"$or": [{"email": identifier.lower()}, {"username": identifier}]},
        {"username": 1, "email": 1, "password_hash": 1},
    )

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"message": "Invalid credentials"}), 401
    
    token = generate_token(user["username"])

    return jsonify({'token': token})

@api.get("/count_attendance")
@token_required
def count_attendance(current_user):
    query = {"user_id": current_user["_id"]}

    attendance_count = lecture_attendances_collection.count_documents(query)
    return jsonify({
        'username': current_user["username"],
        'attendance_count': attendance_count
    })

@api.post("/log_attendance")
@token_required
def log_attendance(current_user):
    data = request.get_json(silent=True) or {}
    module_code = data.get("module_code")
    image_id = data.get("image_id")

    user_id = str(current_user["_id"])

    if not module_code or not image_id:
        return jsonify({"message": "Missing required parameters"}), 400

    module = modules_collection.find_one({"code": module_code})
    if not module:
        return jsonify({"message": "Module not found"}), 404
    module_id = str(module["_id"])

    participant = module_participants_collection.find_one({"$and": [{"user_id": user_id}, {"module_id": module_id}]})
    if not participant:
        return jsonify({"message": "User not enrolled in this module"}), 404

    try:
        storage_client = storage.Client.from_service_account_json(GCP_CREDENTIALS_FILE_PATH)
        bucket = storage_client.bucket(GCP_IMAGES_BUCKET_NAME)
        blob = bucket.blob(image_id)

        if not blob.exists():
            return jsonify({"message": "Image not found"}), 404
    except Exception as e:
        print(f"Error fetching image from GCP: {e}")
        return jsonify({"message": "Error fetching image"}), 500

    today_start = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end = today_start + datetime.timedelta(days=1)

    already_logged = lecture_attendances_collection.find_one({
        "user_id": user_id,
        "module_id": module_id,
        "date": {"$gte": today_start, "$lte": today_end}
    })
    if already_logged:
        return jsonify({"message": "Already logged attendance for this module today"}), 409

    lecture_attendances_collection.insert_one({
        "user_id": user_id,
        "module_id": module_id,
        "date": datetime.datetime.utcnow(),
        "image_id": image_id
    })

    # Get other classmates who checked in today
    classmates_cursor = lecture_attendances_collection.find({
        "module_id": module_id,
        "date": {"$gte": today_start, "$lte": today_end},
        "user_id": {"$ne": user_id}  # Exclude self
    }).sort("date", -1).limit(10)

    classmates = []
    for doc in classmates_cursor:
        friend_user = users_collection.find_one({"_id": doc["user_id"]}) # user_id is stored as ObjectId if inserted correctly, but earlier we cast to str. Let's check.
        # Wait, in the insert above: "user_id": user_id (which is str(current_user["_id"])). So it's a string.
        # But users_collection uses ObjectId for _id. So we need to query with ObjectId(doc["user_id"]) OR if we stored string, we query string.
        # The code above says: user_id = str(current_user["_id"]). So we stored a string.
        # But to find the user details, we need to query users_collection. users_collection keys are ObjectIds.
        # So we need to convert string back to ObjectId.
        from bson.objectid import ObjectId
        friend_user = users_collection.find_one({"_id": ObjectId(doc["user_id"])})
        
        if friend_user:
            classmates.append({
                "id": str(friend_user["_id"]),
                "name": friend_user.get("username", "Unknown"),
                "image_id": doc.get("image_id"),
                "time": doc["date"].strftime("%I:%M %p")
            })

    return jsonify({
        "message": "Attendance logged successfully", 
        "classmates": classmates
    }), 201


@api.get("/attendance_history")
@token_required
def get_attendance_history(current_user):
    user_id = str(current_user["_id"])
    
    today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    seven_days_ago = today - datetime.timedelta(days=6)
    
    cursor = lecture_attendances_collection.find({
        "user_id": user_id,
        "date": {"$gte": seven_days_ago}
    }).sort("date", 1)
    
    history = []
    for doc in cursor:
        history.append({
            "date": doc["date"].isoformat(),
            "module_id": doc["module_id"],
            "image_id": doc.get("image_id")
        })
        
    return jsonify({"history": history})


@api.get("/images/<path:filename>")
def get_image(filename):
    try:
        storage_client = storage.Client.from_service_account_json(GCP_CREDENTIALS_FILE_PATH)

        bucket = storage_client.bucket(GCP_IMAGES_BUCKET_NAME)
        blob = bucket.blob(filename)

        if not blob.exists():
            return jsonify({"message": "Image not found"}), 404

        image_data = blob.download_as_bytes()

        content_type = blob.content_type or 'application/octet-stream'

        from flask import make_response
        response = make_response(image_data)
        response.headers['Content-Type'] = content_type
        return response

    except Exception as e:
        print(f"Error fetching image from GCP: {e}")
        return jsonify({"message": "Error fetching image"}), 500

@api.post("/images/upload")
@token_required
def upload_image(current_user):
    if 'file' not in request.files:
        return jsonify({"message": "No file part"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"message": "No selected file"}), 400

    if file:
        try:
            id = str(uuid.uuid4())
            storage_client = storage.Client.from_service_account_json(GCP_CREDENTIALS_FILE_PATH)
            bucket = storage_client.bucket(GCP_IMAGES_BUCKET_NAME)
            blob = bucket.blob(id)
            blob.upload_from_file(file)

            return jsonify({"message": "Image uploaded successfully", "uuid": id}), 201
        except Exception as e:
            print(f"Error uploading image: {e}")
            return jsonify({"message": "Error uploading image"}), 500
    return None

@api.post("/join_module")
@token_required
def join_module(user):
    data = request.get_json(silent=True) or {}
    module_code = data.get("module_code") or ""

    if not module_code:
        return jsonify({"message": "Module code required"}), 400

    module = modules_collection.find_one({"code": module_code}, {"_id": 1, "code": 1})

    if not module:
        return jsonify({"message": "Module not found"}), 404

    already_joined = module_participants_collection.find_one({"module_id": str(module["_id"]), "user_id": str(user["_id"])})
    if already_joined:
        return jsonify({"message": "Already joined module"}), 400

    module_participants_collection.insert_one({"module_id": str(module["_id"]), "user_id": str(user["_id"]), "points": 0})
    return jsonify({"message": "Successfully joined module"}), 201


@api.get("/modules")
@token_required
def get_modules(current_user):
    modules = list(modules_collection.find({}, {"_id": 1, "code": 1, "name": 1}))
    result = []
    for module in modules:
        result.append({
            "id": str(module["_id"]),
            "code": module["code"],
            "name": module.get("name", "")
        })
    return jsonify({"modules": result})

@api.get("/retrieve_leaderboard")
@token_required
def retrieve_leaderboard(current_user):
    pipeline = []
    pipeline.extend([
        {
            "$group": {
                "_id": "$user_id",
                "attendance_count": {"$sum": 1}
            }
        },
        {
            "$sort": {"attendance_count": -1}
        }
    ])

    leaderboard_entries = list(lecture_attendances_collection.aggregate(pipeline))

    leaderboard = []
    for entry in leaderboard_entries:
        user = users_collection.find_one(
            {"_id": ObjectId(entry["_id"])},
            {"username": 1, "email": 1}
        )
        if user:
            leaderboard.append({
                "username": user["username"],
                "email": user["email"],
                "attendance_count": entry["attendance_count"]
            })

    return jsonify({"leaderboard": leaderboard})

app.register_blueprint(api, url_prefix="/api/v1")
