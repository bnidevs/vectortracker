#!/bin/bash
gst-launch-1.0 v4l2src do-timestamp=TRUE device=/dev/video2 ! image/jpeg,width=1920,height=1080,framerate=30/1 ! jpegdec ! x264enc  bframes=0 key-int-max=45 bitrate=500 ! video/x-h264,stream-format=avc,alignment=au,profile=baseline ! kvssink stream-name="vectortrackervideostream" storage-size=512 access-key="<AWS ACCESS KEY>" secret-key="<AWS SECRET KEY>" aws-region="us-east-1"
