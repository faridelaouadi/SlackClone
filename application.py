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
CHANNELS = {"General": ["This is a general public forum",deque([], maxlen=100)], "Starred Messages":["A collection of all your starred messages",{}]}
#starred messaged in the format {username:[(user,message,chat)...],...}
#deque is used as it has fast pop and push access to each side. We will unlikely be randomly accessing elements hence we didnt choose to use a list

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on('connect')
def connection():
    print("new user connected")

@socketio.on('new starred message')
def new_starred_message(data):
    print("We have recived the request to add a new starred message to the user")
    print(f"Chat: {data['channel']} \n Message: {data['message_content']} \n")
    try:
        #if the user already has starred messages, we access them
        user_starred_messages = CHANNELS["Starred Messages"][1][data['username']]
    except:
        #if the user doesnt, we create the list of starred messages
        CHANNELS["Starred Messages"][1][data['username']] = []
        user_starred_messages = CHANNELS["Starred Messages"][1][data['username']]
        #refactor these two lines
    finally:
        #we then append to that list the list of [channel,message_content,username_of_sender]
        user_starred_messages.append([data['channel'],data['message_content'],data['username_of_message']])
    print(f"the user now has the follwong starred messages {user_starred_messages}")

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
        #if its starred messages send the relevant messages
        emit('msgs', list(CHANNELS[data['name']][1]))

@socketio.on('get starred messages')
def get_starred_messages(data):
    if 'username' in data:
        try:
            #send the starred messages
            emit('starred messages', CHANNELS["Starred Messages"][1][data['username']])
        except:
            #if they do not have any, send an empty list
            emit('starred messages', [["", "No messages have been starred", ""]])


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)) , debug = True)
