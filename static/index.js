var audio = new Audio('static/message.mp3');


document.addEventListener("DOMContentLoaded", () => {

  get_username(); //when the user first logs in, they are prompted to enter their username
});

const init = username => {

  //after the username is entered, lets start the socket
  let socket = io.connect(
    location.protocol + "//" + document.domain + ":" + location.port
  );

  socket.on("connect", () => {

    socket.emit("userdata", { username });

    setup(socket);

    socket.on("new channel", data => {
      show_channel(data.name, data.channel_status, socket);
    });

    socket.on("new user", data => {
        console.log("new user called " + data.username + " has just joined the server");

    });

    socket.on("msg", data => {
      console.log("new message");
      audio.play()
      show_msg(data);
    });

    socket.on("channels", data => {
      clear_channels();
      for (let object of data) {
        let name = object[0];
        let status = object[1];
        show_channel(name , status, socket);
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
      data.forEach(msg => {
        show_msg(msg);
      });
    });
  });
};

const setup = socket => {
  let channel_form = document.querySelector("#newChannel-form");
  let channel_name_inp = document.querySelector("#channel_name");
  let channel_status_inp = document.querySelector("#channel_status");
  let msg_inp = document.querySelector("#msg-text");
  let msg_form = document.querySelector("#msg-form");



  channel_form.addEventListener("submit", e => {
    // no reload
    e.preventDefault();

    let name = channel_name_inp.value;
    let status = channel_status_inp.value;

    if (!name || !status) {
      document.querySelector("#newChannelErrorMessage").innerHTML = 'Please enter a name and Status for the new channel!';
      return;
    }

    socket.emit("new channel", { name:name, channel_status:status });
    channel_name_inp.value = "";
    channel_status_inp.value = "";
    $('#newChannelModal').modal('hide');
    document.querySelector("#newChannelErrorMessage").innerHTML = ''; //remove the warning message from the top of modal!
  });

  msg_form.addEventListener("submit", e => {
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
      username: localStorage.getItem("username")
    });//send the message data to the socket

    msg_inp.value = "";
  });

  socket.emit("get channels");
  socket.emit("get users")

  if (localStorage.getItem("channel")) {
    socket.emit("get msgs", { name: localStorage.getItem("channel") });
  }
};


const show_channel = (name,channel_status, socket) => {
  // grab ul that displays channels
  let ul = document.querySelector("#channel-list");

  let li = document.createElement("li");

  li.classList.add("list-group-item");
  li.innerHTML = name;

  li.addEventListener("click", () => {
    localStorage.setItem("channel", name);

    socket.emit("get msgs", { name });

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

const show_msg = data => {
  if (localStorage.getItem("channel") == data.channel) {
    let x = "hello world ";
    let ul = document.querySelector("#msg-list");
    let li = document.createElement("li");
    li.addEventListener("mousedown", function(){click_on_message(event, data)}, false);


    if (localStorage.getItem("username") === data.username){
      //if i sent the message
      li.classList.add("list-group-item");

      li.innerHTML = `<strong class="d-flex justify-content-end">${
        data.msg
      } </strong><small class="text-muted d-flex justify-content-end">${get_date_string(
        data.created_at
      )}</small>`;

    }else{
      //if the message is from someone else.
      li.classList.add("list-group-sender");
      li.innerHTML = `<strong>${data.username}</strong>: ${
        data.msg
      } <small class="text-muted d-flex justify-content-start">${get_date_string(
        data.created_at
      )}</small>`;
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
  }
};

function copyToClipboard(){
  // Function to copy message to clipboard
  console.log("we will be copying : ----> " + document.getElementById("MessageOptionsModalTitle").value);
  var copyText = document.getElementById("MessageOptionsModalTitle");
  /* Select the text field */
  copyText.select();
  /* Copy the text inside the text field */
  document.execCommand("copy");
  copyText.blur();
}

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
