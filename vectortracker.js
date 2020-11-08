var bucketName = "vectortrackersagemaker";
AWS.config.region = 'us-east-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:723c4a84-9a11-4b9d-90c4-d55045b15616',
});

var s3 = new AWS.S3();

window.onload = () => {
	init();
}

var init = () => {
	s3.getObject({Bucket: bucketName, Key: "names.txt", ResponseContentType: "text/plain"}, function(err,data) {
		if (err){console.log(err, err.stack);}
		else{
			let split_data = new TextDecoder("utf-8").decode(data["Body"]).split("\n");
			var sidebar = document.getElementById("video_sidebar");
			for(var i = 0; i < 100; i++){
				let t = document.createElement("button");
				t.classList.add("sidebar_button");
				const video_seg = split_data[i];
				let n = document.createTextNode(split_data[i]);
				t.addEventListener("click", function(){sub_video(video_seg)});
				t.appendChild(n);
				sidebar.appendChild(t);
			}
		}
	});
}

var sub_video = (name) => {
	var elems = document.getElementsByClassName("object_outline");

	if(elems.length > 0){
		while(elems[0]) {
		    elems[0].parentNode.removeChild(elems[0]);
		}
	}

	var vid_elem = document.getElementById("video_element");
	vid_elem.remove();

	var new_vid = document.createElement('video');
	new_vid.setAttribute("id", "video_element");
	new_vid.src = "https://vectortrackersagemaker.s3.amazonaws.com/webms/" + name;
	new_vid.controls = true;
	document.getElementById("video_container").appendChild(new_vid);

	name = name.substring(0,name.length - 5)
	s3.getObject({Bucket: "vectortrackersagemaker", Key: "texts/" + name + ".txt", ResponseContentType: "application/json"}, function(err,data) {
		if (err){console.log(err, err.stack);}
		else{

			var infs = JSON.parse(new TextDecoder("utf-8").decode(data["Body"]))["sageMakerOutput"];
			for(var i = 0; i < infs.length; i++){
				let outline = document.createElement("div");
				outline.classList.add("object_outline");
				let scaled_dims = scale(infs[i]["right"],infs[i]["bottom"],infs[i]["top"],infs[i]["left"]);
				outline.style.top = scaled_dims[0];
				outline.style.left = scaled_dims[1];
				outline.style.width = scaled_dims[2];
				outline.style.height = scaled_dims[3];
				let outline_label = document.createElement("mark");
				let label_text = document.createTextNode(infs[i]["id"]);
				outline_label.appendChild(label_text);
				outline.appendChild(outline_label);

				document.getElementById("video_container").appendChild(outline);
			}
		}
	});
}

var scale = (right, bottom, top, left) => {
	// var hfactor = document.getElementById("video_container").offsetHeight/1080;
	// var wfactor = document.getElementById("video_container").offsetWidth/1920;

	// top *= hfactor;
	// left *= wfactor;

	width = (right - left)// * wfactor;
	height = (bottom - top)// * hfactor;

	return [top, left, width, height];
}