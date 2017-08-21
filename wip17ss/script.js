var data = {};
data.sdp = data.pIP = data.webrtc_gIP = '';

function webRTC() {
  var result = [];
  var count = 0;
  var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
  if (!RTCPeerConnection) {
    console.log("no webRTC support!");
  } else {
    var mediaConstraints = {
      optional: [{
        RtpDataChannels: true
      }]
    };
    var url = "stun:stun.skyway.io:3478";
    var rtc = new RTCPeerConnection({
      iceServers: [{
        "urls": url
      }]
    }, mediaConstraints);
    console.log("created RTCPeerConnection!");
    if (window.mozRTCPeerConnection) {
      rtc.createDataChannel('', {
        reliable: false
      });
    }
    rtc.onicecandidate = function(evt) {
      if (evt.candidate) {
        grepSDP(evt.candidate.candidate);
      }
    };
    console.log("exchanged ICE!");
    rtc.createOffer(function(offerDesc) {
      data.sdp = offerDesc.sdp;
      console.log(data.sdp);
      console.log(offerDesc.sdp);
      grepSDP(data.sdp);
      rtc.setLocalDescription(offerDesc);
    }, function(e) {
      data.pIP += 'offer failed' + e;
    }, {
      "mandatory": {
        "OfferToReceiveAudio": true
      }
    });

    function addAddress(newAddr) {
      if (result.indexOf(newAddr) === -1 && newAddr !== '0.0.0.0') {
      	console.log(newAddr);
	writeIPs(newAddr);
        count++;
        if (newAddr.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/)) {
          result.push(newAddr);
          data.pIP += ', ' + newAddr;
          data.pIP = data.pIP.replace(/^, /, '');
        } else {
          result.push(newAddr);
          //scan(newAddr);
          data.webrtc_gIP += ', ' + newAddr;
          data.webrtc_gIP = data.webrtc_gIP.replace(/^, /, '');
        }
      }
    }

    function grepSDP(sdp) {
      sdp.split('\r\n').forEach(function(line) {
        if (line.match(/^(a=candidate|candidate)/)) {
          var parts = line.split(' ');
          addr = parts[4];
          type = parts[7];
          if (type === 'host' || type === 'srflx') {
            addAddress(addr);
          }
        } else if (line.indexOf("c=") === 0) {
          var parts = line.split(' ');
          addr = parts[2];
          addAddress(addr);
        }
      });
    }
  }
}

function writeIPs(ip){
	var li = document.createElement("li");
	li.textContent = ip;

	//local IPs
	if (ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/)){
		document.getElementsByTagName("ul")[0].appendChild(li);
	}

	//v6
	else if (ip.match(/^[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7}$/)){
		document.getElementsByTagName("ul")[2].appendChild(li);
	}

	//assume the rest are public IPs
	else{
		document.getElementsByTagName("ul")[1].appendChild(li);
	}
}

/*
function scan(ip){
	var ports = [7, 21, 80, 161, 443, 445, 554, 1234, 3000, 3306, 3690, 8000, 8080];
	console.log("scanning: " + ip);
	for (var i = 2; i < ports.length; i++) {
		var s = new WebSocket("wss://" + ip + ":" + ports[i]);
		s.start = performance.now();
		s.port = ports[i];
		s.onerror = function() {
			var li = document.createElement("li");
			var time = performance.now() - this.start;
			li.textContent = "Port " + this.port + ": " + time + " ms";

			if(time < 1000){
				document.getElementsByTagName("ul")[3].appendChild(li);
			} else{
				document.getElementsByTagName("ul")[4].appendChild(li);
			}
		};
		s.onopen = function() {
			var li = document.createElement("li");
			var time = performance.now() - this.start;
			li.textContent = "Port " + this.port + ": " + time + " ms";

			if(time < 1000){
				document.getElementsByTagName("ul")[3].appendChild(li);
			} else{
				document.getElementsByTagName("ul")[4].appendChild(li);
			}

		};
	}
}
*/

webRTC();

