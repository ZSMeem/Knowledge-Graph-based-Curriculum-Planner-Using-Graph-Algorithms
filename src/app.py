from flask import Flask, send_from_directory, request, jsonify
import json
import os
import sys

# Add the src directory to the path for imports
sys.path.insert(0, os.path.dirname(__file__))

app = Flask(__name__, static_folder='../web', static_url_path='')

# Path to the web and data directories
WEB_DIR = os.path.join(os.path.dirname(__file__), '..', 'web')
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')
CURRICULUM_FILE = os.path.join(DATA_DIR, 'curriculum.json')

@app.route('/')
def index():
    return send_from_directory(WEB_DIR, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(WEB_DIR, filename)

@app.route('/api/curriculum', methods=['GET'])
def get_curriculum():
    try:
        with open(CURRICULUM_FILE, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except FileNotFoundError:
        return jsonify({"error": "Curriculum file not found"}), 404
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON"}), 400

@app.route('/api/curriculum', methods=['POST'])
def save_curriculum():
    try:
        data = request.get_json()
        
        # Ensure the data directory exists
        os.makedirs(DATA_DIR, exist_ok=True)
        
        with open(CURRICULUM_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        return jsonify({"message": "Curriculum saved successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)
