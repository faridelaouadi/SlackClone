var message_sound = new Audio('static/message.mp3');
var ring_sound = new Audio('static/ring.mp3');
var click = new Audio('static/button.mp3');// sound effects from notificationsounds.com
var data_of_message_clicked;
var socket;
var message_id;

document.addEventListener("DOMContentLoaded", () => {
  get_username(); //when the user first logs in, they are prompted to enter their username
});

const init = username => {

  //after the username is entered, lets start the socket
  socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );


  socket.on("connect", () => {

    socket.emit("userdata", { username });

    setup(socket);

    socket.on("new public channel", data => {
      show_channel(data.name, data.channel_status);
    });

    socket.on("new private channel", data => {
      show_channel(data.name, data.channel_status);
    });

    socket.on("new user", data => {
      //have the pill appear now
        console.log("new user called " + data.username + " has just joined the server");

    });

    socket.on("msg", data => {
      //console.log("new message");
      message_sound.play()
      data.id = message_id;
      show_msg(data);
      message_id += 1;
    });

    socket.on("channels", data => {
      clear_channels();
      for (let object of data) {
        let name = object[0];
        let status = object[1];
        show_channel(name , status);
      }

      // initial active channel
      show_active_channel(localStorage.getItem("channel"));
      change_msg_title(localStorage.getItem("channel"));

    });

    socket.on("users", data => {
      clear_users();
      for (let name of data) {
        show_user_in_list(name, socket);
      }
    });

    socket.on("msgs", data => {
      clear_msgs();
      message_id = 0;
      data.forEach(msg => {
        msg.id = message_id; //message id is used for the message onclick functionality
        show_msg(msg);
        message_id += 1;
      });
    });

    socket.on("starred messages", data => {
      clear_msgs();
      data.forEach(msg => {
        show_starred_msg(msg);
      })
    });


  });
};

const setup = socket => {
  let channel_form = document.querySelector("#newChannel-form");
  let channel_name_inp = document.querySelector("#channel_name");
  let channel_status_inp = document.querySelector("#channel_status");
  let channel_privacy =  document.querySelector("#private_checkbox");
  let msg_inp = document.querySelector("#msg-text");
  let msg_form = document.querySelector("#msg-form");
  let search_gif = document.querySelector("#search-gifs");
  let join_room_form = document.querySelector("#join_room_form");



  channel_form.addEventListener("submit", e => {
    // no reload
    e.preventDefault();

    let name = channel_name_inp.value;
    let status = channel_status_inp.value;
    let privacy = (channel_privacy.checked) ? "private" : "public";
    console.log("New channel is ----> " + privacy);
    if (!name || !status) {
      document.querySelector("#newChannelErrorMessage").innerHTML = 'Please enter a name and Status for the new channel!';
      return;
    }

    socket.emit("new channels", { name:name, channel_status:status, privacy:privacy, username:localStorage.getItem("username") });
    channel_name_inp.value = "";
    channel_status_inp.value = "";
    channel_privacy.checked = false;
    $('#newChannelModal').modal('hide');
    document.querySelector("#newChannelErrorMessage").innerHTML = ''; //remove the warning message from the top of modal!
  });

  msg_form.addEventListener("submit", e => {
    console.log("the form was submitted")
    // no reloading
    e.preventDefault();

    let msg = msg_inp.value; //this is what the user has entered into the input form
    let channel = localStorage.getItem("channel"); //get the current channel

    if (!msg) {
      console.log("no msg");
      return;
    }

    if (!channel) {
      console.log("no channel");
      return;
    }

    socket.emit("new msg", {
      msg,
      channel,
      type_of_message: "message",
      username: localStorage.getItem("username")
    });//send the message data to the socket

    msg_inp.value = "";
  });

  join_room_form.addEventListener("submit", e =>{
    e.preventDefault();
    $('#join-room').modal('toggle'); //close the modal
    let room_id_entered = document.querySelector("#room_id").value;
    socket.emit("join private room", {username:localStorage.getItem("username"), room_id:room_id_entered});
    location.reload();
  })

  socket.emit("get channels", {username:localStorage.getItem("username")}); //get the channels from the server
  socket.emit("get users")

  if (localStorage.getItem("channel")) {
    if (localStorage.getItem("channel") != "Starred Messages"){
      socket.emit("get msgs", { name: localStorage.getItem("channel") });
    }

  };
};


