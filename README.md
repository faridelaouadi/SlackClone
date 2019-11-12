# Project 2

Web Programming with Python and JavaScript, Slack-like clone

How to use:

1. First Enter your Username to start chatting
2. You can create new channel by naming something diffrent than already listed
3. You can chat on channel you desire
4. You can close the tab, and come back to where you left off

How it works:

1. Client registers new user with GUI
2. Socket is initiaited
3. Client sends the server the username
4. The server registers this username into the dictionary as the pair { username : socket_id }
  4a. The socketID is a unique way to identify each client connection to the server
5. Client side, we add event listeners to the “add new channel” form and the “new message” form.
  5a. If new channel is submitted, we emit to the server the name of the new channel
    5ai. The server adds new channel to the dictionary as the pair { name : msgs }
  5b. If a new message is sent, we emit to the server the data required
    5bi. The server appends this message to the list in the channels dictionary
6. The client then calls the “get channels” function on the server. What this does is send a list of all the channel names to only the client that requested it. What it does is basically clear all the names of the channel from the LHS of the screen. Then it loops through all the names of the channels and adds an event listener on their button.
7. When the button is clicked the following happens:
  7a. Local storage has the channel name modified
  7b. We request the list of messages from the server which it returns.
  7c. We then clear all the messages from the canvas (just incase we had other channel messages on their) and render the message list we just retrieved.
  7d. Styling is done here to ensure that sent messages are blue and on the RHS and messages that are received are green and on the LHS.
8. The client then changes the message title through using the function “change_msg_title”.
  8a. We basically just access an HTML element and modify it
9. The client then modifies the channel list by making the active channel coloured blue. This is done by using the query selector All for the list elements that are children of the “channel form” element. Lovely. 
