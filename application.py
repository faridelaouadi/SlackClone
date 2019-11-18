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
CHANNELS = {"General": ["This is a general public forum",[], "public"], "Starred Messages":["A collection of all your starred messages",{},"public"]}
#the new format of messages will be {channel_name: [channel_status,{message1-info, message2-info}]}
#message info is in this dictionary format --> {'msg': 'hello', 'channel': 'General', 'username': 'Farid', 'created_at': 1574078726}
#deque is used as it has fast pop and push access to each side. We will unlikely be randomly accessing elements hence we didnt choose to use a list

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on('connect')
def connection():
    print("new user connected")

@socketio.on('new starred message')
def new_starred_message(data):
    try:
        #if the user already has starred messages, we access them
        user_starred_messages = CHANNELS["Starred Messages"][1][data['username']]
    except:
        #if the user doesnt, we create the list of starred messages
        CHANNELS["Starred Messages"][1][data['username']] = []
        user_starred_messages = CHANNELS["Starred Messages"][1][data['username']]
        #refactor these two lines
    finally:
        #we then append to that list the list of [channel,message_type,message_content,username_of_sender]
        user_starred_messages.append([data['channel'],data['type_of_message'],data['message_content'],data['username_of_message']])
    print(f"the user now has the follwong starred messages {user_starred_messages}")

@socketio.on('userdata')
def user_data(data):
    if 'username' in data:
        username = data['username']
        USERS[username] = request.sid #request socket ID
        emit('new user', data, broadcast=True)

@socketio.on('new channels')
def new_channel(data):
    if data['name'] in CHANNELS:
        return False
    else:
        print(CHANNELS)
        if data['privacy'] == "private":
            #[status, [all the messages], public/private , [members]]
            CHANNELS[data['name']] = [data['channel_status'],[], "private", [data['username']]]
            emit('new private channel', { "name" : data['name'], "channel_status": data['channel_status']}, room=request.sid)
        else:
            #public channel
            CHANNELS[data['name']] = [data['channel_status'],[], "public",]
            emit('new public channel', { "name" : data['name'], "channel_status": data['channel_status']}, broadcast=True)

@socketio.on('new direct message')
def new_direct_message(data):
    username_of_sender = data['username']
    username_of_recipient = data['recipient']
    name_of_channel = f"{username_of_sender} -> {username_of_recipient}"
    CHANNELS[name_of_channel] = [f"A Private chat between {username_of_sender} and {username_of_recipient} ",[], "private", [username_of_sender,username_of_recipient]]
    

@socketio.on('new msg')
def new_msg(data):
    if 'channel' in data:
        data['created_at'] = int(time.time())
        CHANNELS[data['channel']][1].append(data)
        print(data)
        #data['username'] is the username of the person who sent the message
        emit('msg', data, broadcast=True)

@socketio.on('get channels')
def get_channels(username):
    custom_list = []
    for key in CHANNELS:
        if CHANNELS[key][2] == "public":
            custom_list.append([key,CHANNELS[key][0]])
        else:
            if username['username'] in CHANNELS[key][3]:
                custom_list.append([key,CHANNELS[key][0]])

    #custom_list is a list of pairs of channel_name,channel_status
    emit('channels', custom_list)

@socketio.on('join private room')
def join_private_room(data):
    #data has username and room_id
    #this logic will be changed when you implement the random string bullshit
    for key in CHANNELS:
        if data['room_id'] == key:
            #the user will join the room
            CHANNELS[data['room_id']][3].append(data['username'])
    get_channels(data['username'])


@socketio.on('get users')
def get_users():
    emit('users', list(USERS.keys()))

@socketio.on('get msgs')
def get_msgs(data):
    if 'name' in data:
        emit('msgs', CHANNELS[data['name']][1])


@socketio.on('delete message')
def delete_message(data):
    #delete the message from the list of messages!
    del CHANNELS[data['channel']][1][data['id']]
    return

@socketio.on('get starred messages')
def get_starred_messages(data):
    if 'username' in data:
        try:
            #send the starred messages
            data_to_send = CHANNELS["Starred Messages"][1][data['username']] #this is basically a collection of the user's starred messages
            emit('starred messages', data_to_send)

        except:
            #if they do not have any, send an empty list
            emit('starred messages', [["", "No messages have been starred", ""]])


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 5000)) , debug = True)