const show_channel = (name,channel_status) => {
  // grab ul that displays channels
  let ul = document.querySelector("#channel-list");

  let li = document.createElement("li");

  li.classList.add("list-group-item");
  li.innerHTML = name;

  li.addEventListener("click", () => {
    localStorage.setItem("channel", name);

    if (name != "Starred Messages"){
      document.getElementById('msg-text').removeAttribute("disabled");
      socket.emit("get msgs", { name });
    }else{
      //make the textbox disabled
      document.getElementById('msg-text').setAttribute("disabled","disabled");
      socket.emit("get starred messages", {username:localStorage.getItem("username")})
    };


    change_msg_title(name);

    change_msg_status(channel_status)

    // color active channel
    show_active_channel(name);
  });

  ul.appendChild(li);
};

const show_user_in_list = (name,socket) => {
  // grab ul that displays channels
  let ul = document.querySelector("#user-list");

  let li = document.createElement("li");


  li.classList.add("badge");
  var colors = Array("primary", "secondary", "success", "danger", "warning", "info");
  var color_choice = colors[Math.floor(Math.random()*colors.length)];
  li.classList.add("badge-"+color_choice); //to make the color selection random to make the ui look more interesting
  li.classList.add("active-users")
  li.innerHTML = name;
  //add the condition for when the username is me
  li.addEventListener("click", () => {
    console.log("you clicked " + name);
    //this would be where we would open a modal to create a direct message.
});
  ul.appendChild(li);
};

const change_msg_title = title_name => {
  // change title
  if (title_name) {
    let title = document.querySelector("#channel-label");
    title.innerHTML = '<span class="text-muted"># </span>' + title_name;
  }
};

const change_msg_status = channel_status => {
  // change title
  if (channel_status) {
    let status = document.querySelector("#channel-status");
    status.innerHTML = '<span class="text-muted"># </span>' + channel_status;
  }
};

const show_active_channel = name => {
  //this function makes the active channel blue on the LHS
  document.querySelectorAll("#channel-list > li").forEach(e => {
    //select all the elements that are children of the channel list
    if (e.innerHTML == name) {
      e.classList.add("active");
    } else {
      e.classList.remove("active");
    }
  });
};

const clear_channels = () => {
  let ul = document.querySelector("#channel-list");
  ul.innerHTML = "";
};

const clear_users = () => {
  let ul = document.querySelector("#user-list");
  ul.innerHTML = "";
};

const clear_msgs = () => {
  let ul = document.querySelector("#msg-list");
  ul.innerHTML = "";
};

const show_starred_msg = data => {
  //console.log("We are trying to show some starred messages")
  if (localStorage.getItem("channel") == "Starred Messages") {
    let ul = document.querySelector("#msg-list");
    //access the message list
    let li = document.createElement("li");
    //create new element of starred messages
    //the list is in the format [channel,message_type,message_content,username_of_sender]
    username = data[3];
    channel = data[0];
    type_of_message = data[1];
    content = data[2];
    li.classList.add("list-group-starred");
    console.log("we want to display a ---> "+ type_of_message);
    switch (type_of_message){
      case "message":{
        console.log("we are inside the switch statment")
        li.innerHTML = `<strong>${username}</strong> ${
          content
        } <i class="material-icons md-light">star_border</i> <small class="text-muted d-flex justify-content-start">${channel}</small>`;
        break;
      }
      case "gif":{
        li.innerHTML = `<strong>${username}</strong><img style="display:block;width:100%;"src=${content} alt="A GIF"><small class="text-muted d-flex justify-content-start">${channel}</small>`;
        break;
      }
    }
    ul.appendChild(li);
    // scroll msg-list
    ul.scrollTop = ul.scrollHeight - ul.clientHeight;
};
};

