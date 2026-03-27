import sys
import random
import json
import urllib.request
import urllib.error
from urllib.parse import urlencode
from io import BytesIO
import uuid

sys.path.append('backend')
from config import MONGODB_URL
from pymongo import MongoClient

BASE = 'http://127.0.0.1:8000'
email = f'chatuser{random.randint(10000,99999)}@example.com'
password = 'Password1'

def post_json(path, payload, token=None):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(BASE + path, data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read().decode('utf-8')
        return r.getcode(), body

def get_json(path, token):
    req = urllib.request.Request(BASE + path, method='GET')
    req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read().decode('utf-8')
        return r.getcode(), body

def post_multipart(path, fields, file_field, file_name, file_bytes, file_type, token):
    boundary = '----WebKitFormBoundary' + uuid.uuid4().hex
    body = BytesIO()
    for k, v in fields.items():
        body.write(f'--{boundary}\r\n'.encode())
        body.write(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
        body.write(str(v).encode())
        body.write(b'\r\n')
    body.write(f'--{boundary}\r\n'.encode())
    body.write(f'Content-Disposition: form-data; name="{file_field}"; filename="{file_name}"\r\n'.encode())
    body.write(f'Content-Type: {file_type}\r\n\r\n'.encode())
    body.write(file_bytes)
    body.write(b'\r\n')
    body.write(f'--{boundary}--\r\n'.encode())

    req = urllib.request.Request(BASE + path, data=body.getvalue(), method='POST')
    req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
    req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.getcode(), r.read().decode('utf-8')

print('TEST_EMAIL', email)
code, body = post_json('/api/auth/signup', {
    'name': 'Chat User',
    'email': email,
    'phone': '',
    'password': password,
    'role': 'student'
})
print('SIGNUP', code, body[:180])

mc = MongoClient(MONGODB_URL)
db = mc.writewisely
otp_doc = db.otp_store.find_one({'email': email, 'purpose': 'signup'}, sort=[('created_at', -1)])
if not otp_doc:
    raise RuntimeError('OTP_NOT_FOUND')
otp = otp_doc['otp']
print('OTP_FOUND', otp)

code, body = post_json('/api/auth/verify-otp', {'email': email, 'otp': otp})
print('VERIFY', code, body[:180])
resp = json.loads(body)
token = resp['token']

code, body = post_multipart(
    '/api/chat/upload-document',
    {'title': 'Project Brief'},
    'file',
    'sample.txt',
    b'This is a sample project brief. The chatbot should summarize this and answer with context injection.',
    'text/plain',
    token
)
print('UPLOAD', code, body[:220])
doc_id = json.loads(body)['id']

code, body = post_json('/api/chat/send', {
    'message': 'Summarize my uploaded brief in one line.',
    'document_ids': [doc_id]
}, token=token)
print('CHAT', code, body[:320])

code, body = get_json('/api/chat/documents', token)
print('DOCS', code, body[:220])
print('E2E_DONE')
