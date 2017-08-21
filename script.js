//get the IP addresses associated with an account
function getIPs(callback){
	var ip_dups = {};

	//compatibility for firefox and chrome
	var RTCPeerConnection = window.RTCPeerConnection
		|| window.mozRTCPeerConnection
		|| window.webkitRTCPeerConnection;
	var useWebKit = !!window.webkitRTCPeerConnection;

	//bypass naive webrtc blocking using an iframe
	if(!RTCPeerConnection){
		//NOTE: you need to have an iframe in the page right above the script tag
		//
		//<iframe id="iframe" sandbox="allow-same-origin" style="display: none"></iframe>
		//<script>...getIPs called in here...
		//
		var win = iframe.contentWindow;
		RTCPeerConnection = win.RTCPeerConnection
			|| win.mozRTCPeerConnection
			|| win.webkitRTCPeerConnection;
		useWebKit = !!win.webkitRTCPeerConnection;
	}

	//minimal requirements for data connection
	var mediaConstraints = {
		optional: [{RtpDataChannels: true}]
	};

	var servers = {iceServers: [{urls: "stun:stun.services.mozilla.com"}]};

	//construct a new RTCPeerConnection
	var pc = new RTCPeerConnection(servers, mediaConstraints);

	function handleCandidate(candidate){
		//match just the IP address
		var ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/
		var ip_addr = ip_regex.exec(candidate)[1];
		console.log(candidate);

		//remove duplicates
		if(ip_dups[ip_addr] === undefined)
			callback(ip_addr);

		ip_dups[ip_addr] = true;
	}

	//listen for candidate events
	pc.onicecandidate = function(ice){

		//skip non-candidate events
		if(ice.candidate)
			handleCandidate(ice.candidate.candidate);
	};

	//create a bogus data channel
	pc.createDataChannel("");

	//create an offer sdp
	pc.createOffer(function(result){

			//trigger the stun server request
		pc.setLocalDescription(result, function(){}, function(){});

	}, function(){});

	//wait for a while to let everything done
	setTimeout(function(){
			//read candidate info from local description
			var lines = pc.localDescription.sdp.split('\n');
			console.log(pc.localDescription.sdp);

			lines.forEach(function(line){
					if(line.indexOf('a=candidate:') === 0)
					handleCandidate(line);
					});
			}, 1000);
}

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

getIPs(function(ip){
	var li = document.createElement("li");
	li.textContent = ip;

	//local IPs
	if (ip.match(/^(192\.168\.|169\.254\.|10\.|172\.(1[6-9]|2\d|3[01]))/)){
		scan(ip);

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
});