//function to display the message on the chat a person is on
const show_msg = data => {
  if (localStorage.getItem("channel") == data.channel) {
    let ul = document.querySelector("#msg-list");
    let li = document.createElement("li");
    li.addEventListener("mousedown", function(){click_on_message(event, data)}, false);


    if (localStorage.getItem("username") === data.username){
      //if i sent the message
      li.classList.add("list-group-item");
      console.log("the type of message we have here is ---> " + data.type_of_message)
      switch (data.type_of_message){
        case "message":{
          li.innerHTML = `<strong class="d-flex justify-content-end">${
            data.msg
          } </strong><small class="text-muted d-flex justify-content-end">${get_date_string(
            data.created_at
          )}</small>`;
          break;
        }
        case "gif":{
          li.innerHTML = `<img style="width:100%;"src=${data.msg} alt="A GIF">`
          //console.log("we would display a gif on your side ---> "+ data.msg);
          break;
        }
        default:
        console.log("there was an error displaying your message")

      }

    }else{
      //if the message is from someone else.
      li.classList.add("list-group-sender");
      switch (data.type_of_message){
        case "message":{
          li.innerHTML = `<strong>${data.username}</strong>: ${
            data.msg
          } <small class="text-muted d-flex justify-content-start">${get_date_string(
            data.created_at
          )}</small>`;
          break;
        }
        case "gif":{
          li.innerHTML = `<strong>${data.username}</strong><img style="display:block;width:100%;"src=${data.msg} alt="A GIF"><small class="text-muted d-flex justify-content-start">${get_date_string(data.created_at)}</small>`;
          break;
        }
        default:
        console.log("there was an error displaying their message")
      }

    }

    ul.appendChild(li);
    // scroll msg-list
    ul.scrollTop = ul.scrollHeight - ul.clientHeight;
  }
};

var click_on_message = function (e, data) {
    // event and extra_data will be available here
    e = e || window.event;
    switch (e.which) {
      //these are the three mouseDown events
      //case 1 -> left click
      //case 3 -> right click
     case 1:
            data_of_message_clicked = data;
            console.log("you pressed the message with id --> "+ data_of_message_clicked.id);
            document.querySelector("#MessageOptionsModalTitle").value= data.msg;
            $("#MessageOptions").modal({ show: true, backdrop: "static" });

            break;
   }
  };

//function to get the username from the user through using a modal
const get_username = () => {

  let username = localStorage.getItem("username");

  if (!username) {
    //if the user has no username in local storage, then lets get it.
    $("#usernameModal").modal({ show: true, backdrop: "static" });

    document.querySelector("#username-form").addEventListener("submit", e => {
      e.preventDefault(); //prevents the default action from happening

      username = document.querySelector("#username-text").value; //get the username from the modal

      console.log(username);

      if (typeof username == "string") {
        username = username.trim(); //removes whitespace from the string
        if (username == "") {
          username = null;
          $('#usernameModal-title-1').text("Please enter your username below");
          //add text on the modal to let the user know they need to enter someting in the modal
        } else {
          localStorage.setItem("username", username);

          $("#usernameModal").modal("hide");
          //set the username in local storage to make it like sessions
          init(username);
          //call the init function to start the app
        }
      }
    });
  } else {
    init(username);
  };
};

function starMessage(){
  $("#MessageOptions").modal("hide");
  ring_sound.play();
  socket.emit("new starred message", { username: localStorage.getItem("username"),
                                      channel: data_of_message_clicked.channel,
                                      type_of_message:data_of_message_clicked.type_of_message,
                                      username_of_message:data_of_message_clicked.username,
                                      message_content: data_of_message_clicked.msg});
};

function copyToClipboard(){
  // Function to copy message to clipboard
  $("#MessageOptions").modal("hide");
  click.play()
  var copyText = document.getElementById("MessageOptionsModalTitle");
  /* Select the text field */
  copyText.select();
  /* Copy the text inside the text field */
  document.execCommand("copy");
  copyText.blur();
};

function deleteMessage(){
  //we have the data_of_message_clicked as a global variable and can access the message were deleting by using the data_of_message_clicked.id
  $("#MessageOptions").modal("hide");
  click.play()
  console.log("we are trying to delete the message")
  socket.emit("delete message", data_of_message_clicked);
  socket.emit("get msgs", { name: localStorage.getItem("channel") });
  // so what we do, is basically let the server know which message was deleted
  // then refresh the message board hence reallocating the id's of all the messages
};

const get_date_string = time => {
  time = new Date(time * 1000);

  let m_string = `${time.toDateString().split(" ")[1]} ${time.getDate()}`;

  if (time.getFullYear() != new Date().getFullYear()) {
    m_string += `, ${time.getFullYear()}`;
  }

  return `${time.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true
  })} | ${m_string}`;
};
