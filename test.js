// Create a request variable and assign a new XMLHttpRequest object to it.
var request = new XMLHttpRequest()

// Open a new connection, using the GET request on the URL endpoint
request.open('GET', 'https://api.giphy.com/v1/gifs/search?api_key=ZsDhKYMNVtzRxcbGwrOBKhNElDE4ZRDv&q=nav&limit=25&offset=0&rating=G&lang=en', true)

request.onload = function() {
  // Begin accessing JSON data here
  var data = JSON.parse(this.response);
  if (request.status >= 200 && request.status < 400) {
    //console.log(data["data"][0]["images"]["hd"]["mp4"])
    data["data"].forEach(value => {
      var img = document.createElement('img');
      img.src =  value["images"]["downsized_medium"]["url"];
      document.getElementById("modalBody").appendChild(img);
    })
}
};

// Send request
request.send()
