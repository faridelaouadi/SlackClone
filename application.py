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
CHANNELS = {"General": ["This is a general public forum",deque([], maxlen=100)]}
#deque is used as it has fast pop and push access to each side. We will unlikely be randomly accessing elements hence we didnt choose to use a list

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on('connect')
def connection():
    print("new user connected")

@socketio.on('userdata')
def user_data(data):
    if 'username' in data:
        username = data['username']
        USERS[username] = request.sid #request socket ID
        emit('new user', data, broadcast=True)

@socketio.on('new channel')
def new_channel(data):
    if data['name'] in CHANNELS:
        return False
    else:
        CHANNELS[data['name']] = [data['channel_status'], deque(maxlen=100)]
        emit('new channel', { "name" : data['name'], "channel_status": data['channel_status']}, broadcast=True)

@socketio.on('new msg')
def new_msg(data):
    if 'channel' in data:
        data['created_at'] = int(time.time())
        CHANNELS[data['channel']][1].append(data)
        #data['username'] is the username of the person who sent the message
        emit('msg', data, broadcast=True)

@socketio.on('get channels')
def get_channels():
    custom_list = []
    for key in CHANNELS:
        custom_list.append([key,CHANNELS[key][0]])
    #custom_list is a list of pairs of channel_name,channel_status
    emit('channels', custom_list)

@socketio.on('get users')
def get_users():
    emit('users', list(USERS.keys()))

@socketio.on('get msgs')
def get_msgs(data):
    if 'name' in data:
        emit('msgs', list(CHANNELS[data['name']][1]))

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)) , debug = True)
