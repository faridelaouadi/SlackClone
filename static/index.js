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
      show_channel(data.name, socket);
    });

    socket.on("new user", data => {
        console.log("new user in this bitchhhhhh with name ---->  " + data.username);
        //show_new_user(data.username);

    });

    socket.on("msg", data => {
      show_msg(data);
    });

    socket.on("channels", data => {
      clear_channels();
      for (let c of data) {
        show_channel(c, socket);
      }

      // initial active channel
      show_active_channel(localStorage.getItem("channel"));
      change_msg_title(localStorage.getItem("channel"));

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

    if (!name) {
      console.log("no name");
      return;
    }

    socket.emit("new channel", { name });

    channel_name_inp.value = "";
    channel_status_inp.value = "";
    $('#newChannelModal').modal('hide');
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

  if (localStorage.getItem("channel")) {
    socket.emit("get msgs", { name: localStorage.getItem("channel") });
  }
};

const show_new_user = (username) =>{

  document.getElementById("toast_message").innerHTML = username + " joined the server";
  $("#myToast").toast({
        delay: 5000
    });
  $("#myToast").toast('show');
}

const show_channel = (name, socket) => {
  // grab ul that displays channels
  let ul = document.querySelector("#channel-list");

  let li = document.createElement("li");

  li.classList.add("list-group-item");
  li.innerHTML = name;

  li.addEventListener("click", () => {
    localStorage.setItem("channel", name);

    socket.emit("get msgs", { name });

    change_msg_title(name);

    // color active channel
    show_active_channel(name);
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

const clear_msgs = () => {
  let ul = document.querySelector("#msg-list");
  ul.innerHTML = "";
};

const show_msg = data => {
  if (localStorage.getItem("channel") == data.channel) {
    let ul = document.querySelector("#msg-list");
    let li = document.createElement("li");



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
