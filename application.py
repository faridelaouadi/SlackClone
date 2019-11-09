import os
import time

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, disconnect

from collections import deque

app = Flask(__name__)

# socket-io configure
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# in-memory data
USERS = {}
CHANNELS = {"general": deque([], maxlen=100)}

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on('connect')
def connection():
    print("new user connected")

@socketio.on('userdata')
def user_data(data):
    if 'username' in data:
        USERS[data['username']] = request.sid #request socket ID

@socketio.on('new channel')
def new_channel(data):
    if data['name'] in CHANNELS:
        return False
    else:
        CHANNELS[data['name']] = deque(maxlen=100)
        emit('new channel', { "name" : data['name']}, broadcast=True)

@socketio.on('new msg')
def new_msg(data):
    if 'channel' in data:
        data['created_at'] = int(time.time())
        CHANNELS[data['channel']].append(data)
        #data['username'] is the username of the person who sent the message
        emit('msg', data, broadcast=True)

@socketio.on('get channels')
def get_channels():
    emit('channels', list(CHANNELS.keys()))

@socketio.on('get msgs')
def get_msgs(data):
    if 'name' in data:
        emit('msgs', list(CHANNELS[data['name']]))

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)) , debug = True)
