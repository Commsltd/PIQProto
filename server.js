from flask import Flask, send_from_directory, jsonify
import csv
import os

app = Flask(__name__, static_folder='.')

# Serve the index.html file
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

# Serve the styles.css file
@app.route('/styles.css')
def serve_styles():
    return send_from_directory('.', 'styles.css')

# Serve the scripts.js file
@app.route('/scripts.js')
def serve_scripts():
    return send_from_directory('.', 'scripts.js')

# Serve the payment-practices.csv file from the 'public' directory
@app.route('/public/payment-practices.csv')
def serve_payment_practices():
    return send_from_directory('public', 'payment-practices.csv')

# API endpoint to get data from payment-practices.csv as JSON
@app.route('/api/payment-practices')
def get_payment_practices():
    data = []
    csv_path = os.path.join('public', 'payment-practices.csv')
    if os.path.exists(csv_path):
        with open(csv_path, newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                data.append(row)
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=8080)
