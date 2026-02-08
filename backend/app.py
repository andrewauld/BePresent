from flask import Flask, Blueprint, request, jsonify
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

@api.get("/images/<path:filename>")
@token_required
def get_image(current_user, filename):
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

app.register_blueprint(api, url_prefix="/api/v1")
