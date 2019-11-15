function searchGifs(){


// Create a request variable and assign a new XMLHttpRequest object to it.
var request = new XMLHttpRequest()

// Open a new connection, using the GET request on the URL endpoint
var query = document.getElementById("text").value

request.open('GET', 'https://api.giphy.com/v1/gifs/search?api_key=ZsDhKYMNVtzRxcbGwrOBKhNElDE4ZRDv&q='+query+'&limit=25&offset=0&rating=G&lang=en', true)

request.onload = function() {
  // Begin accessing JSON data here
  var data = JSON.parse(this.response);
  if (request.status >= 200 && request.status < 400) {
    //console.log(data["data"][0]["images"]["hd"]["mp4"])
    data["data"].forEach(value => {
      //console.log(value)
      var img = document.createElement('img');
      img.src =  value["images"]["fixed_height_downsampled"]["url"];
      img.style.margin = "5px";
      img.addEventListener("click", () => {
        console.log("you clicked the image with link ---> " + img.src);
      });
      document.getElementById("gifModalBody").appendChild(img);
    })
    //show modal
    $("#gifModal").modal();
}
};

// Send request
request.send()
};

function closeGifModal(){
  document.getElementById("gifModalBody").innerHTML = "";
  //this is the same as doing .innerHTML = '' however it is faster apparently
  $('#gifModal').modal('toggle');
}
